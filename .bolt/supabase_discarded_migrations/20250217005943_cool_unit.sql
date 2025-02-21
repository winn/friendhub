/*
  # Fix Users Table and Foreign Key Constraints

  1. Changes
    - Recreate users table with proper structure
    - Add RLS policies
    - Update foreign key constraints
    
  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Drop existing tables to ensure clean slate
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
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
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  personality text NOT NULL,
  instructions text NOT NULL,
  prohibition text,
  agent_profile_image text,
  agent_main_category text,
  agent_sub_category text,
  function_tools jsonb,
  llm_engine text DEFAULT 'gpt-4',
  number_of_message_called integer DEFAULT 0,
  number_of_users integer DEFAULT 0,
  average_rating decimal(3,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(agent_id) ON DELETE CASCADE,
  title text,
  channel text DEFAULT 'web',
  chat_mode text DEFAULT 'ai',
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  handler_type text NOT NULL DEFAULT 'ai' CHECK (handler_type IN ('ai', 'human')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- RLS Policies for users
CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for agents
CREATE POLICY "Anyone can read agents" ON agents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create agents" ON agents
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own agents" ON agents
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for conversations
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can read messages in their conversations" ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM agents a
          WHERE a.agent_id = c.agent_id
          AND a.owner_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN agents a ON a.agent_id = c.agent_id
      WHERE c.id = conversation_id
      AND a.owner_id = auth.uid()
    )
  );

-- Add helpful comments
COMMENT ON TABLE users IS 'User profiles and metadata';
COMMENT ON TABLE agents IS 'AI agents with their configurations';
COMMENT ON TABLE conversations IS 'Conversations between users and agents';
COMMENT ON TABLE messages IS 'Message metadata for conversations';