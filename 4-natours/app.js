const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const express = require("express");
const app = express();
const morgan = require("morgan");
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
  // res.status(404).json({
  //   status: "fail",
  //   message: `Cannot find ${req.originalUrl} on this server!`,
  // });
  const err = new Error(`Cannot find ${req.originalUrl} on this server!`);
  err.status = "fail";
  err.statusCode = 404;
  next(err);
});
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});
module.exports = app;
