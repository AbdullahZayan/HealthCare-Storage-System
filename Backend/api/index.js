const express = require('express');
const serverless = require('serverless-http'); // npm i serverless-http
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");
const fs = require("fs");

require('dotenv').config();

const reportsRoutes = require("../Router/ReportsRouter.js");
const patientsRoutes = require("../Router/PatientsRouter.js");
const feedbackRoutes = require("../Router/FeedbackRouter.js");
const adminRoutes = require("../Router/AdminRouter.js");
const heartRateRoutes = require("../Router/HeartRateRouter.js");
const dialogflowRoute = require("../Router/dialogFlow.js");

const app = express();

app.use(cors());
app.use(express.json());

// Setup Dialogflow credentials
if (process.env.DIALOGFLOW_KEY_JSON) {
  const keyFilePath = path.join('/tmp', 'dialogflow-key.json');
  fs.writeFileSync(keyFilePath, process.env.DIALOGFLOW_KEY_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
}

// MongoDB connection (inside handler-safe block)
let conn = null;
async function connectToDatabase() {
  if (!conn) {
    conn = await mongoose.connect(process.env.MONGO_URI);
  }
  return conn;
}

// Routes
app.use("/api/patients", patientsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/heartrate", heartRateRoutes);
app.use("/api/dialogflow", dialogflowRoute);
app.use("/uploads", express.static("uploads"));

// Export the serverless handler
module.exports = async (req, res) => {
  await connectToDatabase();
  const handler = serverless(app);
  return handler(req, res);
};
