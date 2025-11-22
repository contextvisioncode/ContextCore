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
        const systemPrompt = `Você é o ContextCore. Use o XML abaixo como memória total do código. Responda como um Arquiteto de Software Sênior. Seja técnico, preciso e conciso.\n\nCONTEXTO:\n${xmlContext}`;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Entendido. Estou pronto para analisar o código." }] },
                ...(history || [])
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
