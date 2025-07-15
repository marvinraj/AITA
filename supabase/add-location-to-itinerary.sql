-- Add latitude and longitude columns to itinerary_items table for map functionality
ALTER TABLE itinerary_items 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

ALTER TABLE itinerary_items 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments for documentation
COMMENT ON COLUMN itinerary_items.latitude IS 'Latitude coordinate for map display';
COMMENT ON COLUMN itinerary_items.longitude IS 'Longitude coordinate for map display';

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_itinerary_items_location ON itinerary_items(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
