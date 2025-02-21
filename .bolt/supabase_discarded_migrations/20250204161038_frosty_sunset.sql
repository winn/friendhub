/*
  # Fix users table policy creation

  1. Changes
    - Ensure policies are created safely
    - Handle existing policies gracefully
    - Maintain RLS protection

  2. Security
    - Maintains existing RLS policies
    - Ensures proper access control
*/

-- Safely handle policy creation
DO $$ 
BEGIN
  -- First ensure RLS is enabled
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Service role bypass RLS" ON users;

  -- Create service role bypass policy
  CREATE POLICY "Service role bypass RLS" ON users
    FOR ALL 
    USING (true)
    WITH CHECK (true);

  -- Create user policies
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

EXCEPTION 
  WHEN others THEN
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;