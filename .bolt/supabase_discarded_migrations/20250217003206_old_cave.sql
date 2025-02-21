/*
  # Fix messages and conversations schema

  1. Changes
    - Ensure messages table has all required columns with proper constraints
    - Add missing indexes for performance
    - Set default values for existing records

  2. Columns Added/Modified
    - conversation_id (NOT NULL constraint)
    - content (NOT NULL constraint)
    - role (NOT NULL constraint)
    - handler_type (with check constraint)
    - is_read (with default value)

  3. Indexes
    - conversation_id for faster lookups
    - handler_type and is_read for filtering
*/

-- First ensure messages table has all required columns
ALTER TABLE messages
  ALTER COLUMN conversation_id SET NOT NULL,
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN handler_type SET DEFAULT 'ai',
  ALTER COLUMN is_read SET DEFAULT false;

-- Add check constraint for handler_type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_handler_type_check'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_handler_type_check 
      CHECK (handler_type IN ('ai', 'human'));
  END IF;
END $$;

-- Add indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'messages' AND indexname = 'idx_messages_conversation'
  ) THEN
    CREATE INDEX idx_messages_conversation ON messages(conversation_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'messages' AND indexname = 'idx_messages_handler_type_is_read'
  ) THEN
    CREATE INDEX idx_messages_handler_type_is_read ON messages(handler_type, is_read);
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN messages.conversation_id IS 'Reference to the conversation this message belongs to';
COMMENT ON COLUMN messages.content IS 'The actual message content';
COMMENT ON COLUMN messages.role IS 'Whether the message is from the user or assistant';
COMMENT ON COLUMN messages.handler_type IS 'Whether the message was handled by AI or human agent';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read';