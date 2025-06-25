import express from "express";
import { register, login, editProfile, upload, getPatientProfile, setCheckupDate } from "../Controller/PatientsController.js";
import { authenticateToken } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// router.put("/profile", authenticateToken, editProfile); 
router.put("/edit-profile", authenticateToken, upload, editProfile);
router.get("/profile", authenticateToken, getPatientProfile);
router.put("/set-checkup-date", authenticateToken, setCheckupDate);
export default router;