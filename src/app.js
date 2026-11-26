const express = require('express');
const { createStore } = require('./store/memoryStore');
const { createWalletService } = require('./services/walletService');
const { createWalletController } = require('./controllers/walletController');
const { createWalletRoutes } = require('./routes/walletRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Builds the app with a fresh store. Tests call this to get an isolated app each time.
function createApp(store = createStore()) {
  const service = createWalletService(store);
  const controller = createWalletController(service);

  const app = express();
  app.use(express.json());
  app.use('/wallets', createWalletRoutes(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
