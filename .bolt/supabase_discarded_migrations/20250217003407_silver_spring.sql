/*
  # Create messages and conversations schema

  1. Tables Created
    - messages
      - id (uuid, primary key)
      - conversation_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - content (text)
      - role (text)
      - handler_type (text)
      - is_read (boolean)
      - created_at (timestamptz)

  2. Indexes
    - conversation_id for faster lookups
    - handler_type and is_read for filtering
    - created_at for sorting

  3. Constraints
    - Foreign keys to conversations and users
    - Check constraints for role and handler_type
    - NOT NULL constraints for required fields
*/

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  handler_type text NOT NULL DEFAULT 'ai' CHECK (handler_type IN ('ai', 'human')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_handler_type_is_read ON messages(handler_type, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create RLS policies
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

-- Add helpful comments
COMMENT ON TABLE messages IS 'Stores all messages between users and agents';
COMMENT ON COLUMN messages.conversation_id IS 'Reference to the conversation this message belongs to';
COMMENT ON COLUMN messages.user_id IS 'The user who sent or received the message';
COMMENT ON COLUMN messages.content IS 'The actual message content';
COMMENT ON COLUMN messages.role IS 'Whether the message is from the user or assistant';
COMMENT ON COLUMN messages.handler_type IS 'Whether the message was handled by AI or human agent';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read';
COMMENT ON COLUMN messages.created_at IS 'When the message was created';

-- Update conversations table with last_activity
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS chat_mode text DEFAULT 'ai' CHECK (chat_mode IN ('ai', 'live'));

-- Create index for last_activity
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity 
  ON conversations(last_activity DESC);