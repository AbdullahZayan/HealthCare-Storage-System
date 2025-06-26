import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// 1. Load environment variables from .env file FIRST.
dotenv.config();

// 2. Dynamically create Dialogflow key file for Vercel deployment.
// This must run AFTER dotenv.config() and BEFORE any library that needs the key.
if (process.env.DIALOGFLOW_KEY_JSON) {
  // On Vercel, the /tmp directory is the only writable directory.
  const keyFilePath = path.join('/tmp', 'dialogflow-key.json');
  fs.writeFileSync(keyFilePath, process.env.DIALOGFLOW_KEY_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
} else {
  // For local development, use the local file as before.
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "./dialogflow-key.json";
}

// 3. Import all other dependencies.
import cors from "cors";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
// NOTE: "node-cron" has been removed as it's not suitable for Vercel.
import reportsRoutes from "./Router/ReportsRouter.js";
import patientsRoutes from "./Router/PatientsRouter.js";
import feedbackRoutes from "./Router/FeedbackRouter.js";
import adminRoutes from "./Router/AdminRouter.js";
import PatientModel from "./Model/PatientsModel.js";
import heartRateRoutes from "./Router/HeartRateRouter.js";
import dialogflowRoute from "./Router/dialogFlow.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

console.log("🔍 Using Dialogflow Key Path:", process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Ensure critical environment variables are loaded
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ ERROR: Missing MONGO_URI or JWT_SECRET in environment variables!");
  process.exit(1);
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// API Routes
app.use("/api/patients", patientsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/heartrate", heartRateRoutes);
app.use('/api/dialogflow', dialogflowRoute);

// Serve static files from uploads folder
// Note: This may not work as expected on Vercel's ephemeral filesystem.
// For file storage, a service like Cloudinary or AWS S3 is recommended.
app.use("/uploads", express.static("uploads"));

// ============= Nodemailer setup =============
// This transporter can be used by other parts of your app.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

// =================================================================
// 4. NEW VERCEL CRON JOB ENDPOINT
// This replaces the old `node-cron` scheduler.
// Vercel will call this endpoint based on the schedule in `vercel.json`.
// =================================================================
app.get("/api/cron/send-reminders", async (req, res) => {
  // Secure the endpoint with a secret key
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  console.log("⏰ Running daily check-up reminder job via Vercel Cron...");

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const patientsDue = await PatientModel.find({
      lastCheckupDate: { $lte: oneYearAgo },
      reminderSent: false,
      status: "active"
    });

    if (patientsDue.length === 0) {
      console.log("✅ No new reminders to send today.");
      return res.status(200).json({ message: "No reminders to send." });
    }

    console.log(`Found ${patientsDue.length} patient(s) due for a reminder.`);

    const cronTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    for (const patient of patientsDue) {
      const mailOptions = {
        from: `HealthCare Storage <${process.env.SMTP_FORM}>`,
        to: patient.email,
        subject: "Time for Your Annual Check-Up!",
        html: `<h3>Hello ${patient.firstName},</h3>
               <p>This is a friendly reminder that it has been one year since your last medical check-up on <strong>${patient.lastCheckupDate.toDateString()}</strong>.</p>
               <p>Please book an appointment with your healthcare provider soon.</p>
               <br/>
               <p>Stay healthy,</p>
               <p><strong>Your HealthCare Storage System</strong></p>`
      };

      await cronTransporter.sendMail(mailOptions);
      console.log(`✅ Reminder email sent to ${patient.email}`);

      patient.reminderSent = true;
      await patient.save();
    }
    
    // Send a success response
    res.status(200).json({ message: `Successfully sent ${patientsDue.length} reminder(s).` });

  } catch (error) {
    console.error("❌ Error in Vercel CRON job:", error);
    // Send an error response
    res.status(500).json({ message: "Cron job failed.", error: error.message });
  }
});

// Start the server for local development
// Vercel ignores this and uses its own serverless invocation.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running locally on port ${PORT}`);
});