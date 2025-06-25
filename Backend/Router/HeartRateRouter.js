import express from "express";
import { authenticateToken } from "../Middlewares/authMiddleware.js";
import { addHeartRate, getHeartRateHistory } from "../Controller/HeartRateController.js";

const router = express.Router();


router.post("/", authenticateToken, addHeartRate);
router.get("/", authenticateToken, getHeartRateHistory);

export default router;
