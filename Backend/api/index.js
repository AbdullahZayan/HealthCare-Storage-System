import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

import reportsRoutes from "../Router/ReportsRouter.js";
import patientsRoutes from "../Router/PatientsRouter.js";
import feedbackRoutes from "../Router/FeedbackRouter.js";
import adminRoutes from "../Router/AdminRouter.js";
import heartRateRoutes from "../Router/HeartRateRouter.js";
import dialogflowRoute from "../Router/dialogFlow.js";
import PatientModel from "../Model/PatientsModel.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (only once in serverless)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));
}

// Routes
app.use("/api/patients", patientsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/heartrate", heartRateRoutes);
app.use("/api/dialogflow", dialogflowRoute);

// Expose as a serverless function
export const handler = serverless(app);
