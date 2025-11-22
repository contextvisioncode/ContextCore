const simpleGit = require("simple-git");
const admZip = require("adm-zip");
const glob = require("fast-glob");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getAuthenticatedCloneUrl } = require("../services/githubAuth");
const { v4: uuidv4 } = require("uuid");

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processRepository(projectId, repoUrl, zipBuffer = null) {
    const workDir = path.join(os.tmpdir(), uuidv4());

    try {
        // 1. Update status to processing
        await supabase.from("projects").update({ status: "processing" }).eq("id", projectId);

        // 2. Clone or Unzip
        if (zipBuffer) {
            const zip = new admZip(zipBuffer);
            zip.extractAllTo(workDir, true);
        } else if (repoUrl) {
            const authUrl = await getAuthenticatedCloneUrl(repoUrl);
            await simpleGit().clone(authUrl, workDir);
        } else {
            throw new Error("No repository URL or ZIP provided");
        }

        // 3. Magic Filter (fast-glob)
        const entries = await glob(["**/*"], {
            cwd: workDir,
            ignore: [
                "**/node_modules/**",
                "**/.git/**",
                "**/dist/**",
                "**/build/**",
                "**/*.lock",
                "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.svg", "**/*.ico",
                "**/*.mp4", "**/*.webm", "**/*.mp3",
                "**/*.pdf", "**/*.doc", "**/*.docx",
                "**/*.exe", "**/*.dll", "**/*.so", "**/*.dylib",
                "**/*.zip", "**/*.tar", "**/*.gz"
            ],
            onlyFiles: true,
            absolute: true
        });

        // 4. Generate Context XML (Structured & Optimized)
        const { generateStructuredXML } = require("../services/contextOptimizer");

        const fileObjects = [];
        for (const filePath of entries) {
            const relativePath = path.relative(workDir, filePath);
            try {
                const content = fs.readFileSync(filePath, "utf8");
                fileObjects.push({ path: relativePath, content });
            } catch (err) {
                console.warn(`Skipping file ${relativePath}: ${err.message}`);
            }
        }

        const xmlContent = generateStructuredXML(fileObjects);

        // 5. Upload XML to Supabase Storage
        const storagePath = `${projectId}/context.xml`;
        const { error: uploadError } = await supabase.storage
            .from("context-files")
            .upload(storagePath, xmlContent, { contentType: "text/xml", upsert: true });

        if (uploadError) throw uploadError;

        // 6. Generate Graph with Gemini 2.5 Flash (with retry logic)
        console.log("🤖 Generating graph with Gemini 2.5 Flash...");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Analise a arquitetura do código abaixo. Retorne APENAS um JSON válido representando um GRAFO HIERÁRQUICO.
        
        Estrutura do JSON:
        {
          "nodes": [
            { "id": "group_core", "type": "group", "data": { "label": "Core Logic" }, "position": { "x": 0, "y": 0 }, "style": { "width": 600, "height": 600, "backgroundColor": "rgba(30, 41, 59, 0.5)" } },
            { "id": "node_1", "parentNode": "group_core", "extent": "parent", "data": { "label": "Server.js" }, "position": { "x": 50, "y": 50 }, "type": "default" }
          ],
          "edges": [
            { "id": "e1-2", "source": "node_1", "target": "node_2", "animated": true }
          ]
        }

        REGRAS:
        1. Identifique os principais MÓDULOS ou PASTAS (ex: Backend, Frontend, Utils, Services) e crie nós do tipo "group" para eles.
        2. Coloque os arquivos/classes dentro desses grupos usando a propriedade "parentNode".
        3. Use cores vibrantes para os grupos (ex: rgba(99, 102, 241, 0.2) para backend, rgba(16, 185, 129, 0.2) para frontend).
        4. NÃO inclua markdown. Apenas JSON puro.

        Código:
        ${xmlContent.substring(0, 1000000)}`;

        let graphJson = null;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📡 Gemini API attempt ${attempt}/${maxRetries}...`);
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Clean up markdown code blocks if present
                const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
                graphJson = JSON.parse(jsonString);
                console.log("✅ Graph generated successfully!");
                break; // Success, exit retry loop

            } catch (error) {
                if (error.status === 429 && attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 30; // Exponential backoff: 60s, 120s, 240s
                    console.warn(`⏳ Rate limited. Waiting ${waitTime}s before retry ${attempt + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                } else {
                    throw error; // Re-throw if not rate limit or out of retries
                }
            }
        }

        if (!graphJson) {
            throw new Error("Failed to generate graph after all retries");
        }

        // 7. Update Project with Success
        await supabase.from("projects").update({
            status: "completed",
            context_path: storagePath,
            graph_json: graphJson
        }).eq("id", projectId);

    } catch (error) {
        console.error("Ingestion failed:", error);

        // Build detailed error log
        const errorLog = {
            timestamp: new Date().toISOString(),
            errorType: error.constructor.name,
            message: error.message,
            status: error.status || null,
            statusText: error.statusText || null,
            stack: error.stack,
            phase: "Unknown"
        };

        // Determine which phase failed
        if (error.message.includes("clone")) {
            errorLog.phase = "Repository Cloning";
            errorLog.suggestion = "Check repository URL and access permissions";
        } else if (error.message.includes("glob") || error.message.includes("filter")) {
            errorLog.phase = "File Filtering";
        } else if (error.message.includes("upload") || error.message.includes("storage")) {
            errorLog.phase = "Storage Upload";
            errorLog.suggestion = "Check Supabase storage permissions";
        } else if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("exhausted")) {
            errorLog.phase = "Gemini API - Rate Limit";
            errorLog.suggestion = "Wait 60 seconds before retrying. Consider upgrading API quota at https://aistudio.google.com/";
        } else if (error.message.includes("generateContent") || error.message.includes("Gemini")) {
            errorLog.phase = "Gemini API - Generation";
            errorLog.suggestion = "Check Gemini API key and model availability";
        } else if (error.message.includes("JSON")) {
            errorLog.phase = "JSON Parsing";
            errorLog.suggestion = "Gemini returned invalid JSON. Try adjusting the prompt.";
        }

        // Save detailed error to database
        await supabase.from("projects").update({
            status: "failed",
            error_log: JSON.stringify(errorLog, null, 2)
        }).eq("id", projectId);

    } finally {
        // Cleanup temp dir
        try {
            fs.rmSync(workDir, { recursive: true, force: true });
        } catch (e) {
            console.error("Failed to cleanup temp dir:", e);
        }
    }
}

module.exports = { processRepository };
