/**
 * Snippet Service
 * Handles all business logic for snippet management
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

class SnippetService {
    /**
     * Create a new snippet
     */
    async createSnippet(userId, snippetData) {
        try {
            const { title, description, code, language, tags, is_public, is_template } = snippetData;

            // Calculate basic metrics
            const lines_of_code = code.split('\n').length;

            const { data, error } = await supabase.from('snippets')
                .insert({
                    user_id: userId,
                    title,
                    description,
                    code,
                    language: language || 'javascript',
                    tags: tags || [],
                    is_public: is_public || false,
                    is_template: is_template || false,
                    lines_of_code
                })
                .select()
                .single();

            if (error) throw error;

            // Create initial version
            await this.createVersion(data.id, code, 'Initial version', userId);

            return data;
        } catch (error) {
            console.error('Error creating snippet:', error);
            throw error;
        }
    }

    /**
     * Get snippet by ID
     */
    async getSnippet(snippetId, userId) {
        try {
            const { data, error } = await supabase
                .from('snippets')
                .select('*')
                .eq('id', snippetId)
                .or(`user_id.eq.${userId},is_public.eq.true`)
                .single();

            if (error) throw error;

            // Increment view count (async, don't wait)
            this.incrementViewCount(snippetId).catch(console.error);

            return data;
        } catch (error) {
            console.error('Error fetching snippet:', error);
            throw error;
        }
    }

    /**
     * List user's snippets with filters
     */
    async listSnippets(userId, filters = {}) {
        try {
            const { page = 1, limit = 20, language, tags, search, sort_by = 'created_at', sort_order = 'desc' } = filters;

            let query = supabase
                .from('snippets')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            // Apply filters
            if (language && language !== 'all') {
                query = query.eq('language', language);
            }

            if (tags && tags.length > 0) {
                query = query.contains('tags', tags);
            }

            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            // Sorting
            query = query.order(sort_by, { ascending: sort_order === 'asc' });

            // Pagination
            const start = (page - 1) * limit;
            query = query.range(start, start + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                snippets: data,
                total: count,
                page,
                limit,
                total_pages: Math.ceil(count / limit)
            };
        } catch (error) {
            console.error('Error listing snippets:', error);
            throw error;
        }
    }

    /**
     * Update snippet
     */
    async updateSnippet(snippetId, userId, updates) {
        try {
            const { title, description, code, language, tags, is_public } = updates;

            const { data, error } = await supabase
                .from('snippets')
                .update({
                    title,
                    description,
                    code,
                    language,
                    tags,
                    is_public,
                    updated_at: new Date().toISOString()
                })
                .eq('id', snippetId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;

            // Create new version if code changed
            if (code) {
                await this.createVersion(snippetId, code, 'Updated via API', userId);
            }

            return data;
        } catch (error) {
            console.error('Error updating snippet:', error);
            throw error;
        }
    }

    /**
     * Delete snippet
     */
    async deleteSnippet(snippetId, userId) {
        try {
            const { error } = await supabase
                .from('snippets')
                .delete()
                .eq('id', snippetId)
                .eq('user_id', userId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting snippet:', error);
            throw error;
        }
    }

    /**
     * Fork snippet (create a copy)
     */
    async forkSnippet(snippetId, userId) {
        try {
            // Get original snippet
            const original = await this.getSnippet(snippetId, userId);

            // Create forked copy
            const forkedData = {
                title: `${original.title} (Fork)`,
                description: original.description,
                code: original.code,
                language: original.language,
                tags: original.tags,
                is_public: false,
                parent_snippet_id: snippetId
            };

            const forked = await this.createSnippet(userId, forkedData);

            // Increment fork count on original
            await supabase
                .from('snippets')
                .update({ fork_count: original.fork_count + 1 })
                .eq('id', snippetId);

            return forked;
        } catch (error) {
            console.error('Error forking snippet:', error);
            throw error;
        }
    }

    /**
     * Search public snippets
     */
    async searchPublicSnippets(query, filters = {}) {
        try {
            const { page = 1, limit = 20, language, tags } = filters;

            let searchQuery = supabase
                .from('snippets')
                .select('*', { count: 'exact' })
                .eq('is_public', true);

            if (query) {
                searchQuery = searchQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
            }

            if (language && language !== 'all') {
                searchQuery = searchQuery.eq('language', language);
            }

            if (tags && tags.length > 0) {
                searchQuery = searchQuery.contains('tags', tags);
            }

            searchQuery = searchQuery.order('view_count', { ascending: false });

            const start = (page - 1) * limit;
            searchQuery = searchQuery.range(start, start + limit - 1);

            const { data, error, count } = await searchQuery;

            if (error) throw error;

            return {
                snippets: data,
                total: count,
                page,
                limit,
                total_pages: Math.ceil(count / limit)
            };
        } catch (error) {
            console.error('Error searching snippets:', error);
            throw error;
        }
    }

    /**
     * Create a version entry
     */
    async createVersion(snippetId, code, changesSummary, userId) {
        try {
            const { error } = await supabase
                .from('snippet_versions')
                .insert({
                    snippet_id: snippetId,
                    code,
                    changes_summary: changesSummary,
                    created_by: userId
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error creating version:', error);
            // Don't throw - versions are non-critical
        }
    }

    /**
     * Get version history
     */
    async getVersionHistory(snippetId, userId) {
        try {
            // Verify access
            await this.getSnippet(snippetId, userId);

            const { data, error } = await supabase
                .from('snippet_versions')
                .select('*')
                .eq('snippet_id', snippetId)
                .order('version_number', { ascending: false });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error fetching versions:', error);
            throw error;
        }
    }

    /**
     * Increment view count
     */
    async incrementViewCount(snippetId) {
        try {
            await supabase.rpc('increment_snippet_view', { snippet_id: snippetId });
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    }

    /**
     * Toggle favorite
     */
    async toggleFavorite(snippetId, userId) {
        try {
            // Check if already favorited
            const { data: existing } = await supabase
                .from('snippet_favorites')
                .select('*')
                .eq('user_id', userId)
                .eq('snippet_id', snippetId)
                .single();

            if (existing) {
                // Remove favorite
                await supabase
                    .from('snippet_favorites')
                    .delete()
                    .eq('user_id', userId)
                    .eq('snippet_id', snippetId);

                return { favorited: false };
            } else {
                // Add favorite
                await supabase
                    .from('snippet_favorites')
                    .insert({ user_id: userId, snippet_id: snippetId });

                return { favorited: true };
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    }

    /**
     * Get user's favorites
     */
    async getFavorites(userId) {
        try {
            const { data, error } = await supabase
                .from('snippet_favorites')
                .select('snippet_id, snippets(*)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(f => f.snippets);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            throw error;
        }
    }
}

module.exports = new SnippetService();
