// import express from "express";
// import { register, login, editProfile, upload, getPatientProfile, setCheckupDate } from "../Controller/PatientsController.js";
// import { authenticateToken } from "../Middlewares/authMiddleware.js";


const express = require("express");

const {
  register,
  login,
  editProfile,
  upload,
  getPatientProfile,
  setCheckupDate
} = require("../Controller/PatientsController.js");

const { authenticateToken } = require("../Middlewares/authMiddleware.js");


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// router.put("/profile", authenticateToken, editProfile); 
router.put("/edit-profile", authenticateToken, upload, editProfile);
router.get("/profile", authenticateToken, getPatientProfile);
router.put("/set-checkup-date", authenticateToken, setCheckupDate);

module.exports = router;