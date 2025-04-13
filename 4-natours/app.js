const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const express = require("express");
const app = express();
const morgan = require("morgan");
const AppError = require("./utilities/appError");
const globalErrorHandler = require("./controllers/globalErrorHandler");
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
// console.log(process.env);
// 2: Middlewares
app.use(helmet());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  console.log("In Production Env");
}
const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again after 1 hour",
});
app.use("/api", limiter);
app.use(express.json({ limit: "10kb" })); // for parsing application/json
app.use(xss());
app.use(mongoSanitize());
app.use(express.static(`${__dirname}/public`)); // serve static files from public folder
// 3: ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
module.exports = app;
