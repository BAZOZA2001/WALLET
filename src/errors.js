// One small error class. The service throws it, the error handler turns it into a response.
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { AppError };
