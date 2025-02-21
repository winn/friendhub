/*
  # Fix users table schema

  1. Changes
    - Drop and recreate users table with proper schema
    - Re-enable RLS and policies
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Drop and recreate the users table
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table
CREATE TABLE users (
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);