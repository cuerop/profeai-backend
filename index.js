const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/generar", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Falta el prompt" });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });
    const resultado = message.content[0].text;
    res.json({ resultado });
  } catch (error) {
    res.status(500).json({ error: "Error al llamar a la IA" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor corriendo");
});