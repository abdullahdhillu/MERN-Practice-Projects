const dotenv = require("dotenv"); // manages environment variables
const mongoose = require("mongoose"); // MongoDB ORM
const fs = require("fs");
dotenv.config({ path: "./config.env" }); // loads environment variables from .env file
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err);
});
const rawData = fs.readFileSync("./tours.json", "utf-8");
// const tours = JSON.parse(rawData);

const app = require("./app.js"); // main application file
// const DBS = "mongodb+srv://abdullahdhillon:0MkcvNawQyCg33rQ@cluster0.r9bve.mongodb.net/natours?retryWrites=true&w=majority&appName=Cluster0" // MongoDB connection string
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.log("DB connection failed:", err.message);
  });

// console.log(process.env.NODE_ENV);
// console.log(process.env.DATABASE_PASSWORD);
// creates a model from the schema

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err);
});
// server.close(() => {
//   console.log("Server closed");
//   process.exit(1);
// });
