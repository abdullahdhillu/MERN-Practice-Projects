const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const tourModel = require("./../../model/tourModel");
const Reviews = require("./../../model/reviewModel");
const Users = require("./../../model/userModel");
dotenv.config({ path: `${__dirname}/../../config.env` });
console.log(process.env.DATABASE_PASSWORD);
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
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf8")
);
const importData = async () => {
  try {
    await tourModel.create(tours, { validateBeforeSave: false });
    await Users.create(users, { validateBeforeSave: false });
    await Reviews.create(reviews);
    console.log("Imported Data Successfully");
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

const deleteData = async () => {
  try {
    await tourModel.deleteMany();
    await Users.deleteMany();
    await Reviews.deleteMany();
    console.log("Deleted Data Successfully");
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
};
if (process.argv[2] == "--import") {
  importData();
} else if (process.argv[2] == "--delete") {
  deleteData();
}

// console.log(process.argv)
