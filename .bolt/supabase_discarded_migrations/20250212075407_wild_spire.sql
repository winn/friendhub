/*
  # Add channel configurations

  1. New Tables
    - `channel_configs`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, references agents)
      - `channel_type` (text) - e.g., 'line', 'telegram', etc.
      - `config` (jsonb) - Store channel-specific configuration
      - `webhook_url` (text) - Generated webhook URL
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for agent owners
*/

CREATE TABLE IF NOT EXISTS channel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  channel_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, channel_type)
);

-- Enable RLS
ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their agents' channel configs"
  ON channel_configs
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = channel_configs.agent_id
      AND agents.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = channel_configs.agent_id
      AND agents.owner_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_channel_configs_agent ON channel_configs(agent_id);
CREATE INDEX idx_channel_configs_type ON channel_configs(channel_type);