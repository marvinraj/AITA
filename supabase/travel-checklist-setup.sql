-- Travel Checklist Storage Schema
-- This script creates the travel_checklist table with proper relationships and security

-- Create travel_checklist table
CREATE TABLE IF NOT EXISTS travel_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'general',
    item_name TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    notes TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_travel_checklist_trip_id ON travel_checklist(trip_id);
CREATE INDEX IF NOT EXISTS idx_travel_checklist_user_id ON travel_checklist(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_checklist_category ON travel_checklist(category);
CREATE INDEX IF NOT EXISTS idx_travel_checklist_completed ON travel_checklist(is_completed);
CREATE INDEX IF NOT EXISTS idx_travel_checklist_priority ON travel_checklist(priority);
CREATE INDEX IF NOT EXISTS idx_travel_checklist_due_date ON travel_checklist(due_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_travel_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_checklist_updated_at
    BEFORE UPDATE ON travel_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_travel_checklist_updated_at();

-- Row Level Security (RLS)
ALTER TABLE travel_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own checklist items
CREATE POLICY travel_checklist_user_access ON travel_checklist
    USING (auth.uid() = user_id);

-- Users can insert their own checklist items
CREATE POLICY travel_checklist_user_insert ON travel_checklist
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own checklist items
CREATE POLICY travel_checklist_user_update ON travel_checklist
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own checklist items
CREATE POLICY travel_checklist_user_delete ON travel_checklist
    FOR DELETE
    USING (auth.uid() = user_id);

-- Insert some sample categories for reference (optional)
-- These can be used as default categories in the UI
/*
Common checklist categories:
- documents (passport, visa, ID, tickets)
- packing (clothes, accessories, gear)
- preparation (book accommodation, notify bank, get insurance)
- health (medications, vaccinations, first aid)
- technology (chargers, adapters, devices)
- booking (flights, hotels, activities)
- general (miscellaneous items)
*/

-- Verification queries to test the setup
-- Run these after executing the main script

-- 1. Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'travel_checklist' 
ORDER BY ordinal_position;

-- 2. Verify indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'travel_checklist';

-- 3. Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'travel_checklist';

-- 4. Verify RLS policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'travel_checklist';

-- 5. Test sample insert (replace with actual user_id and trip_id)
/*
INSERT INTO travel_checklist (trip_id, user_id, category, item_name, priority) 
VALUES 
    ('your-trip-id-here', 'your-user-id-here', 'documents', 'Passport', 'high'),
    ('your-trip-id-here', 'your-user-id-here', 'packing', 'Sunscreen', 'medium'),
    ('your-trip-id-here', 'your-user-id-here', 'preparation', 'Book hotel', 'high');
*/

-- 6. Test query to get checklist items for a trip
/*
SELECT 
    id,
    category,
    item_name,
    is_completed,
    priority,
    notes,
    due_date,
    created_at
FROM travel_checklist 
WHERE trip_id = 'your-trip-id-here'
ORDER BY 
    CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END,
    category,
    created_at DESC;
*/
