-- TRAVA Travel App Database Setup
-- Run this script in your Supabase SQL Editor

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Create trips table (parent table for organizing notes)
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'important', 'todo', 'reminder')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_trip_id ON notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on both tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE SECURITY POLICIES
-- =============================================

-- Trips table policies
-- Users can view their own trips
CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own trips
CREATE POLICY "Users can insert their own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips
CREATE POLICY "Users can update their own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own trips" ON trips
CREATE POLICY "Users can delete their own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- Notes table policies
-- Users can view notes from their own trips
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert notes to their own trips
CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own notes
CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update timestamps
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. INSERT SAMPLE DATA (FOR TESTING)
-- =============================================

-- Note: This will only work if you have a user authenticated
-- You can uncomment and modify this after you've logged in through your app

/*
-- Create a sample trip (replace 'your-user-id' with actual user ID)
INSERT INTO trips (user_id, name, destination, start_date, end_date) 
VALUES (
  auth.uid(), 
  'Tokyo Adventure', 
  'Tokyo, Japan', 
  '2025-08-01', 
  '2025-08-10'
);

-- Create sample notes (this will use the trip created above)
INSERT INTO notes (trip_id, user_id, title, content, category) 
VALUES 
  (
    (SELECT id FROM trips WHERE name = 'Tokyo Adventure' LIMIT 1),
    auth.uid(),
    'Things to Pack',
    'Don''t forget passport, camera, and comfortable walking shoes!',
    'important'
  ),
  (
    (SELECT id FROM trips WHERE name = 'Tokyo Adventure' LIMIT 1),
    auth.uid(),
    'Restaurant Recommendations',
    'Try the ramen at Ippudo and sushi at Tsukiji Market',
    'general'
  );
*/

-- =============================================
-- 7. VERIFICATION QUERIES
-- =============================================

-- Run these to verify everything was created correctly:

-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trips', 'notes');

-- Check if indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('trips', 'notes') 
AND schemaname = 'public';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('trips', 'notes') 
AND schemaname = 'public';

-- =============================================
-- SETUP COMPLETE!
-- =============================================

-- =============================================
-- ENHANCEMENT: ADD SMART FORM FIELDS
-- =============================================

-- Add additional columns for smart form integration
ALTER TABLE trips ADD COLUMN IF NOT EXISTS companions TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS activities TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed'));

-- Update existing trips to have default status
UPDATE trips SET status = 'planning' WHERE status IS NULL;
