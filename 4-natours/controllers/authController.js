const User = require("./../model/userModel");
const catchAsync = require("./../utilities/catchAsync");
const AppError = require("./../utilities/appError");
const sendEmail = require("./../utilities/email");
const jwt = require("jsonwebtoken");
const { Signature } = require("./../utilities/signToken"); // Ensure process is defined
const crypto = require("crypto");
const { promisify } = require("util");
// const { AggregationCursor } = require("mongodb");
// const { findById, find } = require("../model/tourModel");
const cookieOptions = {
  expires: Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000, // 90 day expiry date
  httpOnly: true, // browser can't access this cookie
};
const createSendToken = async (user, statusCode, res) => {
  const token = await Signature(user._id);
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true; // only works on https, won't work on http
  }
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  createSendToken(newUser._id, 200, res);
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
  createSendToken(user._id, 200, res);
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
    message: "Token sent to Email",
    resetToken,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = await crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Invalid token or expired token", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  try {
    await user.save(); // This will trigger validation
  } catch (err) {
    // Pass the error to the error-handling middleware
    return next(new AppError(err.message, 400));
  }
  const token = Signature(user._id);

  res.status(200).json({
    message: "Password Reset Successfully",
    token,
  });
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get the user from req.user (set by protect middleware)
  const user = await User.findById(req.user.id).select("+password");

  // Check if current password is provided and correct
  if (!req.body.currentPassword) {
    return next(new AppError("Please enter your current password", 400));
  }
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is incorrect", 401));
  }

  // Validate new password and confirmation
  if (!req.body.newPassword || !req.body.confirmPassword) {
    return next(
      new AppError("Please provide a new password and confirmation", 400)
    );
  }
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(
      new AppError("New password and confirmation do not match", 400)
    );
  }

  // Update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = undefined; // Clear the confirmation field
  await user.save();

  // Generate a new JWT token (optional, if you want to issue a new token after password change)
  createSendToken(user._id, 200, res);
});
