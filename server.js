const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        ai: !!process.env.OPENAI_API_KEY
    });
});

app.post("/api/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Mensagem vazia"
            });
        }

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            instructions:
                "Você é J.A.R.V.I.S., um assistente virtual inteligente, educado, direto e natural. Responda em português do Brasil. Não diga que suas respostas são programadas. Converse naturalmente.",
            input: message
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {

        console.error("ERRO OPENAI:", error);

        res.status(500).json({
            error: "Falha ao acessar a inteligência artificial"
        });

    }

});

app.listen(PORT, () => {
    console.log(`JARVIS online na porta ${PORT}`);
});
