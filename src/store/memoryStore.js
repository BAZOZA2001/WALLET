// The "database": two plain JavaScript Maps living in memory.
// Data is lost when the server restarts (allowed by the assessment).
// createStore() gives a fresh, empty store, which makes tests easy.
function createStore() {
  return {
    wallets: new Map(),      // walletId -> { id, balance, currency, createdAt }
    transactions: new Map(), // walletId -> [ transaction, transaction, ... ]
  };
}

module.exports = { createStore };
