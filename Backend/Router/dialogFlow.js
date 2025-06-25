import express from "express";
import dialogflow from "@google-cloud/dialogflow";

const router = express.Router();
const sessionClient = new dialogflow.SessionsClient();

router.post("/detectIntent", async (req, res) => {
  console.log("👉 [Dialogflow] payload:", req.body);
  try {
    const { text, sessionId } = req.body;
    const projectId = await sessionClient.getProjectId(); // ✅ Get project ID from credentials
console.log("📛 Project ID resolved:", projectId); // 🔍 check this line

    const sessionPath = `projects/${projectId}/agent/sessions/${sessionId}`; // ✅ correct manual path

    const [response] = await sessionClient.detectIntent({
      session: sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: "en-US",
        },
      },
    });

    console.log("   reply=", response.queryResult.fulfillmentText);
    res.json({ reply: response.queryResult.fulfillmentText });
  } catch (err) {
    console.error("💥 [Dialogflow] ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
