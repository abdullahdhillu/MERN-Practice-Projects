const fs = require("fs");
const express = require("express");
const tourController = require("../controllers/tourController");
const router = express.Router();

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
  .post(tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour)
  .put(tourController.replaceTour);
module.exports = router;
