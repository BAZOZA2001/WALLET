// INTEGRATION TESTS: real HTTP requests against the Express app via Supertest.
const request = require('supertest');
const { createApp } = require('../src/app');

let app;
beforeEach(() => {
  app = createApp(); // fresh empty store for every test
});

const createWallet = async () => (await request(app).post('/wallets').send({})).body;

describe('POST /wallets', () => {
  test('creates a wallet with zero balance', async () => {
    const res = await request(app).post('/wallets').send({});
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ balance: 0, currency: 'RWF' });
    expect(res.body.id).toBeDefined();
  });

  test('rejects an invalid currency', async () => {
    const res = await request(app).post('/wallets').send({ currency: 'rwf' });
    expect(res.status).toBe(400);
  });
});

describe('GET /wallets/:id', () => {
  test('returns an existing wallet', async () => {
    const w = await createWallet();
    const res = await request(app).get(`/wallets/${w.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(w.id);
  });

  test('returns 404 for a nonexistent wallet', async () => {
    const res = await request(app).get('/wallets/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Wallet not found' });
  });
});

describe('deposit', () => {
  test('increases the balance', async () => {
    const w = await createWallet();
    const res = await request(app).post(`/wallets/${w.id}/deposit`).send({ amount: 5000 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Deposit successful', balance: 5000 });
  });

  test.each([0, -100])('rejects amount %p', async (amount) => {
    const w = await createWallet();
    const res = await request(app).post(`/wallets/${w.id}/deposit`).send({ amount });
    expect(res.status).toBe(400);
  });

  test('returns 404 for unknown wallet', async () => {
    const res = await request(app).post('/wallets/nope/deposit').send({ amount: 100 });
    expect(res.status).toBe(404);
  });
});

describe('withdraw', () => {
  test('decreases the balance', async () => {
    const w = await createWallet();
    await request(app).post(`/wallets/${w.id}/deposit`).send({ amount: 5000 });
    const res = await request(app).post(`/wallets/${w.id}/withdraw`).send({ amount: 2000 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Withdrawal successful', balance: 3000 });
  });

  test('rejects overdraft and leaves balance unchanged', async () => {
    const w = await createWallet();
    await request(app).post(`/wallets/${w.id}/deposit`).send({ amount: 1000 });
    const res = await request(app).post(`/wallets/${w.id}/withdraw`).send({ amount: 2000 });
    expect(res.status).toBe(422);
    const after = await request(app).get(`/wallets/${w.id}`);
    expect(after.body.balance).toBe(1000);
  });

  test.each([0, -50])('rejects amount %p', async (amount) => {
    const w = await createWallet();
    const res = await request(app).post(`/wallets/${w.id}/withdraw`).send({ amount });
    expect(res.status).toBe(400);
  });
});

describe('GET /wallets/:id/transactions', () => {
  test('returns recorded transactions', async () => {
    const w = await createWallet();
    await request(app).post(`/wallets/${w.id}/deposit`).send({ amount: 5000 });
    await request(app).post(`/wallets/${w.id}/withdraw`).send({ amount: 2000 });
    const res = await request(app).get(`/wallets/${w.id}/transactions`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((t) => t.type)).toEqual(['deposit', 'withdrawal']);
  });

  test('failed operations leave balance AND history unchanged', async () => {
    const w = await createWallet();
    await request(app).post(`/wallets/${w.id}/deposit`).send({ amount: 1000 });

    await request(app).post(`/wallets/${w.id}/withdraw`).send({ amount: 9999 }); // overdraft
    await request(app).post(`/wallets/${w.id}/deposit`).send({ amount: -5 });    // invalid
    await request(app).post(`/wallets/${w.id}/withdraw`).send({ amount: 0 });    // invalid

    const wallet = await request(app).get(`/wallets/${w.id}`);
    const txs = await request(app).get(`/wallets/${w.id}/transactions`);
    expect(wallet.body.balance).toBe(1000);
    expect(txs.body).toHaveLength(1);
  });

  test('returns 404 for unknown wallet', async () => {
    const res = await request(app).get('/wallets/nope/transactions');
    expect(res.status).toBe(404);
  });
});

describe('error handling', () => {
  test('malformed JSON returns 400 without a stack trace', async () => {
    const res = await request(app)
      .post('/wallets/x/deposit')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON body' });
  });

  test('unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/nothing');
    expect(res.status).toBe(404);
  });
});
