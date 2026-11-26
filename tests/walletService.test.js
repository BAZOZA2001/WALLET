// UNIT TESTS: test the business logic directly, no HTTP involved.
const { createStore } = require('../src/store/memoryStore');
const { createWalletService } = require('../src/services/walletService');

let service;
beforeEach(() => {
  service = createWalletService(createStore());
});

describe('walletService', () => {
  test('creates a wallet with zero balance and a unique id', () => {
    const a = service.createWallet();
    const b = service.createWallet();
    expect(a.balance).toBe(0);
    expect(a.currency).toBe('RWF');
    expect(a.id).not.toBe(b.id);
  });

  test('deposit increases balance and records a transaction', () => {
    const w = service.createWallet();
    service.deposit(w.id, 5000);
    expect(service.getWallet(w.id).balance).toBe(5000);
    const txs = service.getTransactions(w.id);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({ type: 'deposit', amount: 5000, balanceAfter: 5000 });
  });

  test('withdraw within balance decreases balance', () => {
    const w = service.createWallet();
    service.deposit(w.id, 5000);
    service.withdraw(w.id, 2000);
    expect(service.getWallet(w.id).balance).toBe(3000);
  });

  test('withdraw more than balance is rejected', () => {
    const w = service.createWallet();
    service.deposit(w.id, 1000);
    expect(() => service.withdraw(w.id, 1001)).toThrow('Insufficient funds');
  });

  test.each([0, -5, 1.5, '100', null, undefined, NaN])('rejects invalid amount %p', (bad) => {
    const w = service.createWallet();
    expect(() => service.deposit(w.id, bad)).toThrow();
    expect(() => service.withdraw(w.id, bad)).toThrow();
  });

  test('FAILED operations leave balance and history unchanged', () => {
    const w = service.createWallet();
    service.deposit(w.id, 1000);

    expect(() => service.withdraw(w.id, 5000)).toThrow(); // overdraft
    expect(() => service.deposit(w.id, -1)).toThrow();    // invalid amount
    expect(() => service.withdraw(w.id, 0)).toThrow();    // invalid amount

    expect(service.getWallet(w.id).balance).toBe(1000);
    expect(service.getTransactions(w.id)).toHaveLength(1); // only the first deposit
  });

  test('unknown wallet throws 404', () => {
    expect(() => service.getWallet('nope')).toThrow('Wallet not found');
  });
});
