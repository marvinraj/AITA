-- Create saved_folders table for organizing saved places
CREATE TABLE IF NOT EXISTS saved_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_folders_user_id ON saved_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_folders_is_default ON saved_folders(is_default);

-- Create unique constraint to prevent duplicate folder names per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_folders_user_name 
ON saved_folders(user_id, name);

-- Enable RLS (Row Level Security)
ALTER TABLE saved_folders ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own folders" ON saved_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON saved_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON saved_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON saved_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Add folder_id to saved_places table
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES saved_folders(id) ON DELETE SET NULL;

-- Create index for folder_id
CREATE INDEX IF NOT EXISTS idx_saved_places_folder_id ON saved_places(folder_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_folders_updated_at
  BEFORE UPDATE ON saved_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_folders_updated_at();
