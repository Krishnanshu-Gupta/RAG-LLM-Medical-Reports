const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { saveMessage, getConversationsByUser, getConversationByID } = require("../controllers/conversationController");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const getChatbotResponse = async (message) => {
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro"
		/* system_instruction=["don't use technical terms in your response",] */});
    const result = await model.generateContent(message);
	const response = result.response;
	return response.text();
};

router.get("/conversation/:token/:conversationID", async (req, res) => {
	const { token, conversationID } = req.params;
	try {
		const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
		const userId = decoded._id;
		const messages = await getConversationByID(userId, conversationID);
		res.json(messages);
	} catch (error) {
		console.error("Error fetching conversation:", error);
		res.status(500).send({ message: "Error fetching conversation" });
	}
});

router.get("/user/:token", async (req, res) => {
    const decoded = jwt.verify(req.params.token, process.env.JWTPRIVATEKEY);
    const userId = decoded._id;
    try {
        const conversations = await getConversationsByUser(userId);
        res.json({ conversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).send({ message: "Error fetching conversations" });
    }
});

router.post("/chat", async (req, res) => {
	const { token, message, conversationID, topic } = req.body;
	try {
		const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
		const userId = decoded._id;
		await saveMessage(userId, conversationID, "user", message, topic);

		const botResponse = await getChatbotResponse(message);
		//const botResponse = "currently off, need to enable it in conversations.js"
		await saveMessage(userId, conversationID, "bot", botResponse, topic);
		res.json({ botResponse });
	} catch (error) {
		console.error("Chat error:", error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

module.exports = router;
