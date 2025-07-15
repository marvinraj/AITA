

-- Set them to a default time of 09:00 (9 AM)
UPDATE itinerary_items 
SET time = '09:00' 
WHERE time IS NULL;

-- Now alter the table to make time NOT NULL
ALTER TABLE itinerary_items 
ALTER COLUMN time SET NOT NULL;

-- Add a comment to document the change
COMMENT ON COLUMN itinerary_items.time IS 'Time in HH:MM format (24-hour) - required for all activities';
