/*
  # Add Default Agent and Fix Constraints

  1. Changes
    - Add default agent for testing
    - Ensure proper foreign key relationships
    - Add indexes for performance
    
  2. Security
    - Maintain RLS policies
    - Add default user for the default agent
*/

-- First ensure we have a default user
INSERT INTO users (id, email, name, remaining_points)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@example.com',
  'System',
  999999
) ON CONFLICT (id) DO NOTHING;

-- Then create a default agent
INSERT INTO agents (
  agent_id,
  owner_id,
  name,
  personality,
  instructions,
  prohibition,
  agent_profile_image,
  agent_main_category,
  agent_sub_category,
  llm_engine
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'Claude',
  'I am Claude, a friendly and helpful AI assistant.',
  'Be helpful, clear, and concise.',
  'Avoid harmful or inappropriate content.',
  'https://images.unsplash.com/photo-1675252271887-339c521bf7f1?q=80&w=500&auto=format&fit=crop',
  'Friend',
  'General Assistant',
  'anthropic.claude-v2'
) ON CONFLICT (agent_id) DO UPDATE SET
  name = EXCLUDED.name,
  personality = EXCLUDED.personality,
  instructions = EXCLUDED.instructions,
  prohibition = EXCLUDED.prohibition;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_categories 
  ON agents(agent_main_category, agent_sub_category);

CREATE INDEX IF NOT EXISTS idx_conversations_last_activity 
  ON conversations(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_messages_role 
  ON messages(role);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';