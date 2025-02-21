/*
  # Fix agent_id column name

  1. Changes
    - Rename agents table primary key from 'id' to 'agent_id'
    - Update foreign key references in related tables
  
  2. Tables Modified
    - agents
    - channel_configs
    - conversations
    - agent_ratings
    - long_term_memory
*/

-- First rename the primary key column in agents table
ALTER TABLE agents RENAME COLUMN id TO agent_id;

-- Update foreign key references in related tables
ALTER TABLE channel_configs 
  DROP CONSTRAINT IF EXISTS channel_configs_agent_id_fkey,
  ADD CONSTRAINT channel_configs_agent_id_fkey 
    FOREIGN KEY (agent_id) 
    REFERENCES agents(agent_id) 
    ON DELETE CASCADE;

ALTER TABLE conversations 
  DROP CONSTRAINT IF EXISTS conversations_agent_id_fkey,
  ADD CONSTRAINT conversations_agent_id_fkey 
    FOREIGN KEY (agent_id) 
    REFERENCES agents(agent_id);

ALTER TABLE agent_ratings 
  DROP CONSTRAINT IF EXISTS agent_ratings_agent_id_fkey,
  ADD CONSTRAINT agent_ratings_agent_id_fkey 
    FOREIGN KEY (agent_id) 
    REFERENCES agents(agent_id);

ALTER TABLE long_term_memory 
  DROP CONSTRAINT IF EXISTS long_term_memory_agent_id_fkey,
  ADD CONSTRAINT long_term_memory_agent_id_fkey 
    FOREIGN KEY (agent_id) 
    REFERENCES agents(agent_id);

-- Recreate indexes with new column name if needed
DROP INDEX IF EXISTS idx_agents_main_category;
DROP INDEX IF EXISTS idx_agents_sub_category;
DROP INDEX IF EXISTS idx_agents_status;
DROP INDEX IF EXISTS idx_agents_visibility;
DROP INDEX IF EXISTS idx_agents_language;
DROP INDEX IF EXISTS idx_agents_tags;
DROP INDEX IF EXISTS idx_agents_metadata;
DROP INDEX IF EXISTS idx_agents_rating;

CREATE INDEX idx_agents_main_category ON agents(agent_main_category);
CREATE INDEX idx_agents_sub_category ON agents(agent_sub_category);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_visibility ON agents(visibility);
CREATE INDEX idx_agents_language ON agents(language);
CREATE INDEX idx_agents_tags ON agents USING gin(tags);
CREATE INDEX idx_agents_metadata ON agents USING gin(metadata);
CREATE INDEX idx_agents_rating ON agents(average_rating);