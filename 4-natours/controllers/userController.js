const AppError = require("../utilities/appError");
const User = require("./../model/userModel");
const catchAsync = require("./../utilities/catchAsync");
const factory = require("./handlerFactory");

const filterObj = function (obj, ...allowedFields) {
  const filteredObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) filteredObject[el] = obj[el];
  });
  return filteredObject;
};

exports.passwordBlocker = catchAsync(async (req, res, next) => {
  // const id = req.user.id;
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        "This route is not for updating Passwords. Please use /updatePassword",
        400
      )
    );
  }

  const filteredObject = filterObj(req.body, "name", "email"); // Filtering out name and email from the request body so that user cannot update name or email
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

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: "success",
//     results: users.length,
//     users,
//   });
// });
exports.getUser = factory.getOne(User);
// exports.getUser = catchAsync(async (req, res) => {
//   const user = await User.findById(req.params.id);
//   if (!user) {
//     return new AppError(`No user found with ID ${req.params.id}`, 404);
//   }
//   res.status(200).json({
//     status: "success",
//     user,
//   });
// });

exports.updateUser = factory.updateOne(User);
// exports.updateUser = (req, res) => {
//   res.status(505).json({
//     status: "fail",
//     message: "This route is not defined",
//     data: null,
//   });
// };
exports.deleteUser = factory.deleteOne(User);
// exports.deleteUser = (req, res) => {
//   res.status(505).json({
//     status: "fail",
//     message: "This route is not defined",
//     data: null,
//   });
// };
