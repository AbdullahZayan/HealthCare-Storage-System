import express from "express";
import { submitFeedback, getAllFeedback } from "../Controller/FeedbackController.js";
import { authenticateToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/submit", authenticateToken, submitFeedback);
router.get("/all", authenticateToken, getAllFeedback);

export default router;
