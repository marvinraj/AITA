-- Run this in your Supabase SQL Editor to add smart form fields
-- Only run this if you haven't already added these columns

-- Add additional columns for smart form integration
ALTER TABLE trips ADD COLUMN IF NOT EXISTS companions TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS activities TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed'));

-- Update existing trips to have default status
UPDATE trips SET status = 'planning' WHERE status IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND table_schema = 'public'
ORDER BY ordinal_position;
