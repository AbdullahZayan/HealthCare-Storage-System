import express from "express";
import multer from "multer";
import { uploadReport, getReports, addComment } from "../Controller/ReportsController.js";
import { downloadReport } from "../Controller/ReportsController.js"; 
import { authenticateToken } from "../Middlewares/authMiddleware.js";
import path from "path";

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/reports/"); // Ensure correct folder setup
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

router.post("/upload", authenticateToken, upload.single("file"), uploadReport);
router.get("/", authenticateToken, getReports);
router.post("/comment/:reportId", authenticateToken, addComment);
router.get("/download/:reportId", authenticateToken, downloadReport);


export default router;