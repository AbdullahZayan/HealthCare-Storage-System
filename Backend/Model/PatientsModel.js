// import mongoose from "mongoose";
const mongoose = require("mongoose");


const PatientSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, required: false },
    allergies: { type: String, default: "" }, 
    chronicConditions: { type: String, default: "" }, 
    profilePicture: { type: String, default: "" }, //(URL for profile picture)
    status: { type: String, enum: ["active", "deactivated"], default: "active" },
    lastCheckupDate: { type: Date },
    reminderSent: { type: Boolean, default: false }
});

// export default mongoose.model("Patient", PatientSchema);
module.exports = mongoose.model("Patient", PatientSchema)
