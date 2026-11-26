# Mini Wallet API

A small REST API to create wallets, deposit, withdraw, and view transaction history.
Built with **Node.js + Express**, using an **in-memory store** (no database to install).

## Setup

Requires Node.js 18+.

```bash
npm install
npm start          # runs on http://localhost:3000  (set PORT to change)
```

## Run the tests

```bash
npm test
```

## Endpoints

| Method | Endpoint                     | Description                     |
|--------|------------------------------|---------------------------------|
| POST   | `/wallets`                   | Create a wallet (optional `{ "currency": "RWF" }`) |
| GET    | `/wallets/:id`               | Wallet details and balance      |
| POST   | `/wallets/:id/deposit`       | Body: `{ "amount": 5000 }`      |
| POST   | `/wallets/:id/withdraw`      | Body: `{ "amount": 2000 }`      |
| GET    | `/wallets/:id/transactions`  | Transaction history             |

### Status codes
- `200` success, `201` wallet created
- `400` invalid input (amount not a positive whole number, bad JSON, bad currency)
- `404` wallet not found
- `422` insufficient funds

All errors look like: `{ "error": "message" }`. Stack traces are never returned.

### Quick try (curl)
```bash
curl -X POST localhost:3000/wallets
curl -X POST localhost:3000/wallets/<id>/deposit  -H "Content-Type: application/json" -d '{"amount":5000}'
curl -X POST localhost:3000/wallets/<id>/withdraw -H "Content-Type: application/json" -d '{"amount":2000}'
curl localhost:3000/wallets/<id>/transactions
```

## Project structure

```
src/
  server.js              starts the server
  app.js                 wires everything together
  routes/                URL -> controller
  controllers/           HTTP in/out only
  services/              ALL business rules
  store/                 in-memory data (Maps)
  middleware/            consistent error handling
tests/
  walletService.test.js  unit tests
  walletApi.test.js      integration tests (Supertest)
```

## Design decisions

- **Money as integers (minor units).** Avoids floating-point bugs. Amounts must be whole numbers; RWF has no decimal part. Decimals like `10.5` are rejected.
- **Validate first, change data last.** In the service, every check happens before the balance or history is modified, so a failed request can never leave partial changes.
- **Layers.** Routes -> controllers -> service -> store. Business rules are only in the service, so they are easy to test and to explain.
- **Unique IDs** via `crypto.randomUUID()`.
- **Concurrency.** Node runs JavaScript on one thread and the service code is synchronous, so two withdrawals can never interleave and overdraw a wallet. With a real SQL database I would use a transaction with a row lock (`SELECT ... FOR UPDATE`).
- **Why in-memory?** The assessment allows it and it keeps setup to two commands. The store is isolated in one file, so swapping in SQLite/PostgreSQL would only change that layer and the service.
