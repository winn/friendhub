/*
  # Fix Database Schema and Relationships

  1. Changes
    - Drop and recreate tables in correct order
    - Set up proper foreign key relationships
    - Add default data
    - Add proper indexes
    
  2. Security
    - Enable RLS
    - Add appropriate policies
*/

-- First drop tables in correct order
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS channel_configs CASCADE;
DROP TABLE IF EXISTS agent_ratings CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  name text,
  registered_date timestamptz DEFAULT now(),
  last_active_date timestamptz DEFAULT now(),
  message_count integer DEFAULT 0,
  remaining_points integer DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agents table
CREATE TABLE agents (
  agent_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  personality text NOT NULL,
  instructions text NOT NULL,
  prohibition text,
  agent_profile_image text,
  agent_main_category text,
  agent_sub_category text,
  llm_engine text DEFAULT 'anthropic.claude-v2',
  number_of_message_called integer DEFAULT 0,
  number_of_users integer DEFAULT 0,
  average_rating decimal(3,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  agent_id uuid REFERENCES agents(agent_id) NOT NULL,
  channel text DEFAULT 'web',
  chat_mode text DEFAULT 'ai',
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) NOT NULL,
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  handler_type text DEFAULT 'ai' CHECK (handler_type IN ('ai', 'human')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create agent_ratings table
CREATE TABLE agent_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  agent_id uuid REFERENCES agents(agent_id) NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Create channel_configs table
CREATE TABLE channel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(agent_id) ON DELETE CASCADE,
  channel_type text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, channel_type)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agents_categories ON agents(agent_main_category, agent_sub_category);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_activity ON conversations(last_activity DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_agent_ratings_user ON agent_ratings(user_id);
CREATE INDEX idx_agent_ratings_agent ON agent_ratings(agent_id);
CREATE INDEX idx_channel_configs_agent ON channel_configs(agent_id);

-- Create RLS policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for authentication" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read public agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Users can create agents" ON agents FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own agents" ON agents FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read messages in their conversations" ON messages 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND c.user_id = auth.uid()
  ));
CREATE POLICY "Users can create messages" ON messages FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read ratings" ON agent_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON agent_ratings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own ratings" ON agent_ratings FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can manage their agents channels" ON channel_configs
  USING (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.agent_id = channel_configs.agent_id
    AND agents.owner_id = auth.uid()
  ));

-- Insert default system user
INSERT INTO users (id, email, name, remaining_points)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@example.com',
  'System',
  999999
) ON CONFLICT (id) DO NOTHING;

-- Insert default agent
INSERT INTO agents (
  agent_id,
  owner_id,
  name,
  personality,
  instructions,
  prohibition,
  agent_profile_image,
  agent_main_category,
  agent_sub_category
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'Claude',
  'I am Claude, a friendly and helpful AI assistant.',
  'Be helpful, clear, and concise.',
  'Avoid harmful or inappropriate content.',
  'https://images.unsplash.com/photo-1675252271887-339c521bf7f1?q=80&w=500&auto=format&fit=crop',
  'Friend',
  'General Assistant'
) ON CONFLICT (agent_id) DO NOTHING;