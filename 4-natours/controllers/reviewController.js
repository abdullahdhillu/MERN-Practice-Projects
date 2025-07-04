const Review = require(`./../model/reviewModel`);
// const catchAsync = require("./../utilities/catchAsync");
// const AppError = require("./../utilities/appError");
const factory = require("./handlerFactory");

module.exports.getReview = factory.getOne(Review);

module.exports.getAllReviews = factory.getAll(Review);
// module.exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let reviews = null;
//   if (req.params.tourId) {
//     reviews = await Review.find({ tour: req.params.tourId });
//     console.log(reviews);
//   } else {
//     reviews = await Review.find({});
//   }
//   if (!reviews) {
//     return next(new AppError("No reviews found", 404));
//   }
//   res.status(200).json({
//     status: 200,
//     message: "success",
//     results: reviews.length,
//     data: reviews,
//   });
// });

module.exports.setIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

module.exports.createReview = factory.createOne(Review);
module.exports.deleteReview = factory.deleteOne(Review);
module.exports.updateReview = factory.updateOne(Review);
