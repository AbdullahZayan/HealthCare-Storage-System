import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Feedback", FeedbackSchema);
