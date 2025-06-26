// import HeartRateModel from "../Model/HeartRateModel.js";

const HeartRateModel = require("../Model/HeartRateModel.js");

// 1) Add a heart rate entry
 const addHeartRate = async (req, res) => {
  try {
    const patientId = req.user.id; // from JWT
    const { value, date } = req.body;

    if (!value) {
      return res.status(400).json({ message: "Heart rate value is required" });
    }

    // If the user provided a custom date, parse it; otherwise use now
    const recordDate = date ? new Date(date) : new Date();

    const newRecord = new HeartRateModel({
      patientId,
      value,
      date: recordDate
    });

    await newRecord.save();

    return res.status(201).json({
      message: "Heart rate entry created successfully",
      record: newRecord
    });
  } catch (error) {
    console.error("❌ ERROR adding heart rate:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2) Get all heart rate entries for this patient
 const getHeartRateHistory = async (req, res) => {
  try {
    const patientId = req.user.id; // from JWT
    // For example, let's just get them sorted by date ascending
    const records = await HeartRateModel.find({ patientId }).sort({ date: 1 });
    return res.status(200).json(records);
  } catch (error) {
    console.error("❌ ERROR fetching heart rate history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {addHeartRate, getHeartRateHistory};