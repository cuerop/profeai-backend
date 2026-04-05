const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Convierte markdown simple a HTML
function markdownAHtml(texto) {
  return texto
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

// Genera HTML del PDF
function generarHTML(titulo, nivel, tipo, contenido) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; line-height: 1.6; }
    .header { background: linear-gradient(135deg, #0f3460, #16213e); color: white; padding: 24px; border-radius: 12px; margin-bottom: 32px; }
    .header h1 { margin: 0 0 8px; font-size: 28px; }
    .header p { margin: 0; opacity: 0.8; font-size: 14px; }
    h1 { color: #0f3460; font-size: 24px; margin-top: 28px; border-bottom: 2px solid #0f3460; padding-bottom: 8px; }
    h2 { color: #16213e; font-size: 20px; margin-top: 22px; }
    h3 { color: #0f3460; font-size: 16px; margin-top: 16px; }
    li { margin: 6px 0; }
    strong { color: #0f3460; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 ProfeAI</h1>
    <p>${tipo} — ${titulo} | Nivel: ${nivel}</p>
  </div>
  ${markdownAHtml(contenido)}
  <div class="footer">Generado por ProfeAI • IA Educativa</div>
</body>
</html>`;
}

// ─── Ruta principal: generar texto ───────────────────────────────────────────
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
          { role: "system", content: "Eres un asistente educativo experto. Respondes siempre en español con contenido claro, estructurado y pedagógico." },
          { role: "user", content: prompt }
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

// ─── Ruta: exportar PDF ───────────────────────────────────────────────────────
app.post("/exportar-pdf", async (req, res) => {
  const { contenido, titulo, nivel, tipo } = req.body;
  if (!contenido) return res.status(400).json({ error: "Falta el contenido" });

  try {
    const html = generarHTML(titulo, nivel, tipo, contenido);
    // Devolvemos el HTML para que la app lo abra en el navegador como PDF
    res.json({ html, filename: `ProfeAI_${titulo}.html` });
  } catch (error) {
    res.status(500).json({ error: "Error generando PDF: " + error.message });
  }
});

// ─── Ruta: exportar Word/TXT ──────────────────────────────────────────────────
app.post("/exportar-doc", async (req, res) => {
  const { contenido, titulo, nivel, tipo } = req.body;
  if (!contenido) return res.status(400).json({ error: "Falta el contenido" });

  try {
    const texto = [
      `${"=".repeat(60)}`,
      `PROFEAI - ${tipo.toUpperCase()}`,
      `Tema: ${titulo}`,
      `Nivel: ${nivel}`,
      `${"=".repeat(60)}`,
      "",
      contenido
        .replace(/^#{1,3}\s*/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/^- /gm, "• "),
      "",
      `${"─".repeat(60)}`,
      `Generado por ProfeAI`
    ].join("\n");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="ProfeAI_${titulo}.txt"`);
    res.send(texto);
  } catch (error) {
    res.status(500).json({ error: "Error generando documento: " + error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor corriendo con Groq");
});
