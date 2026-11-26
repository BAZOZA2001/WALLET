const express = require('express');

function createWalletRoutes(controller) {
  const router = express.Router();
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.post('/:id/deposit', controller.deposit);
  router.post('/:id/withdraw', controller.withdraw);
  router.get('/:id/transactions', controller.transactions);
  return router;
}

module.exports = { createWalletRoutes };
