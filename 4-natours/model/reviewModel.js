const mongoose = require("mongoose");
const AppError = require("./../utilities/appError");

const reviewSchema = mongoose.Schema({
  review: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
    validate: {
      validator: function (val) {
        return typeof val === "number" && !isNaN(val);
      },
      message: "Rating must be a number",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tour",
    required: [true, "Review must belong to a tour"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Review must belong to a user"],
  },
});
reviewSchema.pre(/^find/, async function (next) {
  // this.populate({
  //   path: "tour",
  //   select: "name _id",
  // }).populate({
  //   path: "user",
  //   select: "name _id",
  // });
  this.populate({
    path: "user",
    select: "name _id",
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const Tour = require("./tourModel");
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour", // groups all reviews that have the same value for tour
        ratingsAverage: { $avg: "$rating" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);
  console.log(stats);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].ratingsAverage,
    ratingsQuantity: stats[0].ratingsQuantity,
  });
};
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.index({ user: 1, tour: 1 }, { unique: true });
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   const r = await this.model.findOne(this.getQuery());
//   console.log(r);
// });

// reviewSchema.post(/^findOneAnd/, async function () {
//   const tourModel = require("./tourModel");
//   const tour = await tourModel.find(this.r.tour);
//   console.log(tour);
// });

module.exports = mongoose.model("Review", reviewSchema);
