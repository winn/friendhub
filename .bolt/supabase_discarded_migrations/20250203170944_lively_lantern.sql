/*
  # Initial Schema for LLM Agents Marketplace

  1. New Tables
    - `users`
      - Extended profile for Supabase Auth users
      - Tracks points, message counts, and activity dates
    - `agents`
      - Stores AI agent configurations
      - Includes metadata and usage statistics
    - `conversations`
      - Tracks chat sessions between users and agents
    - `messages`
      - Stores individual messages in conversations
    - `points_transactions`
      - Records all point-related transactions
    - `payments`
      - Tracks payment transactions
    - `long_term_memory`
      - Stores persistent memory for user-agent pairs

  2. Security
    - RLS policies for all tables
    - Secure access patterns for user data
    - Protected agent ownership
*/

-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  name text,
  registered_date timestamptz DEFAULT now(),
  last_active_date timestamptz DEFAULT now(),
  message_count integer DEFAULT 0,
  remaining_points integer DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  personality text NOT NULL,
  instructions text NOT NULL,
  prohibitions text,
  function_tools jsonb,
  llm_engine text DEFAULT 'gpt-4o-mini',
  message_count integer DEFAULT 0,
  user_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  agent_id uuid REFERENCES agents(id) NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now()
);

-- Points transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  amount decimal NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text NOT NULL,
  transaction_id text NOT NULL,
  points_added integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Long-term memory table
CREATE TABLE IF NOT EXISTS long_term_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  agent_id uuid REFERENCES agents(id) NOT NULL,
  memory_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Agents policies
CREATE POLICY "Anyone can read public agents"
  ON agents FOR SELECT
  TO authenticated
  USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "Users can create agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can read messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Points transactions policies
CREATE POLICY "Users can read own points transactions"
  ON points_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Long-term memory policies
CREATE POLICY "Users can read own memory"
  ON long_term_memory FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own memory"
  ON long_term_memory FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memory"
  ON long_term_memory FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_long_term_memory_user_agent ON long_term_memory(user_id, agent_id);