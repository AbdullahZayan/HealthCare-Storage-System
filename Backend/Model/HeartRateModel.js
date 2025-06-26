// import mongoose from "mongoose";
const mongoose = require("mongoose");


const heartRateSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  value: {
    type: Number, 
    required: true
  },
  date: {
    type: Date,
    default: Date.now // or user can provide their own date
  }
});


// export default mongoose.model("HeartRate", heartRateSchema);
module.exports = mongoose.model("HeartRate", heartRateSchema)

