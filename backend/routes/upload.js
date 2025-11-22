const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const unzipper = require('unzipper');
const { processRepository } = require('../workers/ingestion');

const router = express.Router();

// Configure multer for ZIP uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        await fs.ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only .zip files are allowed'));
        }
    }
});

// ZIP Upload endpoint
router.post('/zip', upload.single('file'), async (req, res) => {
    try {
        const { projectId } = req.body;
        const zipPath = req.file.path;
        const extractPath = path.join(process.cwd(), 'temp', projectId);

        // Ensure extract directory exists
        await fs.ensureDir(extractPath);

        // Extract ZIP
        await fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractPath }))
            .promise();

        // Clean up ZIP file
        await fs.remove(zipPath);

        // Analyze extracted project
        const zipBuffer = await fs.readFile(zipPath);
        await processRepository(projectId, null, zipBuffer);

        // Clean up extracted files after analysis
        await fs.remove(extractPath);

        res.json({ success: true, projectId, message: 'Processing started' });
    } catch (error) {
        console.error('ZIP upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Code Snippet endpoint
router.post('/snippet', async (req, res) => {
    try {
        const { projectId, code } = req.body;

        if (!code || code.length === 0) {
            return res.status(400).json({ error: 'Code snippet is required' });
        }

        // Create temporary file with the snippet
        const tempDir = path.join(process.cwd(), 'temp', projectId);
        await fs.ensureDir(tempDir);

        const snippetPath = path.join(tempDir, 'snippet.txt');
        await fs.writeFile(snippetPath, code);

        // Analyze the snippet (simplified analysis)
        await processRepository(projectId, null, null);

        // Clean up
        await fs.remove(tempDir);

        res.json({ success: true, projectId, message: 'Processing started' });
    } catch (error) {
        console.error('Snippet analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
