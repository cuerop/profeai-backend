const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generar", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Falta el prompt" });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: "Eres un asistente educativo experto. Respondes siempre en español con contenido claro, estructurado y pedagógico."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    const resultado = data.choices?.[0]?.message?.content || "Sin respuesta";
    res.json({ resultado });
  } catch (error) {
    res.status(500).json({ error: "Error al llamar a la IA: " + error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor corriendo con Groq");
});
