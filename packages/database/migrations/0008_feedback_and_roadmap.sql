-- usemargin Feedback & Roadmap Schema
-- Migration: 0008_feedback_and_roadmap.sql
--
-- Implements:
-- - Feedback table (user-submitted feedback)
-- - Roadmap items table (public roadmap entries)
-- - Roadmap votes table (user votes on roadmap items)

-- =============================================================================
-- ROADMAP ITEMS TABLE (created first for FK reference)
-- =============================================================================

CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,

  -- Status & categorization
  status VARCHAR(30) NOT NULL DEFAULT 'under_consideration' CHECK (
    status IN ('under_consideration', 'planned', 'in_progress', 'completed')
  ),
  category VARCHAR(100),

  -- Voting (denormalized for performance)
  vote_count INTEGER NOT NULL DEFAULT 0 CHECK (vote_count >= 0),

  -- Display settings
  is_public BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Completion tracking
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- FEEDBACK TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feedback content
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'reviewed', 'accepted', 'rejected', 'converted')
  ),

  -- Link to converted roadmap item (if applicable)
  roadmap_item_id UUID REFERENCES roadmap_items(id) ON DELETE SET NULL,

  -- Optional contact email for follow-up
  user_email VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROADMAP VOTES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS roadmap_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, roadmap_item_id)  -- One vote per user per item
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user
  ON feedback(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_status
  ON feedback(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_type
  ON feedback(type);

-- Roadmap items indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status
  ON roadmap_items(status, sort_order);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_public
  ON roadmap_items(is_public, status)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_roadmap_items_votes
  ON roadmap_items(vote_count DESC)
  WHERE is_public = true;

-- Roadmap votes indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_user
  ON roadmap_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item
  ON roadmap_votes(roadmap_item_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_votes ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Updates/deletes are done via service role key (admin only)

-- Roadmap items policies (public read)
CREATE POLICY "Anyone can view public roadmap items"
  ON roadmap_items FOR SELECT
  USING (is_public = true);

-- Note: Inserts/updates/deletes are done via service role key (admin only)

-- Roadmap votes policies
CREATE POLICY "Users can view own votes"
  ON roadmap_votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own votes"
  ON roadmap_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON roadmap_votes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at for feedback
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for roadmap_items
DROP TRIGGER IF EXISTS update_roadmap_items_updated_at ON roadmap_items;
CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VOTE COUNT FUNCTIONS
-- =============================================================================

-- Function to increment vote count
CREATE OR REPLACE FUNCTION increment_roadmap_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE roadmap_items
  SET vote_count = vote_count + 1
  WHERE id = NEW.roadmap_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement vote count
CREATE OR REPLACE FUNCTION decrement_roadmap_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE roadmap_items
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = OLD.roadmap_item_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment vote count on insert
DROP TRIGGER IF EXISTS increment_vote_count ON roadmap_votes;
CREATE TRIGGER increment_vote_count
  AFTER INSERT ON roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION increment_roadmap_vote_count();

-- Trigger to auto-decrement vote count on delete
DROP TRIGGER IF EXISTS decrement_vote_count ON roadmap_votes;
CREATE TRIGGER decrement_vote_count
  AFTER DELETE ON roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION decrement_roadmap_vote_count();
