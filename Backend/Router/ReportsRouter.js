const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadReport, getReports, addComment, downloadReport } = require("../Controller/ReportsController.js");
const { authenticateToken } = require("../Middlewares/authMiddleware.js");

console.log("uploadReport loaded:", typeof uploadReport); // Should be 'function'

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/reports/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

router.post("/upload", authenticateToken, upload.single("file"), uploadReport);
router.get("/", authenticateToken, getReports);
router.post("/comment/:reportId", authenticateToken, addComment);
router.get("/download/:reportId", authenticateToken, downloadReport);

module.exports = router;
