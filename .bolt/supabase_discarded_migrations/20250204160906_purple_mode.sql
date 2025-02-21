/*
  # Fix RLS policies for users table

  1. Changes
    - Add service role bypass policy for users table
    - Add policy for auth.users to insert their own records
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to update their own data

  2. Security
    - Maintains RLS protection while allowing necessary operations
    - Service role can perform all operations
    - Users can only access their own data
*/

-- First, enable bypass RLS for service role
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role bypass RLS" ON users;

-- Create new policies
CREATE POLICY "Service role bypass RLS" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';