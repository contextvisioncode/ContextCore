-- Create snippets table for storing analyzed code snippets
CREATE TABLE IF NOT EXISTS public.snippets (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    language TEXT,
    analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    views INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON public.snippets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- Allow public read access (snippets are meant to be shareable)
CREATE POLICY "Snippets are publicly readable"
    ON public.snippets
    FOR SELECT
    USING (true);

-- Allow anyone to insert snippets (no auth required for snippet analysis)
CREATE POLICY "Anyone can create snippets"
    ON public.snippets
    FOR INSERT
    WITH CHECK (true);

-- Optional: Auto-delete old snippets after 30 days (to save storage)
-- You can run this as a scheduled job or manually
-- DELETE FROM public.snippets WHERE created_at < NOW() - INTERVAL '30 days';
