/*
  # Add new columns to agents table

  1. New Columns
    - `agent_profile_image` (text) - URL for agent's profile image
    - `agent_main_category` (text) - Main category of the agent (e.g., Friend, Entertainment)
    - `agent_sub_category` (text) - Sub-category of the agent (e.g., Casual Friend, Gaming Buddy)
    - `average_rating` (decimal) - Average rating from user reviews
    - `number_of_message_called` (integer) - Total number of messages processed
    - `number_of_users` (integer) - Total number of unique users who chatted
    - `is_verified` (boolean) - Whether the agent is verified
    - `status` (text) - Agent's status (active, inactive, suspended)
    - `visibility` (text) - Agent's visibility (public, private, unlisted)
    - `max_context_length` (integer) - Maximum context length for conversations
    - `response_format` (text) - Preferred response format (markdown, plain, html)
    - `language` (text) - Primary language of the agent
    - `tags` (text[]) - Array of tags for categorization and search
    - `metadata` (jsonb) - Additional metadata for future extensibility

  2. Indexes
    - Added indexes for commonly queried columns
    - Added GIN index for tags array and metadata JSONB

  3. Constraints
    - Added check constraints for status and visibility
    - Added default values for new columns
*/

-- Add new columns with appropriate defaults and constraints
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS agent_profile_image text,
  ADD COLUMN IF NOT EXISTS agent_main_category text,
  ADD COLUMN IF NOT EXISTS agent_sub_category text,
  ADD COLUMN IF NOT EXISTS average_rating decimal(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5.00),
  ADD COLUMN IF NOT EXISTS number_of_message_called integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS number_of_users integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  ADD COLUMN IF NOT EXISTS max_context_length integer DEFAULT 4000 CHECK (max_context_length > 0),
  ADD COLUMN IF NOT EXISTS response_format text DEFAULT 'markdown' CHECK (response_format IN ('markdown', 'plain', 'html')),
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_main_category ON agents(agent_main_category);
CREATE INDEX IF NOT EXISTS idx_agents_sub_category ON agents(agent_sub_category);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_visibility ON agents(visibility);
CREATE INDEX IF NOT EXISTS idx_agents_language ON agents(language);
CREATE INDEX IF NOT EXISTS idx_agents_tags ON agents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_agents_metadata ON agents USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_agents_rating ON agents(average_rating);

-- Add comment to table
COMMENT ON TABLE agents IS 'AI agents with enhanced metadata and configuration options';

-- Add comments to columns
COMMENT ON COLUMN agents.agent_profile_image IS 'URL to agent''s profile image';
COMMENT ON COLUMN agents.agent_main_category IS 'Primary category of the agent';
COMMENT ON COLUMN agents.agent_sub_category IS 'Secondary category for more specific classification';
COMMENT ON COLUMN agents.average_rating IS 'Average user rating (0-5)';
COMMENT ON COLUMN agents.number_of_message_called IS 'Total number of messages processed';
COMMENT ON COLUMN agents.number_of_users IS 'Number of unique users who interacted';
COMMENT ON COLUMN agents.is_verified IS 'Whether the agent is verified by administrators';
COMMENT ON COLUMN agents.status IS 'Current status of the agent';
COMMENT ON COLUMN agents.visibility IS 'Visibility setting for the agent';
COMMENT ON COLUMN agents.max_context_length IS 'Maximum context length for conversations';
COMMENT ON COLUMN agents.response_format IS 'Preferred format for agent responses';
COMMENT ON COLUMN agents.language IS 'Primary language of the agent';
COMMENT ON COLUMN agents.tags IS 'Array of searchable tags';
COMMENT ON COLUMN agents.metadata IS 'Additional configurable metadata';