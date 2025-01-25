const AppError = require("./../utilities/appError");
const castErrorHandlerDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      err: err,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    console.log(err.name);
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = err;
    console.log(error);
    if (error.name === "CastError") {
      error = castErrorHandlerDB(error);
    }
    sendErrorProd(error, req, res);
  }
  next();
};
