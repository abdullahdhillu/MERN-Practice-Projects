// const fs = require("fs");
const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("./../controllers/authController");
const reviewRouter = require("./reviewRoutes");
const router = express.Router();
router.use("/:tourId/reviews", reviewRouter);
// const imports = async () => {
//   const parsedData = JSON.parse(rawData);
//   await tourModel.insertMany(parsedData);
//   console.log("Data Imported Successfully");
// };
// imports();
// router.param('id', tourController.checkID);
router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTour, tourController.getAllTours);
router
  .route("/")
  .get(tourController.getAllTours)
  .post(authController.protect, tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(authController.protect, tourController.updateTour)
  .delete(authController.protect, tourController.deleteTour)
  .put(authController.protect, tourController.replaceTour);

router
  .route("/tours-within/distance/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

router
  .route("/tours-within/center/:latlng/unit/:distance")
  .get(tourController.getDistanceFrom);

// Implementing the nested routes

// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("admin"),
//     reviewController.createReview
//   );

//Better Technique to use
//look on top
module.exports = router;
