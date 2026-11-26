const { AppError } = require('../errors');

// Every error response has the same shape: { "error": "message" }.
// Stack traces are never sent to the client.
function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err); // log internally only
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
