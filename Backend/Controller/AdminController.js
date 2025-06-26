// import mongoose from "mongoose";
// import { Admin } from "../Model/AdminModel.js";
// import Patient from "../Model/PatientsModel.js";
// import Report from "../Model/ReportsModel.js";
// import Feedback from "../Model/FeedbackModel.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

const mongoose = require("mongoose");
const { Admin } = require("../Model/AdminModel.js");
const Patient = require("../Model/PatientsModel.js");
const Report = require("../Model/ReportsModel.js");
const Feedback = require("../Model/FeedbackModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// Admin Registration
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    admin = new Admin({ name, email, password });
    await admin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.json({ token, adminId: admin._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Admin Profile
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Dashboard Stats
const getAdminDashboard = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalReports = await Report.countDocuments();
    res.json({ totalPatients, totalReports });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Patient Feedback
const getPatientFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("patientId", "name") // assuming "name" is the field in Patient
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Patients (Admin)
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().select("-password");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch patients", error: error.message });
  }
};


// Activate / Deactivate Patient Account
const updatePatientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid patient ID format" });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (status !== "active" && status !== "deactivated") {
      return res.status(400).json({ message: "Invalid status value" });
    }

    patient.status = status;
    await patient.save();
    res.json({ message: `Patient ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid patient ID format" });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    await patient.deleteOne();
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerAdmin,
  getAllPatients,
  loginAdmin,
  getAdminProfile,
  getAdminDashboard,
  getPatientFeedback,
  updatePatientStatus,
  deletePatient,
};
