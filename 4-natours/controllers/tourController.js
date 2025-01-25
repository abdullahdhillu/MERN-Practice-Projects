// const fs = require('fs');
const tourModel = require(`./../model/tourModel`);
const catchAsync = require("./../utilities/catchAsync");
const AppError = require("./../utilities/appError");
// const APIfeatures = require(`./../utilities/apiFeatures`);
// console.log(APIfeatures);
exports.aliasTopTour = (req, res, next) => {
  req.query.sort = "price,-ratingsAverage";
  req.query.limit = "5";
  req.query.fields = "name,price,duration,difficulty,ratingsAverage";
  next();
};
class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A: Basic Filtering
    console.log("From Filtering Function");
    let queryObj = { ...this.queryString };
    const excludedFields = ["sort", "limit", "page", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B: Advanced Filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Default sort by newest first
    }
    return this;
  }

  select() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v"); // Default exclude '__v'
    }
    return this;
  }

  async pagination() {
    const limit = parseInt(this.queryString.limit, 10) || 10; // Default limit = 10
    const page = parseInt(this.queryString.page, 10) || 1; // Default page = 1
    const skip = (page - 1) * limit; // Calculate skip

    // Check if the requested page exists
    const numTours = await this.query.model.countDocuments(); // Use the model to count documents
    if (skip >= numTours && page > 1) {
      throw new Error("This page does not exist");
    }

    // Apply pagination
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
exports.getAllTours = catchAsync(async (req, res) => {
  // Apply filtering, sorting, field limiting, and pagination
  const features = new APIfeatures(tourModel.find(), req.query)
    .filter()
    .sort()
    .select();
  await features.pagination();
  // Execute the query
  const result = await features.query;

  res.status(200).json({
    message: "success",
    results: result.length,
    data: { result },
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await tourModel.findById(req.params.id); // Changed to findById
  // console.log(tour);
  if (!tour) {
    return next(
      new AppError(`Could not find tour with this ID {${req.params.id}}`, 404)
    );
  }
  res.status(200).json({ message: "success", data: { tour } });
});
exports.updateTour = catchAsync(async (req, res) => {
  const tour = await tourModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});
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
exports.deleteTour = catchAsync(async (req, res) => {
  const tour = await tourModel.findOneAndDelete({ _id: req.params.id });
  if (!tour) {
    return res.status(404).json({ message: "No such tour found" });
  }
  return res
    .status(200)
    .json({ message: "success", data: { response: "Deleted" } });
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
      $match: { _id: { $ne: "easy" } },
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
