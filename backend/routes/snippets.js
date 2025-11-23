/**
 * Snippet Routes
 * RESTful API endpoints for snippet management
 */

const express = require('express');
const router = express.Router();
const snippetService = require('../services/snippetService');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

/**
 * Middleware: Verify authentication
 */
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
}

/**
 * POST /api/snippets
 * Create a new snippet
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, description, code, language, tags, is_public, is_template } = req.body;

        // Validation
        if (!title || !code) {
            return res.status(400).json({ error: 'Title and code are required' });
        }

        if (code.length > 100000) {
            return res.status(400).json({ error: 'Code exceeds maximum length of 100,000 characters' });
        }

        const snippet = await snippetService.createSnippet(req.user.id, {
            title,
            description,
            code,
            language: language || 'javascript',
            tags: tags || [],
            is_public: is_public || false,
            is_template: is_template || false
        });

        res.status(201).json({ snippet });
    } catch (error) {
        console.error('Error creating snippet:', error);
        res.status(500).json({ error: 'Failed to create snippet', details: error.message });
    }
});

/**
 * GET /api/snippets
 * List user's snippets with filters
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page, limit, language, tags, search, sort_by, sort_order } = req.query;

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            language,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
            search,
            sort_by: sort_by || 'created_at',
            sort_order: sort_order || 'desc'
        };

        const result = await snippetService.listSnippets(req.user.id, filters);

        res.json(result);
    } catch (error) {
        console.error('Error listing snippets:', error);
        res.status(500).json({ error: 'Failed to list snippets', details: error.message });
    }
});

/**
 * GET /api/snippets/search
 * Search public snippets
 */
router.get('/search', async (req, res) => {
    try {
        const { q, page, limit, language, tags } = req.query;

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            language,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
        };

        const result = await snippetService.searchPublicSnippets(q, filters);

        res.json(result);
    } catch (error) {
        console.error('Error searching snippets:', error);
        res.status(500).json({ error: 'Failed to search snippets', details: error.message });
    }
});

/**
 * GET /api/snippets/favorites
 * Get user's favorite snippets
 */
router.get('/favorites', requireAuth, async (req, res) => {
    try {
        const favorites = await snippetService.getFavorites(req.user.id);
        res.json({ snippets: favorites });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Failed to fetch favorites', details: error.message });
    }
});

/**
 * GET /api/snippets/:id
 * Get snippet by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || null;

        const snippet = await snippetService.getSnippet(id, userId);

        if (!snippet) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        res.json({ snippet });
    } catch (error) {
        console.error('Error fetching snippet:', error);
        res.status(500).json({ error: 'Failed to fetch snippet', details: error.message });
    }
});

/**
 * PUT /api/snippets/:id
 * Update snippet
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, code, language, tags, is_public } = req.body;

        const snippet = await snippetService.updateSnippet(id, req.user.id, {
            title,
            description,
            code,
            language,
            tags,
            is_public
        });

        res.json({ snippet });
    } catch (error) {
        console.error('Error updating snippet:', error);
        res.status(500).json({ error: 'Failed to update snippet', details: error.message });
    }
});

/**
 * DELETE /api/snippets/:id
 * Delete snippet
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        await snippetService.deleteSnippet(id, req.user.id);

        res.json({ success: true, message: 'Snippet deleted successfully' });
    } catch (error) {
        console.error('Error deleting snippet:', error);
        res.status(500).json({ error: 'Failed to delete snippet', details: error.message });
    }
});

/**
 * POST /api/snippets/:id/fork
 * Fork snippet
 */
router.post('/:id/fork', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const forkedSnippet = await snippetService.forkSnippet(id, req.user.id);

        res.status(201).json({ snippet: forkedSnippet });
    } catch (error) {
        console.error('Error forking snippet:', error);
        res.status(500).json({ error: 'Failed to fork snippet', details: error.message });
    }
});

/**
 * POST /api/snippets/:id/favorite
 * Toggle favorite status
 */
router.post('/:id/favorite', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await snippetService.toggleFavorite(id, req.user.id);

        res.json(result);
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite', details: error.message });
    }
});

/**
 * GET /api/snippets/:id/versions
 * Get version history
 */
router.get('/:id/versions', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const versions = await snippetService.getVersionHistory(id, req.user.id);

        res.json({ versions });
    } catch (error) {
        console.error('Error fetching versions:', error);
        res.status(500).json({ error: 'Failed to fetch versions', details: error.message });
    }
});

module.exports = router;
