import ReportModel from "../Model/ReportsModel.js";
import path from "path";
// import { fileURLToPath } from "url";
import fs from "fs";

// Upload Report
export const uploadReport = async (req, res) => {
    try {
        console.log("Received file:", req.file);
        console.log("Request body:", req.body);

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded!" });
        }

        const patientId = req.user.id;
        const filePath = path.join("uploads", "reports", req.file.filename);
        console.log("Processing file at:", filePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found on server", path: filePath });
        }

        const newReport = new ReportModel({
            patientId,
            fileName: req.body.fileName,
            fileUrl: `/uploads/reports/${req.file.filename}`,
            savedFileName: req.file.filename,
            reportType: req.body.reportType,
            comments: req.body.comments ? [{ text: req.body.comments, author: req.user.firstName || "You", date: new Date() }] : [],
        });

        await newReport.save();

        res.status(200).json({ message: "File uploaded successfully", report: newReport });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload report", error });
    }
};

// Get All Reports for a Patient
export const getReports = async (req, res) => {
    try {
        const patientId = req.user.id;
        const reports = await ReportModel.find({ patientId });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch reports", error });
    }
};

// Add Comment to a Report
export const addComment = async (req, res) => {
    try {
        const reportId = req.params.reportId.trim();
        const { text, author } = req.body;

        if (!text || !author) {
            return res.status(400).json({ message: "Text and author are required" });
        }

        const report = await ReportModel.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        report.comments.push({ text, author, date: new Date() });
        await report.save();

        res.json({ message: "Comment added successfully", report });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Failed to add comment", error: error.message });
    }
};

// Download a Report
export const downloadReport = async (req, res) => {
    try {
        const reportId = req.params.reportId.trim();
        const report = await ReportModel.findById(reportId);

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        // Construct the correct file path
        const filePath = path.resolve("uploads/reports", report.savedFileName);
        console.log("Resolved file path:", filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error("File not found:", filePath);
            return res.status(404).json({ message: "File not found on server", path: filePath });
        }

        // Send the file for download
        res.download(filePath, report.fileName, (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).json({ message: "Error downloading file", error: err.message });
            }
        });
    } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({ message: "Failed to download report", error: error.message });
    }
};