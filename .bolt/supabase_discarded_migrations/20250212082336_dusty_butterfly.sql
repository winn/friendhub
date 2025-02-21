/*
  # Create channel table

  1. New Tables
    - `channels`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `type` (text, not null) - e.g., 'line', 'telegram', etc.
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to read channels
*/

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('line', 'telegram', 'discord', 'slack', 'web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read channels"
  ON channels
  FOR SELECT
  TO authenticated
  USING (true);

-- Add helpful indexes
CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_channels_created_at ON channels(created_at);

-- Add comments
COMMENT ON TABLE channels IS 'Available messaging channels for agents';
COMMENT ON COLUMN channels.name IS 'Display name of the channel';
COMMENT ON COLUMN channels.description IS 'Description of the channel and its capabilities';
COMMENT ON COLUMN channels.type IS 'Type of messaging channel (line, telegram, etc)';