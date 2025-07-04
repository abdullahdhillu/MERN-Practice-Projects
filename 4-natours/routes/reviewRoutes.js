const router = require("express").Router({
  mergeParams: true,
});
const reviewController = require("./../controllers/reviewController");
const authController = require("./../controllers/authController");
router.use(authController.protect);
router
  .route("/")
  .post(reviewController.setIds, reviewController.createReview)
  .get(reviewController.getAllReviews);
router
  .route("/:id")
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview)
  .get(reviewController.getReview);
module.exports = router;
