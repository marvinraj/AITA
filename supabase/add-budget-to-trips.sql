-- Migration: Add budget column to trips table
-- Description: Adds a budget field to track user's budget preferences for trips

-- Add budget column to trips table
ALTER TABLE trips 
ADD COLUMN budget VARCHAR(20) DEFAULT 'any' 
CHECK (budget IN ('any', 'budget', 'mid-range', 'comfort', 'luxury'));

-- Add comment for documentation
COMMENT ON COLUMN trips.budget IS 'User budget preference: any, budget, mid-range, comfort, or luxury';

-- Update existing trips to have default budget value
UPDATE trips SET budget = 'any' WHERE budget IS NULL;
