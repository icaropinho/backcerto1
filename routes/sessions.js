import express from "express";
import axios from "axios";
import Session from "../models/Session.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { problem } = req.body;

  try {
    const aiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Você é um facilitador da técnica dos 5 porquês." },
          { role: "user", content: `Problema: ${problem}. Faça a primeira pergunta.` }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const session = new Session({
      problem,
      conversation: [problem, aiResponse.data.choices[0].message.content]
    });

    await session.save();
    res.json(session);
  } catch (err) {
    console.error("Erro ao consultar OpenAI:", err.message);
    res.status(500).json({ error: "Erro ao consultar OpenAI" });
  }
});

router.get("/", async (req, res) => {
  const sessions = await Session.find().sort({ createdAt: -1 }).limit(20);
  res.json(sessions);
});

export default router;
