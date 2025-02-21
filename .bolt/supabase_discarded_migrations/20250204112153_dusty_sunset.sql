-- Enable inserting new users during signup
CREATE POLICY "Enable insert for authentication" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);