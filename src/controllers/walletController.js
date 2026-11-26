// Controllers only translate HTTP <-> service calls. No business rules here.
function createWalletController(service) {
  return {
    create(req, res) {
      const wallet = service.createWallet(req.body && req.body.currency);
      res.status(201).json(wallet);
    },

    get(req, res) {
      res.status(200).json(service.getWallet(req.params.id));
    },

    deposit(req, res) {
      const wallet = service.deposit(req.params.id, req.body && req.body.amount);
      res.status(200).json({ message: 'Deposit successful', balance: wallet.balance });
    },

    withdraw(req, res) {
      const wallet = service.withdraw(req.params.id, req.body && req.body.amount);
      res.status(200).json({ message: 'Withdrawal successful', balance: wallet.balance });
    },

    transactions(req, res) {
      res.status(200).json(service.getTransactions(req.params.id));
    },
  };
}

module.exports = { createWalletController };
