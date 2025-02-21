/*
  # Add Missing Columns to Messages and Conversations Tables

  1. Changes:
    - Add content column to messages table
    - Add is_read column to messages table
    - Add handler_type column to messages table
    - Add last_activity column to conversations table
    - Add chat_mode column to conversations table

  2. Indexes:
    - Add index for common queries on messages
    - Add index for last_activity on conversations
*/

-- Add missing columns to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS content text NOT NULL,
  ADD COLUMN IF NOT EXISTS handler_type text DEFAULT 'ai' CHECK (handler_type IN ('ai', 'human')),
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_messages_handler_type_is_read 
  ON messages(handler_type, is_read);

-- Add columns to conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS chat_mode text DEFAULT 'ai' CHECK (chat_mode IN ('ai', 'live'));

-- Create index for last_activity
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity 
  ON conversations(last_activity DESC);

-- Update existing conversations
UPDATE conversations 
SET last_activity = GREATEST(created_at, (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE messages.conversation_id = conversations.id
)) 
WHERE last_activity IS NULL;