import express from "express";
import dotenv from "dotenv";
dotenv.config(); // 👈 this must come before anything that uses env
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./dialogflow-key.json";

import cors from "cors";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import cron from "node-cron";
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
// console.log("🔍 Credentials Path:", process.env.GOOGLE_CLOUD_PROJECT);
console.log("🔍 Dialogflow Key Path:", process.env.GOOGLE_APPLICATION_CREDENTIALS);


// Ensure environment variables are loaded
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ ERROR: Missing MONGO_URI or JWT_SECRET in .env file!");
  process.exit(1); // Stop the server if critical env vars are missing
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });


// Routes
app.use("/api/patients", patientsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/heartrate", heartRateRoutes);
app.use('/api/dialogflow', dialogflowRoute);

// Serve static files from uploads folder
app.use("/uploads", express.static("uploads"));


// ============= Nodemailer setup =============
const transporter = nodemailer.createTransport({
  service: "gmail", // or another service
  auth: {
    user: process.env.EMAIL_USER, // e.g. "youremail@gmail.com"
    pass: process.env.EMAIL_PASS  // e.g. "your-app-password"
  },
});

// =========== Cron Job: runs daily at 00:00 (midnight) ===========
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running daily check-up reminder job...");

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // --- MODIFIED QUERY ---
    // Find patients who meet ALL these conditions:
    // 1. Their last checkup was a year ago or more.
    // 2. A reminder has NOT been sent yet for this checkup.
    // 3. Their account is active.
    const patientsDue = await PatientModel.find({
      lastCheckupDate: { $lte: oneYearAgo },
      reminderSent: false,
      status: "active"
    });

    if (patientsDue.length === 0) {
      console.log("✅ No new reminders to send today.");
      return;
    }

    console.log(`Found ${patientsDue.length} patient(s) due for a reminder.`);

    // Re-use the transporter you already have defined above this block
    const transporter = nodemailer.createTransport({
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
        from: `HealthCare Storage <${process.env.SMTP_FORM}>`, // A more professional "from" field
        to: patient.email,
        subject: "Time for Your Annual Check-Up!",
        html: `<h3>Hello ${patient.firstName},</h3>
               <p>This is a friendly reminder that it has been one year since your last medical check-up on <strong>${patient.lastCheckupDate.toDateString()}</strong>.</p>
               <p>Please book an appointment with your healthcare provider soon.</p>
               <br/>
               <p>Stay healthy,</p>
               <p><strong>Your HealthCare Storage System</strong></p>`
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Reminder email sent to ${patient.email}`);

      // --- CRITICAL UPDATE ---
      // Instead of changing the date, we just flip the flag.
      // This preserves the actual checkup date history.
      patient.reminderSent = true;
      await patient.save();
    }
  } catch (error) {
    console.error("❌ Error in CRON job:", error);
  }
}, {
  timezone: "Asia/Riyadh", // Your timezone is correct
});

// Start the server only once
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
