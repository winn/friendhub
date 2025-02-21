/*
  # Add channel column to conversations table

  1. Changes
    - Add `channel` column to conversations table to track message source platform
    - Add check constraint to ensure valid channel values
    - Add index for performance

  2. Valid Channels
    - web (default)
    - line
    - telegram (future)
    - discord (future)
    - slack (future)
*/

-- Add channel column with default value
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'web'
  CHECK (channel IN ('web', 'line', 'telegram', 'discord', 'slack'));

-- Create index for channel column
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);

-- Add comment
COMMENT ON COLUMN conversations.channel IS 'Platform where the conversation takes place (web, line, etc)';