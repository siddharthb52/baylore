-- Create landmarks_proposed table for agent-discovered landmarks
-- Same schema as landmarks table, plus additional fields for agent workflow

CREATE TABLE IF NOT EXISTS landmarks_proposed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core landmark fields (same as landmarks table)
  title TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  year_built INTEGER,
  architect TEXT,
  historical_significance TEXT,
  fun_facts TEXT[], -- Array of strings
  image_url TEXT,
  website_url TEXT,
  
  -- Agent workflow fields
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  source_urls JSONB DEFAULT '[]'::jsonb, -- Array of source URLs used by agent
  verification_notes TEXT, -- Why rejected or what needs fixing
  fetch_metadata JSONB, -- Agent's reasoning, confidence scores, tool outputs
  
  -- Timestamps
  proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_landmarks_proposed_status ON landmarks_proposed(status);
CREATE INDEX idx_landmarks_proposed_category ON landmarks_proposed(category);
CREATE INDEX idx_landmarks_proposed_proposed_at ON landmarks_proposed(proposed_at DESC);
CREATE INDEX idx_landmarks_proposed_coordinates ON landmarks_proposed(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE landmarks_proposed ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to verified landmarks only
CREATE POLICY "Public can read verified landmarks"
  ON landmarks_proposed
  FOR SELECT
  USING (status = 'verified');

-- Policy: Service role can do everything (for Edge Functions)
CREATE POLICY "Service role has full access"
  ON landmarks_proposed
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landmarks_proposed_updated_at
  BEFORE UPDATE ON landmarks_proposed
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment explaining the table
COMMENT ON TABLE landmarks_proposed IS 'Agent-discovered landmarks awaiting review before promotion to main landmarks table';
