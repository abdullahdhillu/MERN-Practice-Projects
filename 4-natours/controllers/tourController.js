const tourModel = require(`./../model/tourModel`);
const catchAsync = require("./../utilities/catchAsync");
const AppError = require("./../utilities/appError");
const factory = require("./handlerFactory");
const { isLuhnNumber } = require("validator");
// const APIfeatures = require(`./../utilities/apiFeatures`);
// console.log(APIfeatures);
exports.aliasTopTour = (req, res, next) => {
  req.query.sort = "price,-ratingsAverage";
  req.query.limit = "5";
  req.query.fields = "name,price,duration,difficulty,ratingsAverage";
  next();
};
exports.getAllTours = factory.getAll(tourModel);

exports.getTour = factory.getOne(tourModel, {
  path: "reviews",
  select: "review -_id",
});
// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await tourModel.findById(req.params.id).populate({
//     path: "reviews",
//     select: "review -_id",
//   }); // Changed to findById
//   // console.log(tour);
//   if (!tour) {
//     return next(
//       new AppError(`Could not find tour with this ID {${req.params.id}}`, 404)
//     );
//   }
//   console.log(tour.reviews);
//   res
//     .status(200)
//     .json({ message: "success", tour: tour.toObject({ virtual: true }) });
// });
exports.updateTour = factory.updateOne(tourModel);
exports.replaceTour = catchAsync(async (req, res) => {
  const tour = await tourModel.findOneAndReplace(
    { _id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res) => {
  const newTour = await tourModel.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

exports.deleteTour = factory.deleteOne(tourModel);
// exports.deleteTour = catchAsync(async (req, res) => {
//   const tour = await tourModel.findOneAndDelete({ _id: req.params.id });
//   if (!tour) {
//     return res.status(404).json({ message: "No such tour found" });
//   }
//   return res
//     .status(200)
//     .json({ message: "success", data: { response: "Deleted" } });
// });

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // await tourModel.collection.dropIndexes(); // because compass was not showing index so I deleted all indexes to make there are no incomplete indexes
  // await tourModel.collection.createIndex({ startLocation: "2dsphere" });  // I created the index manually
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",").map(Number);
  if (!lat || !lng) {
    return next(new AppError("Please Provide Latitude and Longitude"), 400);
  }
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  const Tours = await tourModel.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  res.status(200).json({
    results: Tours.length,
    message: "success",
    data: {
      Tours,
    },
  });
});

exports.getDistanceFrom = catchAsync(async (req, res, next) => {
  const { latlng, distance } = req.params;
  const maxDistanceInMeters = distance * 1609.344;
  const [lat, lng] = latlng.split(",").map(Number);
  if (!lat || !lng) {
    return next(new AppError("Please provide coordinates"), 400);
  }
  const Tour = await tourModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat],
        },
        distanceField: "Distance",
        // distanceMultiplier: 0.001,
        spherical: true,
        maxDistance: maxDistanceInMeters,
      },
    },
    {
      $addFields: {
        distanceInMiles: {
          $round: [{ $divide: ["$Distance", 1609.344] }, 2],
        },
      },
    },
    {
      $project: {
        name: 1,
        distanceInMiles: 1,
      },
    },
  ]);
  res.status(200).json({
    statusCode: 200,
    message: "success",
    data: Tour,
  });
});

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await tourModel.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        avgPrice: { $avg: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      $match: { _id: { $ne: "medium" } },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats: stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await tourModel.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
        // name: "The City Wanderer",
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTours: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
        // isExpensive: {
        //   $cond: { if: { $gt: ["$price", 2500] }, then: true, else: false },
        // },
        tours: 1,
        numTours: 1,
      },
    },
    {
      status: "success",
      data: {
        plan,
      },
    },
  ]);
});
