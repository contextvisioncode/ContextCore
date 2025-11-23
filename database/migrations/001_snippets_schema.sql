-- Migration: Snippet Mode Complete Schema
-- Created: 2025-11-23
-- Description: Complete database schema for professional snippet management

-- =====================================================
-- MAIN SNIPPETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'javascript',
  tags TEXT[] DEFAULT '{}',
  
  -- Visibility & Templates
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  parent_snippet_id UUID REFERENCES public.snippets(id) ON DELETE SET NULL,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  execution_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  
  -- Quality Metrics
  quality_score DECIMAL(3,2), -- 0.00 to 10.00
  complexity_score INTEGER, -- McCabe complexity
  lines_of_code INTEGER,
  
  -- Analysis Results (JSONB for flexibility)
  security_issues JSONB DEFAULT '[]'::jsonb,
  performance_analysis JSONB DEFAULT '{}'::jsonb,
  lint_results JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_analyzed_at TIMESTAMPTZ,
  last_executed_at TIMESTAMPTZ
);

-- =====================================================
-- SNIPPET VERSIONS (History/Rollback)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  code TEXT NOT NULL,
  changes_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(snippet_id, version_number)
);

-- =====================================================
-- SHAREABLE LINKS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  share_token VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Optional password protection
  expires_at TIMESTAMPTZ,
  can_edit BOOLEAN DEFAULT false,
  can_fork BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CODE EXECUTION HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  output TEXT,
  error TEXT,
  execution_time_ms INTEGER,
  memory_used_kb INTEGER,
  status VARCHAR(20) CHECK (status IN ('success', 'error', 'timeout', 'killed')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- COMMENTS & COLLABORATION
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES public.snippet_comments(id) ON DELETE CASCADE,
  line_number INTEGER, -- NULL for general comments
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- FAVORITES/BOOKMARKS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, snippet_id)
);

-- =====================================================
-- TEMPLATES LIBRARY
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'frontend', 'backend', 'algorithm', etc.
  subcategory VARCHAR(100),
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_official BOOLEAN DEFAULT false, -- Official ContextCode templates
  featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- COLLABORATION SESSIONS (Real-time editing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  session_token VARCHAR(100) UNIQUE NOT NULL,
  active_users JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON public.snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON public.snippets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON public.snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_public ON public.snippets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_snippets_templates ON public.snippets(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON public.snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_quality ON public.snippets(quality_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_snippet_versions_snippet ON public.snippet_versions(snippet_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_snippet_shares_token ON public.snippet_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_snippet_shares_expires ON public.snippet_shares(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_snippet_comments_snippet ON public.snippet_comments(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_comments_line ON public.snippet_comments(snippet_id, line_number) WHERE line_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_snippet_favorites_user ON public.snippet_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_templates_category ON public.snippet_templates(category, subcategory);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Snippets RLS
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own snippets or public" ON public.snippets
  FOR SELECT USING (
    auth.uid() = user_id OR is_public = true
  );

CREATE POLICY "Users insert own snippets" ON public.snippets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own snippets" ON public.snippets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own snippets" ON public.snippets
  FOR DELETE USING (auth.uid() = user_id);

-- Snippet Versions RLS
ALTER TABLE public.snippet_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view versions of accessible snippets" ON public.snippet_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.snippets
      WHERE snippets.id = snippet_versions.snippet_id
      AND (snippets.user_id = auth.uid() OR snippets.is_public = true)
    )
  );

CREATE POLICY "Users insert versions of own snippets" ON public.snippet_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.snippets
      WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = auth.uid()
    )
  );

-- Snippet Shares RLS
ALTER TABLE public.snippet_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shares" ON public.snippet_shares
  FOR SELECT USING (true);

CREATE POLICY "Users create shares for own snippets" ON public.snippet_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.snippets
      WHERE snippets.id = snippet_shares.snippet_id
      AND snippets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own shares" ON public.snippet_shares
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users delete own shares" ON public.snippet_shares
  FOR DELETE USING (created_by = auth.uid());

-- Snippet Executions RLS
ALTER TABLE public.snippet_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own executions" ON public.snippet_executions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users insert own executions" ON public.snippet_executions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Snippet Comments RLS
ALTER TABLE public.snippet_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view comments on accessible snippets" ON public.snippet_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.snippets
      WHERE snippets.id = snippet_comments.snippet_id
      AND (snippets.user_id = auth.uid() OR snippets.is_public = true)
    )
  );

CREATE POLICY "Users insert comments on accessible snippets" ON public.snippet_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.snippets
      WHERE snippets.id = snippet_comments.snippet_id
      AND (snippets.user_id = auth.uid() OR snippets.is_public = true)
    )
  );

CREATE POLICY "Users update own comments" ON public.snippet_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users delete own comments" ON public.snippet_comments
  FOR DELETE USING (user_id = auth.uid());

-- Snippet Favorites RLS
ALTER TABLE public.snippet_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites" ON public.snippet_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users insert own favorites" ON public.snippet_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own favorites" ON public.snippet_favorites
  FOR DELETE USING (user_id = auth.uid());

-- Snippet Templates RLS (Read-only for most users)
ALTER TABLE public.snippet_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates" ON public.snippet_templates
  FOR SELECT USING (true);

-- Snippet Sessions RLS
ALTER TABLE public.snippet_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view sessions for accessible snippets" ON public.snippet_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.snippets
      WHERE snippets.id = snippet_sessions.snippet_id
      AND (snippets.user_id = auth.uid() OR snippets.is_public = true)
    )
  );

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_snippet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snippets_updated_at
  BEFORE UPDATE ON public.snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_snippet_timestamp();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.snippet_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_snippet_timestamp();

-- Auto-increment version number
CREATE OR REPLACE FUNCTION auto_increment_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version_number IS NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
    FROM public.snippet_versions
    WHERE snippet_id = NEW.snippet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snippet_version_auto_increment
  BEFORE INSERT ON public.snippet_versions
  FOR EACH ROW
  EXECUTE FUNCTION auto_increment_version();

-- Update favorite count on snippets
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.snippets
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.snippet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.snippets
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE id = OLD.snippet_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_snippet_favorite_count
  AFTER INSERT OR DELETE ON public.snippet_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_count();

-- =====================================================
-- SEED INITIAL DATA (Optional)
-- =====================================================

-- Insert a few example templates (run this manually if needed)
-- These would be official ContextCode templates

COMMENT ON TABLE public.snippets IS 'Main table storing code snippets with metadata and analysis results';
COMMENT ON TABLE public.snippet_versions IS 'Version history for snippets enabling rollback functionality';
COMMENT ON TABLE public.snippet_shares IS 'Shareable links for snippets with optional password protection';
COMMENT ON TABLE public.snippet_executions IS 'History of code executions with results and performance metrics';
COMMENT ON TABLE public.snippet_comments IS 'Comments and discussions on snippets, including line-specific feedback';
COMMENT ON TABLE public.snippet_favorites IS 'User bookmarks/favorites for quick access to snippets';
COMMENT ON TABLE public.snippet_templates IS 'Template library categories and metadata';
COMMENT ON TABLE public.snippet_sessions IS 'Active collaboration sessions for real-time editing';

-- Migration complete! 🚀
