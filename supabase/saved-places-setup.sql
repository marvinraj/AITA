-- Create saved_places table for storing user's favorite places
CREATE TABLE IF NOT EXISTS saved_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id VARCHAR NOT NULL, -- Google Places ID
  name VARCHAR NOT NULL,
  address TEXT NOT NULL,
  rating DECIMAL(2,1),
  type VARCHAR NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'other',
  description TEXT,
  image_url TEXT,
  photos TEXT[], -- Array of photo URLs
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  notes TEXT, -- User's personal notes
  tags TEXT[], -- User-defined tags
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_place_id ON saved_places(place_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_category ON saved_places(category);
CREATE INDEX IF NOT EXISTS idx_saved_places_saved_at ON saved_places(saved_at);

-- Create unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_places_user_place 
ON saved_places(user_id, place_id);

-- Enable RLS (Row Level Security)
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own saved places" ON saved_places
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved places" ON saved_places
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved places" ON saved_places
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved places" ON saved_places
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_places_updated_at
  BEFORE UPDATE ON saved_places
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_places_updated_at();
