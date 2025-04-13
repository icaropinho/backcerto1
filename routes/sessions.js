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

    const userAnswers = session.conversation.filter(l => l.startsWith("Usuário")).map(l => l.replace("Usuário: ", ""));
    const respostaAnterior = userAnswers[userAnswers.length - 1];

    if (userAnswers.length >= 5) {
      const prompt = [
        { role: "system", content: "Você é um consultor especializado em Lean Manufacturing, TPS (Toyota Production System), PDCA e TPM. Sua tarefa é fornecer análises técnicas detalhadas e sugestões práticas de melhoria." },
        {
          role: "user",
          content:
            session.conversation.join("\n") +
            "\nCom base nas respostas acima, forneça uma análise técnica no formato Lean/TPS:\n1. Causa raiz (utilizando ferramentas como 5 Porquês, Diagrama de Ishikawa, análise de fluxos de valor, etc.)\n2. Ação corretiva focada em melhoria contínua, utilizando métodos como PDCA, Kaizen (melhoria incremental), TPM e Just-In-Time para otimização dos processos e eliminação de desperdícios."
        }
      ];

      const aiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4", // Agora usando GPT-4
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
      const nextQuestion = `Por que "${respostaAnterior}"? (${userAnswers.length + 1}/5)`;
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

// Consulta últimas sessões (opcional)
router.get("/", async (req, res) => {
  const sessions = await Session.find().sort({ createdAt: -1 }).limit(20);
  res.json(sessions);
});

export default router;
