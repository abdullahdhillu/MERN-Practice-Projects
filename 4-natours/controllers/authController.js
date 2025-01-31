const User = require("./../model/userModel");
const catchAsync = require("./../utilities/catchAsync");
const AppError = require("./../utilities/appError");
const { Signature } = require("./../utilities/signToken");
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
