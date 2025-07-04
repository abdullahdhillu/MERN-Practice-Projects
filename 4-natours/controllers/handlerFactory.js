const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const APIfeatures = require("../utilities/apiFeatures");
module.exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Deleted successfully",
      data: {
        doc,
      },
    });
  });

module.exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

module.exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

module.exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;
    if (!doc) {
      return next(
        new AppError(`Could not find doc with this ID {${req.params.id}}`, 404)
      );
    }
    res
      .status(200)
      .json({ message: "success", doc: doc.toObject({ virtuals: true }) });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    // Apply filtering, sorting, field limiting, and pagination
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .select();
    await features.pagination();

    // Execute the query
    const result = await features.query;
    // console.log(result);
    res.status(200).json({
      message: "success",
      results: result.length,
      data: { result },
    });
  });
