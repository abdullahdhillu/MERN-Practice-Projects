const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { hashPass } = require("./../utilities/hashing");
const userSchema = new mongoose.Schema([
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      lowercase: true,
      unique: true,
      validate: [validator.isEmail, "Invalid email address"],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false,
    },
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
    role: {
      type: String,
    },
    passwordChangedAfter: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
]);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await hashPass(this.password);
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now();
  next();
});
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});
userSchema.methods.correctPassword = function (
  candidatePassword,
  userPassword
) {
  console.log(candidatePassword, userPassword);
  return bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPassword = function (jwtTimeStamp) {
  if (this.passwordChangedAfter) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAfter.getTime() / 1000
    );
    console.log(jwtTimeStamp, changedTimeStamp);
    return jwtTimeStamp < changedTimeStamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  console.log({ resetToken });
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
