require('express-async-errors'); // must be required before routes so thrown errors in async controllers reach errorHandler

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const generateSwagger = require('./docs/swaggerGenerator');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Trust the reverse proxy (Render) to properly resolve user IPs for rate limiting
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.clientUrl === '*' ? true : config.clientUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // strips $ and . from req.body/query/params keys to block NoSQL injection

app.use(
  morgan(config.isProduction ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' } },
});
app.use(config.apiBasePath, limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(config.apiBasePath, routes);

// Generate Swagger specs dynamically based on the current app router
const swaggerDocument = generateSwagger(app);
app.get('/api-docs/swagger.json', (req, res) => res.json(swaggerDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
