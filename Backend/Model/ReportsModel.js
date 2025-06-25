import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const ReportSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    fileName: { type: String, required: true },
    savedFileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    reportType: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    comments: [CommentSchema]
});

export default mongoose.model("Report", ReportSchema);