import FeedbackModel from "../Model/FeedbackModel.js";

// ===================== Submit Feedback =====================
export const submitFeedback = async (req, res) => {
    try {  
        const { message } = req.body;
        const patientId = req.user.id;

        if (!message) {
            return res.status(400).json({ message: "Feedback message is required!" });
        }

        const feedback = new FeedbackModel({ patientId, message });
        await feedback.save();

        res.status(201).json({ message: "Feedback submitted successfully!" });
    } catch (error) {
        console.error("❌ ERROR in Submit Feedback:", error);
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};

// ===================== Get All Feedback (Admin Only) =====================
export const getAllFeedback = async (req, res) => {
    try {
        const feedbackList = await FeedbackModel.find().populate("patientId", "firstName lastName email");
        res.status(200).json(feedbackList);
    } catch (error) {
        console.error("❌ ERROR in Get All Feedback:", error);
        res.status(500).json({ message: "Failed to fetch feedback", error: error.message });
    }
};
