require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { processRepository } = require("./workers/ingestion");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Import upload routes
const uploadRoutes = require("./routes/upload");
const snippetRoutes = require("./routes/snippet");

// --- Endpoints ---

// 1. Trigger Ingestion
app.post("/api/ingest", async (req, res) => {
    const { projectId, repoUrl } = req.body;

    if (!projectId) return res.status(400).json({ error: "Missing projectId" });

    // Extract repo name from URL
    const repoName = repoUrl.split('/').slice(-2).join('/').replace('.git', '') || 'Unknown Repository';

    // Create Project Record
    const { error } = await supabase.from("projects").insert({
        id: projectId,
        name: repoName,
        git_url: repoUrl,
        status: "pending"
    });

    if (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project record" });
    }

    // Start worker in background
    processRepository(projectId, repoUrl).catch(err => console.error("Background worker error:", err));

    res.json({ message: "Ingestion started", projectId });
});

// Register upload routes for ZIP and Snippet
app.use("/api/ingest", uploadRoutes);

// Register snippet analysis routes
app.use("/api/snippet", snippetRoutes);

// 2. Chat API (Streaming) - Real Gemini 2.5 Flash
app.post("/api/chat", async (req, res) => {
    const { projectId, message, history } = req.body;

    try {
        // Fetch context path from DB
        const { data: project } = await supabase.from("projects").select("context_path").eq("id", projectId).single();

        if (!project || !project.context_path) {
            return res.status(404).json({ error: "Project context not found" });
        }

        // Download XML from Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("context-files")
            .download(project.context_path);

        if (downloadError) throw downloadError;
        const xmlContext = await fileData.text();

        console.log("🤖 Chat with Gemini 2.5 Flash activated...");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const systemPrompt = `Você é o ContextCore, um Arquiteto de Software Sênior especializado em análise de código.
        
SUA MISSÃO:
Analisar o código fornecido no XML abaixo e responder às perguntas do usuário com extrema precisão técnica.

REGRAS DE CONTEXTO:
1. O código está no formato XML estruturado: <codebase_context><files><file path="...">...</file></files></codebase_context>.
2. Cada linha de código possui um número de linha no formato "N: linha".

REGRAS DE RESPOSTA (VIBE CODING):
1. CITAÇÃO OBRIGATÓRIA: Sempre que citar um trecho de código, você DEVE indicar o arquivo e as linhas.
   Exemplo: "A função processData em \`src/utils.js\` (linhas 10-15) realiza..."
2. DIDÁTICA: Explique o "porquê" das decisões arquiteturais.
3. VISUAL: Use markdown, listas e blocos de código para facilitar a leitura.

CONTEXTO TOTAL:
${xmlContext}`;

        // History Compaction Logic (Simple Strategy: Summarize if > 10 turns)
        let activeHistory = history || [];
        if (activeHistory.length > 10) {
            // Keep system prompt (implied by startChat) + last 4 messages
            // Summarize the rest (TODO: Implement actual LLM summarization here for V2)
            // For now, we just truncate to keep the most recent context which is usually most relevant for coding
            const keptHistory = activeHistory.slice(-4);

            // Add a "system" note about truncation (simulated as model thought)
            activeHistory = [
                { role: "user", parts: [{ text: "[SISTEMA: Histórico anterior resumido para focar no contexto atual]" }] },
                { role: "model", parts: [{ text: "Entendido. Focando nas últimas interações." }] },
                ...keptHistory
            ];
        }

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Entendido. Análise carregada com sucesso. Aguardando comandos." }] },
                ...activeHistory
            ]
        });

        const result = await chat.sendMessageStream(message);

        res.setHeader("Content-Type", "text/plain");
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }
        res.end();

    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Chat failed" });
    }
});

// 3. Stripe Webhook (Placeholder)
app.post("/api/webhooks/stripe", async (req, res) => {
    console.log("Stripe webhook received");
    res.json({ received: true });
});

// 4. Stripe Checkout Session
app.post("/api/create-checkout-session", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "ContextCore Pro",
                        },
                        unit_amount: 1900,
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: "http://localhost:3000/dashboard?success=true",
            cancel_url: "http://localhost:3000/?canceled=true",
        });

        res.json({ url: session.url });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
