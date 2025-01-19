const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const express = require("express");
const app = express();
const morgan = require("morgan");
const AppError = require("./utilities/appError");
const globalErrorHandler = require("./controllers/globalErrorHandler");
// console.log(process.env);
// 2: Middlewares
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  console.log("In Production Env");
}
app.use((req, res, next) => {
  // custom middleware
  console.log("Hello from the middleware");
  next();
});
app.use(express.json()); // for parsing application/json
app.use(express.static(`${__dirname}/public`)); // serve static files from public folder
// 3: ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
module.exports = app;
