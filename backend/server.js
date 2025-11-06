
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/environment');
const { ensureConnection, ensureRequiredTables } = require('./config/database');
const registerRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const swaggerSpec = require('./docs');

const app = express();

const morganStream = {
  write: (message) => logger.info(message.trim()),
};

app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: morganStream }));

app.get('/health', (req, res) =>
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }),
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/docs.json', (req, res) => res.status(200).json(swaggerSpec));

registerRoutes(app);

app.use(errorHandler);

const start = async () => {
  try {
    await ensureConnection();
    await ensureRequiredTables();

    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server.', { message: error.message });
    process.exit(1);
  }
};

start();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection.', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception encountered.', { message: error.message, stack: error.stack });
  process.exit(1);
});
