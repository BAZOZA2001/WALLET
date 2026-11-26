// All business rules live here. Controllers never touch the store directly.
const crypto = require('crypto');
const { AppError } = require('../errors');

function createWalletService(store) {
  // Money is stored as an INTEGER in minor units (RWF has no decimals, so 5000 = 5000 RWF).
  // Integers avoid floating-point errors like 0.1 + 0.2 !== 0.3.
  function assertValidAmount(amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new AppError(400, 'Amount must be a whole number greater than zero');
    }
  }

  function getWallet(id) {
    const wallet = store.wallets.get(id);
    if (!wallet) throw new AppError(404, 'Wallet not found');
    return wallet;
  }

  function createWallet(currency = 'RWF') {
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
      throw new AppError(400, 'Currency must be a 3-letter uppercase code, e.g. RWF');
    }
    const wallet = {
      id: crypto.randomUUID(), // unique identifier
      balance: 0,              // starts at zero
      currency,
      createdAt: new Date().toISOString(),
    };
    store.wallets.set(wallet.id, wallet);
    store.transactions.set(wallet.id, []);
    return wallet;
  }

  function recordTransaction(wallet, type, amount) {
    const tx = {
      id: crypto.randomUUID(),
      walletId: wallet.id,
      type, // 'deposit' | 'withdrawal'
      amount,
      balanceAfter: wallet.balance,
      createdAt: new Date().toISOString(),
    };
    store.transactions.get(wallet.id).push(tx);
    return tx;
  }

  // Rule: validate FIRST, change data LAST.
  // If any check throws, nothing has been modified, so a failed operation leaves
  // both the balance and the history untouched.
  function deposit(id, amount) {
    const wallet = getWallet(id);
    assertValidAmount(amount);
    wallet.balance += amount;
    recordTransaction(wallet, 'deposit', amount);
    return wallet;
  }

  function withdraw(id, amount) {
    const wallet = getWallet(id);
    assertValidAmount(amount);
    if (amount > wallet.balance) {
      throw new AppError(422, 'Insufficient funds');
    }
    wallet.balance -= amount;
    recordTransaction(wallet, 'withdrawal', amount);
    return wallet;
  }

  function getTransactions(id) {
    getWallet(id); // throws 404 if the wallet doesn't exist
    return store.transactions.get(id);
  }

  return { createWallet, getWallet, deposit, withdraw, getTransactions };
}

module.exports = { createWalletService };
