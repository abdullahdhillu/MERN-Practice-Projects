const User = require("./../model/userModel");
const { promisify } = require("util");
const catchAsync = require("./../utilities/catchAsync");
const AppError = require("./../utilities/appError");
const jwt = require("jsonwebtoken");
const { Signature } = require("./../utilities/signToken");
const { findById } = require("../model/tourModel");
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const token = Signature(newUser._id);
  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //Check if the email and password exist
  if (!email || !password) {
    return next(new AppError("Please Enter Email and Password", 400));
  }
  //Check if the email and password are correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect Email or Password", 401));
  }
  const token = Signature(user._id);
  //Send Response
  res.status(200).json({
    status: "success",
    user,
    token,
  });
});
exports.protect = catchAsync(async (req, res, next) => {
  // console.log(req.headers.authorization);
  // check if the token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.toLowerCase().startsWith("bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new AppError("You are not logged in", 401));
  }
  //Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  //Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("User belonging to this token no longer exists", 401)
    );
  }
  console.log(decoded.iat);
  if (currentUser.changedPassword(decoded.iat)) {
    return next(
      new AppError("User recently changed password, please log in again", 401)
    );
  }
  console.log(decoded, "hi");
  next();
});
