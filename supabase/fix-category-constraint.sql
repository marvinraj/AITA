-- Fix category constraint to match frontend categories
-- This script updates the category constraint to include all categories used in the app

-- First, drop the existing constraint
ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_category_check;

-- Add the updated constraint with all categories
ALTER TABLE itinerary_items ADD CONSTRAINT itinerary_items_category_check 
    CHECK (category IN ('activity', 'restaurant', 'hotel', 'transport', 'flight', 'attraction', 'shopping', 'nightlife', 'other'));

-- Verify the constraint is working
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conname = 'itinerary_items_category_check';
