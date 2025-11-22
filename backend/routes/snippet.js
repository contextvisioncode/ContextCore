const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Analyze code snippet and generate XML context for chat
router.post('/analyze', async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || code.trim().length === 0) {
            return res.status(400).json({ error: 'Code is required' });
        }

        if (code.length > 50000) {
            return res.status(400).json({ error: 'Code exceeds maximum length of 50,000 characters' });
        }

        const projectId = `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`📝 Generating deep context XML for snippet ${projectId}...`);

        // Generate detailed XML context using Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const xmlPrompt = `You are a Senior Software Architect analyzing code. Generate a SUPER DETAILED XML context document that will serve as the AI's complete memory of this code.

Language: ${language === 'auto' ? 'Auto-detect and specify' : language}

Code:
\`\`\`
${code}
\`\`\`

Generate XML with DEEP analysis and AI commentary showing you truly understand this code.

Include sections for:
- metadata (id, name, language, lines, complexity score)
- overview (detailed description of purpose)
- architecture (patterns, style, dependencies)
- ai_insights (your expert observations with priority levels)
- code_structure (each function/class with signature, purpose, complexity, AI commentary explaining WHY it works this way)
- quality_assessment (strengths, weaknesses with severity, security issues)
- recommendations (refactoring, optimization, best practices)

Format as valid XML. Be COMPREHENSIVE and demonstrate expertise through commentary.`;

        const result = await model.generateContent(xmlPrompt);
        const xmlContext = result.response.text()
            .replace(/```xml\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Save XML to Supabase Storage
        const xmlFileName = `${projectId}/context.xml`;
        const { error: uploadError } = await supabase.storage
            .from('context-files')
            .upload(xmlFileName, xmlContext, {
                contentType: 'application/xml',
                upsert: true
            });

        if (uploadError) {
            console.error('XML upload error:', uploadError);
            throw new Error('Failed to store context');
        }

        // Create project record
        const { error: dbError } = await supabase.from('projects').insert({
            id: projectId,
            name: `Snippet (${language})`,
            git_url: null,
            status: 'completed',
            context_path: xmlFileName,
            metadata: {
                type: 'snippet',
                language,
                lines: code.split('\n').length
            }
        });

        if (dbError) {
            console.error('DB error:', dbError);
            throw new Error('Failed to create project record');
        }

        console.log(`✅ Snippet ${projectId} analyzed and ready for chat`);

        res.json({
            success: true,
            projectId,
            message: 'Context generated. Redirecting to chat...'
        });

    } catch (error) {
        console.error('Snippet analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            details: error.message
        });
    }
});

module.exports = router;
