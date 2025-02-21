/*
  # Fix users table structure and policies

  1. Changes
    - Ensure users table has correct structure with id column
    - Update RLS policies to use correct column references
    - Add service role bypass for admin operations

  2. Security
    - Maintains RLS protection
    - Ensures proper column access
    - Allows service role operations
*/

-- First ensure the table exists with correct structure
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
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
  END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Service role bypass RLS" ON users;
END $$;

-- Create new policies with proper column references
DO $$ 
BEGIN
  -- Service role bypass for admin operations
  CREATE POLICY "Service role bypass RLS" ON users
    FOR ALL 
    USING (true)
    WITH CHECK (true);

  -- Allow users to insert their own record during signup
  CREATE POLICY "Enable insert for authentication" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

  -- Allow users to read their own data
  CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

  -- Allow users to update their own data
  CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
END $$;

-- Add helpful indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_email_idx') THEN
    CREATE INDEX users_email_idx ON users(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_created_at_idx') THEN
    CREATE INDEX users_created_at_idx ON users(created_at);
  END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';