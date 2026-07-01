const app = require('./src/app');

function extractEndpoints(router, prefix = '') {
  let endpoints = [];
  router.stack.forEach((layer) => {
    if (layer.route) {
      const path = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods);
      const middlewares = layer.route.stack.map(s => s.handle);
      endpoints.push({ path, methods, middlewares });
    } else if (layer.name === 'router' && layer.handle.stack) {
      let layerPrefix = '';
      if (layer.regexp.source !== '^\\/?$') {
        // Express 4: ^\/auth\/?(?=\/|$)
        const m = layer.regexp.source.match(/^\^\\(.*?)\\\/?(?=\/|$)/) || layer.regexp.source.match(/^\^\\(.*?)\\\//);
        if (m) {
          layerPrefix = '/' + m[1].replace(/\\/g, '');
          // Remove double slashes if any
          layerPrefix = layerPrefix.replace(/\/\//g, '/');
        }
      }
      endpoints = endpoints.concat(extractEndpoints(layer.handle, prefix + layerPrefix));
    }
  });
  return endpoints;
}

const routes = require('./src/routes');
const eps = extractEndpoints(routes, '/api');
console.log(JSON.stringify(eps.map(e => ({ path: e.path, methods: e.methods, hasSchema: e.middlewares.some(m => m._schema) })), null, 2));
