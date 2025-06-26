// import PatientModel from "../Model/PatientsModel.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import nodemailer from "nodemailer"
// import cron from "node-cron";


const PatientModel = require("../Model/PatientsModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cron = require("node-cron");


// ===================== Register Function =====================
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const existingPatient = await PatientModel.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({ message: "Patient already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newPatient = new PatientModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            type: "user"
        });

        await newPatient.save();

        if (!process.env.JWT_SECRET) {
            console.error("❌ ERROR: JWT_SECRET is not set in .env file!");
            return res.status(500).json({ message: "Server configuration error." });
        }

        const token = jwt.sign(
            { id: newPatient._id, email, firstName, lastName },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        
        res.status(201).json({ token });
    } catch (error) {
        console.error("❌ ERROR in Register Function:", error);
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};

// ===================== Login Function =====================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required!" });
        }

        const patient = await PatientModel.findOne({ email });
        if (!patient) {
            return res.status(400).json({ message: "Incorrect email or password!" });
        }

        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect email or password!" });
        }

        if (!process.env.JWT_SECRET) {
            console.error("❌ ERROR: JWT_SECRET is not set in .env file!");
            return res.status(500).json({ message: "Server configuration error." });
        }

        const token = jwt.sign(
            { id: patient._id, email, firstName: patient.firstName, lastName: patient.lastName },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error("❌ ERROR in Login Function:", error);
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};

// ===================== Profile Picture Upload =====================
// const profilePicturesDir = "uploads/profile_pictures";
const profilePicturesDir = path.join('/tmp', 'profile_pictures');

if (!fs.existsSync(profilePicturesDir)) {
    fs.mkdirSync(profilePicturesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilePicturesDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage }).single("profilePicture");

// ===================== Edit Profile Function =====================
const editProfile = async (req, res) => {
    try {
        const { firstName, lastName, allergies, chronicConditions } = req.body;
        const patientId = req.user.id;

        let updateFields = { firstName, lastName, allergies, chronicConditions };

        if (req.file) {
            updateFields.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
        }

        const updatedPatient = await PatientModel.findByIdAndUpdate(
            patientId,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({ message: "Patient not found!" });
        }

        res.status(200).json({ message: "Profile updated successfully", updatedPatient });
    } catch (error) {
        console.error("❌ ERROR in Edit Profile Function:", error);
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};

// ===================== Get Patient Profile =====================
const getPatientProfile = async (req, res) => {
    try {
        const patientId = req.user.id;

        const patient = await PatientModel.findById(patientId).select("-password");
        if (!patient) {
            return res.status(404).json({ message: "Patient not found!" });
        }

        res.status(200).json(patient);
    } catch (error) {
        console.error("❌ ERROR in Get Patient Profile:", error);
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};

// ===================== Set Check-Up Date =====================

const setCheckupDate = async (req, res) => {
  try {
    const { checkupDate, checkupEmail } = req.body;
    const patientId = req.user.id;

    if (!checkupDate || !checkupEmail) {
      return res.status(400).json({ message: "checkupDate and checkupEmail are required" });
    }

    const parsedDate = new Date(checkupDate);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const updatedPatient = await PatientModel.findByIdAndUpdate(
      patientId,
      { lastCheckupDate: parsedDate },
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // ✅ Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // ✅ Send immediate email notification
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: checkupEmail,
      subject: "Medical Checkup Reminder",
      html: `
        <h2>Check-Up Reminder Confirmation</h2>
        <p>Hello ${updatedPatient.firstName},</p>
        <p>Thank you! We've recorded your last check-up date as <strong>${new Date(parsedDate).toDateString()}</strong>.</p>
        <p>This is your reminder email confirming it was saved successfully. please do your medical check-up by next year on same day to make sure for your health. and we will send you also notification on the same day next year :)</p>
        <br />
        <p>– HealthCare Storage Team</p>
      `,
    });

    res.status(200).json({
      message: "Check-up date saved and reminder email sent successfully",
      lastCheckupDate: updatedPatient.lastCheckupDate,
    });

  } catch (error) {
    console.error("❌ Error in setCheckupDate:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports ={register, login, upload, editProfile, getPatientProfile, setCheckupDate};