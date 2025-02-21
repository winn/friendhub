/*
  # Remove Content Column from Messages Table

  1. Changes
    - Drop existing messages table
    - Recreate without content column
    - Set up proper indexes and constraints
    
  2. Security
    - Enable RLS
    - Add policies for user access
    - Add policies for agent owner access
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table without content column
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  handler_type text NOT NULL DEFAULT 'ai' CHECK (handler_type IN ('ai', 'human')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_handler_type_is_read ON messages(handler_type, is_read);

-- Create RLS policies
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
COMMENT ON TABLE messages IS 'Stores message metadata between users and agents';
COMMENT ON COLUMN messages.conversation_id IS 'Reference to the conversation this message belongs to';
COMMENT ON COLUMN messages.user_id IS 'The user who sent or received the message';
COMMENT ON COLUMN messages.role IS 'Whether the message is from the user or assistant';
COMMENT ON COLUMN messages.handler_type IS 'Whether the message was handled by AI or human agent';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read';
COMMENT ON COLUMN messages.created_at IS 'When the message was created';