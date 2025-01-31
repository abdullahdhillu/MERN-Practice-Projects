const User = require("./../model/userModel");
const catchAsync = require("./../utilities/catchAsync");
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    users,
  });
});
exports.getUser = (req, res) => {
  res.status(505).json({
    status: "fail",
    message: "This route is not defined",
    data: null,
  });
};
exports.updateUser = (req, res) => {
  res.status(505).json({
    status: "fail",
    message: "This route is not defined",
    data: null,
  });
};
exports.deleteUser = (req, res) => {
  res.status(505).json({
    status: "fail",
    message: "This route is not defined",
    data: null,
  });
};
exports.createUser = (req, res) => {
  res.status(505).json({
    status: "fail",
    message: "This route is not defined",
    data: null,
  });
};
