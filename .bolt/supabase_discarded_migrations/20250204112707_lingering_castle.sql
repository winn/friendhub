/*
  # Fix users schema and policies order

  1. Changes
    - Ensure users table exists with correct schema
    - Recreate policies in correct order
    - Add missing indexes
*/

-- First check if table exists, if not create it
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

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate policies (will be ignored if they already exist)
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  
  -- Create policies in correct order
  CREATE POLICY "Enable insert for authentication" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);
END $$;

-- Add missing indexes if they don't exist
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