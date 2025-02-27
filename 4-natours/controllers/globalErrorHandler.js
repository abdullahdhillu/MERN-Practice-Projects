const AppError = require("./../utilities/appError");
const castErrorHandlerDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = JSON.stringify(err.keyValue.name);
  console.log(value);
  const message = `Duplicate key: ${value} , please change value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = errors.join(". ");
  // console.log(errors);
  return new AppError(message, 500);
};
const handleJWTErrorDB = (err) => {
  return new AppError("Invalid Token", 401);
};
const handleExpiredToken = (err) => {
  return new AppError("Your Token has Expired. Please Log in Again", 401);
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
    // console.log(err.stack);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};
module.exports = (err, req, res, next) => {
  let error = err;
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    // console.log(err.name);
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // console.log(error);
    if (error.name === "CastError") error = castErrorHandlerDB(error);
    if (error.code == 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTErrorDB(error);
    if (error.name === "TokenExpiredError") error = handleExpiredToken(error);
    sendErrorProd(error, req, res);
  }
  next();
};
