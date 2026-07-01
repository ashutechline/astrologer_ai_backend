const j2s = require('joi-to-swagger');

function extractEndpoints(router, prefix = '') {
  let endpoints = [];
  router.stack.forEach((layer) => {
    if (layer.route) {
      const path = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods);
      const middlewares = layer.route.stack.map(s => s.handle);

      const endpoint = {
        path: path.replace(/\/+/g, '/'), // fix double slashes
        methods,
        schemaObj: null,
        requiresAuth: false
      };

      middlewares.forEach(m => {
        if (m.name === 'requireAuth') endpoint.requiresAuth = true;
        if (m._schema) endpoint.schemaObj = m._schema;
      });

      endpoints.push(endpoint);
    } else if (layer.name === 'router' && layer.handle.stack) {
      let layerPrefix = '';
      if (!layer.regexp.fast_slash) {
        const m = layer.regexp.source.match(/^\^\\(.*?)\\\/?/);
        if (m) {
          layerPrefix = '/' + m[1].replace(/\\/g, '');
          // Strip exact `?(?=` string from regex-generated path segments
          layerPrefix = layerPrefix.replace(/\?\(\?=/g, '');
          layerPrefix = layerPrefix.replace(/\/+/g, '/'); // cleanup
        }
      }
      endpoints = endpoints.concat(extractEndpoints(layer.handle, prefix + layerPrefix));
    }
  });
  return endpoints;
}

function generateSwagger(app) {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: 'Cosmic AI API',
      version: '1.0.0',
      description: 'Automatically generated API documentation reflecting Joi validation schemas.'
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local Server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {}
    },
    paths: {}
  };

  // Find the base API router, usually mounted at /v1 or /api/v1
  // We'll traverse app._router.stack
  const endpoints = extractEndpoints(app._router, '');

  endpoints.forEach(ep => {
    // Convert express params /:id to swagger /{id}
    const swaggerPath = ep.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

    ep.methods.forEach(method => {
      if (!swagger.paths[swaggerPath]) swagger.paths[swaggerPath] = {};

      const operation = {
        summary: `${method.toUpperCase()} ${swaggerPath}`,
        responses: {
          '200': { description: 'Successful response' },
          '400': { description: 'Bad request / Validation error' }
        }
      };

      // Tags based on first significant path segment
      const segments = swaggerPath.split('/').filter(Boolean);
      let tag = 'General';
      if (segments.length > 0) {
        tag = segments[0] === 'v1' && segments.length > 1 ? segments[1] : segments[0];
      }
      operation.tags = [tag.charAt(0).toUpperCase() + tag.slice(1)];

      if (ep.requiresAuth) {
        operation.security = [{ bearerAuth: [] }];
        operation.responses['401'] = { description: 'Unauthorized' };
      }

      operation.parameters = [];

      if (ep.schemaObj) {
        // Path parameters
        if (ep.schemaObj.params) {
          const { swagger: paramsSchema } = j2s(ep.schemaObj.params);
          Object.keys(paramsSchema.properties || {}).forEach(key => {
            operation.parameters.push({
              name: key,
              in: 'path',
              required: paramsSchema.required ? paramsSchema.required.includes(key) : true,
              schema: paramsSchema.properties[key]
            });
          });
        }

        // Query parameters
        if (ep.schemaObj.query) {
          const { swagger: querySchema } = j2s(ep.schemaObj.query);
          Object.keys(querySchema.properties || {}).forEach(key => {
            operation.parameters.push({
              name: key,
              in: 'query',
              required: querySchema.required ? querySchema.required.includes(key) : false,
              schema: querySchema.properties[key]
            });
          });
        }

        // Request Body
        if (ep.schemaObj.body) {
          const { swagger: bodySchema } = j2s(ep.schemaObj.body);
          operation.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: bodySchema
              }
            }
          };
        }
      }

      // Ensure all path variables are in parameters even if not validated by Joi
      const pathVars = ep.path.match(/:([a-zA-Z0-9_]+)/g);
      if (pathVars) {
        pathVars.forEach(v => {
          const varName = v.substring(1);
          if (!operation.parameters.find(p => p.name === varName && p.in === 'path')) {
            operation.parameters.push({
              name: varName,
              in: 'path',
              required: true,
              schema: { type: 'string' }
            });
          }
        });
      }

      if (operation.parameters.length === 0) delete operation.parameters;

      swagger.paths[swaggerPath][method] = operation;
    });
  });

  return swagger;
}

module.exports = generateSwagger;
