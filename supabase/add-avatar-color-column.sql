-- Add avatar_color column to profiles table
ALTER TABLE profiles 
ADD COLUMN avatar_color TEXT DEFAULT '#10B981';

-- Update existing profiles to have a default avatar color
UPDATE profiles 
SET avatar_color = '#10B981' 
WHERE avatar_color IS NULL;
