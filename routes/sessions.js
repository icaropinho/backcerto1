import express from "express";
import axios from "axios";
import Session from "../models/Session.js";

const router = express.Router();

// Inicia uma nova sessão de 5 porquês
router.post("/", async (req, res) => {
  const { problem } = req.body;

  try {
    const session = new Session({
      problem,
      conversation: [`Problema: ${problem}`]
    });
    await session.save();

    // Primeira pergunta
    const question = "Por que isso está acontecendo?";
    session.conversation.push(`IA: ${question}`);
    await session.save();

    res.json({
      sessionId: session._id,
      question
    });
  } catch (err) {
    console.error("Erro ao iniciar sessão:", err.message);
    res.status(500).json({ error: "Erro ao iniciar sessão" });
  }
});

// Envia uma resposta e recebe o próximo "Por quê?" ou resultado final
router.post("/:id", async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  try {
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ error: "Sessão não encontrada" });

    session.conversation.push(`Usuário: ${answer}`);

    const userAnswers = session.conversation.filter(l => l.startsWith("Usuário")).length;

    if (userAnswers >= 5) {
      // Monta o histórico completo e pede causa raiz + ação
      const prompt = [
        { role: "system", content: "Você é um especialista na técnica dos 5 porquês." },
        {
          role: "user",
          content:
            session.conversation.join("\n") +
            "\nCom base nas respostas acima, forneça a causa raiz provável e uma ação corretiva para o problema apresentado."
        }
      ];

      const aiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: prompt
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const resultado = aiResponse.data.choices[0].message.content;
      session.conversation.push(`IA: ${resultado}`);
      await session.save();

      return res.json({
        final: true,
        result: resultado
      });
    } else {
      // Próxima pergunta: "Por quê?"
      const nextQuestion = `Por que? (${userAnswers + 1}/5)`;
      session.conversation.push(`IA: ${nextQuestion}`);
      await session.save();

      return res.json({
        final: false,
        question: nextQuestion
      });
    }
  } catch (err) {
    console.error("Erro durante a sessão:", err.message);
    res.status(500).json({ error: "Erro durante a sessão" });
  }
});

// Histórico (para visualização ou testes)
router.get("/", async (req, res) => {
  const sessions = await Session.find().sort({ createdAt: -1 }).limit(20);
  res.json(sessions);
});

export default router;
