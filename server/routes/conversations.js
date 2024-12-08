const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { saveMessage, getConversationsByUser, getConversationByID } = require("../controllers/conversationController");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const loadBiomarkerData = () => {
	const biomarkerDataPath = path.resolve(__dirname, "../data/biomarkers.json");
	const biomarkerData = JSON.parse(fs.readFileSync(biomarkerDataPath, "utf-8"));
	return biomarkerData;
};

const getChatbotResponse = async (message, biomarkerData, messages) => {
	const biomarkerList = loadBiomarkerData();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Modify system instruction to ensure only biomarker-related queries use the data
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        system_instruction: [
            "You are a concise and precise medical assistant.",
            "Only utilize the biomarker data if the user asks a question about it.",
            "Respond only to the user's specific query using the data explicitly provided.",
            "Use only the biomarker data and context provided; do not fabricate or infer any new data.",
            "If the question cannot be answered with the given data, state: \"I require more specific information to answer this question.\"",
            "Avoid all disclaimers, legal statements, or irrelevant remarks. Keep answers short, direct, and focused on the user's query.",
            "For biomarker data, analyze trends or abnormalities based solely on the provided historical data.",
            "Utilize the biomarker data and reference ranges provided in the mostRecent and historical biomarker data to analyze and talk about health parameters.",
			"Don't format list elements with bold"
        ]
    });

    // Function to check if the message contains any biomarker or its alias
    const containsBiomarkerMention = (message, biomarkerList) => {
        const keywords = ["report", "test", "result", "level", "measurement"];
        // Check for biomarkers and aliases in the message
        for (const biomarker in biomarkerList) {
            const aliases = biomarkerList[biomarker].aliases;
            if (aliases.some(alias => message.toLowerCase().includes(alias.toLowerCase()))) {
                return biomarker;
            }
        }
        // Check if any of the keywords are mentioned
        if (keywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
            return "report";
        }

        return null;
    };

    // Check if the message contains any biomarker mention
    const mentionedBiomarker = containsBiomarkerMention(message, biomarkerList);

    // Conditionally add biomarker data to the message if relevant
    let fullMessage = message;
    if (mentionedBiomarker) {
        const biomarkerInfo = biomarkerList[mentionedBiomarker];
        fullMessage += `. Here is the biomarker data: ${JSON.stringify(biomarkerData)}`;
    }
    // Build the conversation context by combining previous messages
    const context = messages.map(item => `${item.sender}: ${item.text}`).join('\n');

    // Add the conversation context to the fullMessage
    fullMessage = `Previous context: ${context}. New message:` + fullMessage;
	//console.log(fullMessage)
    // Ensure the model generates content and the response is properly extracted
    const result = await model.generateContent(fullMessage);
    const response = result.response;

    return response.text();
};

const OLLAMA_HOST = "http://127.0.0.1:11435/";
const generateResponse = async (message, biomarkerData, messages) => {
	const biomarkerList = loadBiomarkerData();
    try {
        console.log("Generating response from Ollama...");
		const containsBiomarkerMention = (message, biomarkerList) => {
			const keywords = ["report", "test", "result", "level", "measurement", "blood"];
			// Check for biomarkers and aliases in the message
			for (const biomarker in biomarkerList) {
				const aliases = biomarkerList[biomarker].aliases;
				if (aliases.some(alias => message.toLowerCase().includes(alias.toLowerCase()))) {
					return biomarker;
				}
			}
			// Check if any of the keywords are mentioned
			if (keywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
				return "report";
			}

			return null;
		};

		// Check if the message contains any biomarker mention
		const mentionedBiomarker = containsBiomarkerMention(message, biomarkerList);

		// Conditionally add biomarker data to the message if relevant
		let fullMessage = message;
		if (mentionedBiomarker) {
			const biomarkerInfo = biomarkerList[mentionedBiomarker];
			fullMessage += `. Here is the biomarker data: ${JSON.stringify(biomarkerData)}`;
		}
		console.log(messages)
		if(messages)
			fullMessage = `Previous context: ${context}. New message:` + fullMessage;

        // Prepare the system instruction and message structure for Ollama
        const requestPayload = {
            model: "monotykamary/medichat-llama3",
            messages: [
                {
                    role: "system",
                    content: "You are a concise and precise medical assistant. Only utilize the biomarker data if the user asks a question about it. Respond only to the user's specific query using the data explicitly provided. Use only the biomarker data and context provided; do not fabricate or infer any new data. If the question cannot be answered with the given data, state: \"I require more specific information to answer this question.\" Avoid all disclaimers, legal statements, or irrelevant remarks. Keep answers short, direct, and focused on the user's query. For biomarker data, analyze trends or abnormalities based solely on the provided historical data. Utilize the biomarker data and reference ranges provided in the mostRecent and historical biomarker data to analyze and talk about health parameters."
                },
                {
                    role: "user",
                    content: fullMessage,
                },
            ],
            stream: false, // Ensure non-streaming for easier parsing
        };

        // Send the request to Ollama API
        const response = await fetch(`${OLLAMA_HOST}api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestPayload),
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        //console.log("Ollama API Response:", data);

        // Ensure that the response contains the necessary content
        if (!data.message || !data.message.content) {
            throw new Error("Ollama API did not return a valid response");
        }

        return data.message.content; // Return the assistant's response

    } catch (error) {
        console.error("Error generating response from Ollama:", error);
        return "Sorry, I am unable to process your request right now.";
    }
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
    try {
        // Verify token
        const decoded = jwt.verify(req.params.token, process.env.JWTPRIVATEKEY);
        const userId = decoded._id;
        try {
            // Fetch conversations by user ID
            const conversations = await getConversationsByUser(userId);
            res.json({ conversations });
        } catch (error) {
            console.error("Error fetching conversations:", error);
            res.status(500).send({ message: "Error fetching conversations" });
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Token expired, send 401 Unauthorized response
            return res.status(401).send({ message: "Token expired, please log in again" });
        } else {
            // Invalid token or other JWT verification errors
            return res.status(401).send({ message: "Invalid token" });
        }
    }
});

router.post("/chat", async (req, res) => {
    const { token, message, messages, data, conversationID, topic } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
        const userId = decoded._id;

        await saveMessage(userId, conversationID, "user", message, topic);
        const botResponse = await getChatbotResponse(message, data, messages);
		//generateResponse(message, data);
        await saveMessage(userId, conversationID, "bot", botResponse, topic);
        res.json({ botResponse });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
