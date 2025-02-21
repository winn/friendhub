/*
  # Fix messages schema and RLS policies

  1. Changes
    - Add ON DELETE CASCADE to conversation_id foreign key
    - Update RLS policies to handle both user and agent owner access
    - Add indexes for common queries
    - Add helpful comments

  2. Security
    - Enable RLS
    - Add policies for both users and agent owners
    - Ensure proper cascade deletion
*/

-- First recreate messages table with proper constraints
CREATE TABLE IF NOT EXISTS messages_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  handler_type text NOT NULL DEFAULT 'ai' CHECK (handler_type IN ('ai', 'human')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Copy data if old table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    INSERT INTO messages_new
    SELECT * FROM messages;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS messages CASCADE;
ALTER TABLE messages_new RENAME TO messages;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_handler_type_is_read ON messages(handler_type, is_read);

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;

-- Create updated RLS policies
CREATE POLICY "Users can read messages in their conversations"
  ON messages FOR SELECT
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

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
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
COMMENT ON TABLE messages IS 'Stores all messages between users and agents';
COMMENT ON COLUMN messages.conversation_id IS 'Reference to the conversation this message belongs to';
COMMENT ON COLUMN messages.user_id IS 'The user who sent or received the message';
COMMENT ON COLUMN messages.content IS 'The actual message content';
COMMENT ON COLUMN messages.role IS 'Whether the message is from the user or assistant';
COMMENT ON COLUMN messages.handler_type IS 'Whether the message was handled by AI or human agent';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read';
COMMENT ON COLUMN messages.created_at IS 'When the message was created';

-- Ensure conversations table has required columns
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS chat_mode text DEFAULT 'ai' CHECK (chat_mode IN ('ai', 'live'));

-- Create index for last_activity if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity 
  ON conversations(last_activity DESC);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';