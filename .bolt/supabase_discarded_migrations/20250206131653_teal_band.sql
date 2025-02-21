/*
  # Add Agent Ratings System

  1. New Tables
    - `agent_ratings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `agent_id` (uuid, references agents)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `agent_ratings` table
    - Add policies for authenticated users to:
      - Create their own ratings
      - Read all ratings
      - Update their own ratings
*/

-- Create agent ratings table
CREATE TABLE IF NOT EXISTS agent_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  agent_id uuid REFERENCES agents(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Enable RLS
ALTER TABLE agent_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own ratings"
  ON agent_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read ratings"
  ON agent_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own ratings"
  ON agent_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_agent_ratings_user ON agent_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_agent ON agent_ratings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_created ON agent_ratings(created_at);