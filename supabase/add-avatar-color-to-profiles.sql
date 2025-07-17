-- Add avatar_color column to profiles table for color-based avatars
-- This allows users to have colored avatars instead of image uploads

-- Add the avatar_color column to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7) DEFAULT '#10B981';

-- Add a comment for documentation
COMMENT ON COLUMN profiles.avatar_color IS 'Hex color code for user avatar background (e.g. #10B981)';

-- Add a check constraint to ensure valid hex color format
ALTER TABLE profiles 
ADD CONSTRAINT profiles_avatar_color_format 
CHECK (avatar_color ~ '^#[0-9A-Fa-f]{6}$');

-- Verify the column was added successfully
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'avatar_color';
