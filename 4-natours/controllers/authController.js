const User = require("./../model/userModel");
const catchAsync = require("./../utilities/catchAsync");
const AppError = require("./../utilities/appError");
const sendEmail = require("./../utilities/email");
const jwt = require("jsonwebtoken");
const { Signature } = require("./../utilities/signToken"); // Ensure process is defined

const { promisify } = require("util");
const { AggregationCursor } = require("mongodb");
// const { findById, find } = require("../model/tourModel");
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
  // console.log(token);
  if (!token) {
    return next(new AppError("You are not logged in", 401));
  }
  //Verify the token
  // So Basically we use jwt.verify(provided token, secret key) to verify the token before giving access to user
  //to the user using the _id parameter inside the token. jwt.verify() takes the header, payload out of the token
  // and verifies it with the secret key. If it matches, it means it's verified, otherwise it's not.

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  //Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("User belonging to this token no longer exists", 401)
    );
  }
  req.user = currentUser;
  // console.log(decoded, "hi");
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("User does not exist with that email", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Reset it here: ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token is valid for 10 min",
      message,
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("Error in sending Email, Please Try Again Later"),
      500
    );
  }

  // Send a success response
  res.status(200).json({
    status: "Success",
    message: "Password reset token generated successfully",
    resetToken,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {});
