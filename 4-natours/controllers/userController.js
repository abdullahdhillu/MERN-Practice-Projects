const appError = require("../utilities/appError");
const User = require("./../model/userModel");
const catchAsync = require("./../utilities/catchAsync");
const filterObj = function (obj, ...allowedFields) {
  const filteredObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) filteredObject[el] = obj[el];
  });
  return filteredObject;
};
exports.updateMe = catchAsync(async (req, res, next) => {
  // const id = req.user.id;
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new appError(
        "This route is not for updating Passwords. Please use /updatePassword",
        400
      )
    );
  }
  const filteredObject = filterObj(req.body, "name", "email");
  console.log(filteredObject);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredObject,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: "success", data: null });
});
exports.getAllUsers = catchAsync(async (req, res) => {
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
