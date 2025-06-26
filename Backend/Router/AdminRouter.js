const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getAdminDashboard,
  getPatientFeedback,
  updatePatientStatus,
  deletePatient,
  getAllPatients
} = require("../Controller/AdminController.js");

const { protectAdmin } = require("../Middlewares/AdminMiddleware.js");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", protectAdmin, getAdminProfile);
router.get("/dashboard", protectAdmin, getAdminDashboard);
router.get("/feedback", protectAdmin, getPatientFeedback);
router.put("/patients/update-status/:id", protectAdmin, updatePatientStatus);
router.delete("/patients/:id", protectAdmin, deletePatient);
router.get("/patients", protectAdmin, getAllPatients);

module.exports = router;
