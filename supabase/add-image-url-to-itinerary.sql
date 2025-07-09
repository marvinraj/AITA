-- Add image_url column to itinerary_items table (if not exists)
ALTER TABLE itinerary_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add photos array column to itinerary_items table (if not exists)
ALTER TABLE itinerary_items 
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN itinerary_items.image_url IS 'Primary image URL for the place/activity from Google Places API';
COMMENT ON COLUMN itinerary_items.photos IS 'Array of additional photo URLs for gallery view';
