// server.js

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000; // Use environment port or default 3000

const cors = require('cors');
app.use(cors()); //
// app.get('/', (req, res) => {
    // res.json({ status: "Server OK" });
  
  

// --- Gemini API Configuration ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: Gemini API key not found. Make sure it's set in the .env file.");
    process.exit(1); // Exit if API key is missing
}
const genAI = new GoogleGenerativeAI(apiKey);
//const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or choose another suitable model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });


// --- Middleware ---
app.use(express.json()); // Enable parsing JSON request bodies
app.use(express.static('public')); // Serve static files (HTML, CSS, JS) from the 'public' directory

// --- API Endpoint for Chat ---

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log("Received message:", userMessage); // Log user message

        // --- Call Gemini API ---
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const aiResponseText = await response.text();

        console.log("Gemini Response:", aiResponseText); // Log AI response

        // Send the AI's response back to the frontend
        res.json({ reply: aiResponseText });

    } catch (error) {
        console.error("Error processing chat message:", error);
        // Check for specific Gemini API errors if needed
        if (error.message.includes('API key not valid')) {
             res.status(401).json({ error: 'Invalid API Key.' });
        } else if (error.response && error.response.status === 429) {
            res.status(429).json({ error: 'API quota exceeded or rate limit hit.' });
        }
        else {
            res.status(500).json({ error: 'An error occurred processing your request.' });
        }
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log("Serving static files from 'public' directory.");
    console.log("Chat endpoint available at POST /chat");
});
app.get('/', (req, res) => {
});
