const express = require("express");

const { authenticateToken } = require("../Middlewares/authMiddleware.js");

const {
  addHeartRate,
  getHeartRateHistory
} = require("../Controller/HeartRateController.js");


const router = express.Router();


router.post("/", authenticateToken, addHeartRate);
router.get("/", authenticateToken, getHeartRateHistory);

module.exports = router;
