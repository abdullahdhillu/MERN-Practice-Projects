class appError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.status = `${this.statusCode}`.startsWith(4) ? "Error" : "Fail";
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
module.exports = appError;
