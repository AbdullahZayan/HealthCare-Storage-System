import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getAdminDashboard,
  getPatientFeedback,
  updatePatientStatus,
  deletePatient
} from "../Controller/AdminController.js";
import { protectAdmin } from "../Middlewares/AdminMiddleware.js";
import { getAllPatients } from "../Controller/AdminController.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", protectAdmin, getAdminProfile);
router.get("/dashboard", protectAdmin, getAdminDashboard);
router.get("/feedback", protectAdmin, getPatientFeedback);
router.put("/patients/update-status/:id", protectAdmin, updatePatientStatus);
router.delete("/patients/:id", protectAdmin, deletePatient);
router.get("/patients", protectAdmin, getAllPatients);

export default router;
