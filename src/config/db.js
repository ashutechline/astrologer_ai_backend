const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

async function connectDB() {
  // Workaround for Windows/Node.js DNS querySrv ECONNREFUSED error
  require('dns').setServers(['8.8.8.8', '8.8.4.4']);

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(config.mongo.uri, {
    autoIndex: !config.isProduction,
  });

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
