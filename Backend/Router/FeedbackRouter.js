const express = require("express");

const {
  submitFeedback,
  getAllFeedback
} = require("../Controller/FeedbackController.js");

const { authenticateToken } = require("../Middlewares/authMiddleware.js");


const router = express.Router();

router.post("/submit", authenticateToken, submitFeedback);
router.get("/all", authenticateToken, getAllFeedback);

module.exports = router;
