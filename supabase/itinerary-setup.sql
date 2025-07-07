-- Itinerary System Setup
-- This file creates the itinerary_items table and related functionality

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME,
    duration INTEGER, -- Duration in minutes
    location TEXT,
    category TEXT NOT NULL DEFAULT 'activity' CHECK (category IN ('activity', 'restaurant', 'hotel', 'transport', 'flight', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    item_order INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_user_id ON itinerary_items(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_date ON itinerary_items(date);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_date ON itinerary_items(trip_id, date);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_order ON itinerary_items(trip_id, date, item_order);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_itinerary_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_itinerary_items_updated_at
    BEFORE UPDATE ON itinerary_items
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_items_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own itinerary items
CREATE POLICY "Users can view own itinerary items" ON itinerary_items
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own itinerary items
CREATE POLICY "Users can insert own itinerary items" ON itinerary_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own itinerary items
CREATE POLICY "Users can update own itinerary items" ON itinerary_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own itinerary items
CREATE POLICY "Users can delete own itinerary items" ON itinerary_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically set order when inserting items
CREATE OR REPLACE FUNCTION set_itinerary_item_order()
RETURNS TRIGGER AS $$
BEGIN
    -- If no order is specified, set it to the next available order for this trip/date
    IF NEW.item_order IS NULL OR NEW.item_order = 0 THEN
        SELECT COALESCE(MAX(item_order), 0) + 1
        INTO NEW.item_order
        FROM itinerary_items
        WHERE trip_id = NEW.trip_id AND date = NEW.date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_itinerary_item_order
    BEFORE INSERT ON itinerary_items
    FOR EACH ROW
    EXECUTE FUNCTION set_itinerary_item_order();

-- Sample data for testing (optional - remove in production)
-- This creates some sample itinerary items for testing purposes
/*
INSERT INTO itinerary_items (trip_id, user_id, title, description, date, time, category, priority, item_order) VALUES
    ((SELECT id FROM trips LIMIT 1), auth.uid(), 'Arrive at Hotel', 'Check in and settle down', CURRENT_DATE, '14:00', 'hotel', 'high', 1),
    ((SELECT id FROM trips LIMIT 1), auth.uid(), 'City Walking Tour', 'Explore the main attractions downtown', CURRENT_DATE, '16:00', 'activity', 'medium', 2),
    ((SELECT id FROM trips LIMIT 1), auth.uid(), 'Dinner at Local Restaurant', 'Try the famous local cuisine', CURRENT_DATE, '19:00', 'restaurant', 'medium', 3);
*/
