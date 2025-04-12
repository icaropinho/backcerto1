const aiResponse = await axios.post(
  "https://api.openai.com/v1/chat/completions",
  {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `Você é um facilitador da técnica dos 5 porquês. Faça até 5 perguntas começando com "Por quê?", de forma encadeada, para identificar a causa raiz de um problema. Após a quinta pergunta, sugira uma causa raiz provável e uma ação corretiva.`
      },
      {
        role: "user",
        content: `Problema: ${problem}`
      }
    ]
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    }
  }
);

  res.json(sessions);
});

export default router;
