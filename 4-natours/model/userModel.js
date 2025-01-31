const mongoose = require("mongoose");
const validator = require("validator");
// const bcrypt = require("bcryptjs");
const hash = require("./../utilities/hashing");
const userSchema = new mongoose.Schema([
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
  },
  {
    email: {
      type: String,
      required: [true, "Please enter your name"],
      lowercase: true,
      unique: true,
      validate: [validator.isEmail, "Invalid email address"],
    },
  },
  {
    photo: {
      type: String,
    },
  },
  {
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password must be at least 8 characters"],
    },
  },
  {
    passwordConfirm: {
      type: String,
      validate: {
        // This only works on SAVE
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords don't match",
      },
    },
  },
]);
userSchema.pre("save", async function (next) {
  this.password = await hash.hashPass(this.password);
  this.passwordConfirm = undefined;
  next();
});
const User = mongoose.model("User", userSchema);
module.exports = User;
