-- Notifications System Database Schema
-- This creates the notifications table for persistent notification storage

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  notification_id TEXT NOT NULL, -- The original notification ID from Expo
  type TEXT NOT NULL CHECK (type IN ('trip_reminder', 'location_arrival', 'weather_alert', 'activity_suggestion', 'general')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional data payload
  
  -- Status and metadata
  read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  
  -- Trip and location context
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  location_data JSONB, -- Store latitude, longitude, address
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- When the notification was originally sent
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_trip_id ON notifications(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_id ON notifications(notification_id);

-- Composite index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own notifications
CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update notifications.updated_at when modified
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================
-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_user_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = user_uuid AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, updated_at = NOW()
  WHERE user_id = user_uuid AND read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the setup

-- 1. Verify table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'notifications' 
-- ORDER BY ordinal_position;

-- 2. Verify indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes 
-- WHERE tablename = 'notifications';

-- 3. Verify RLS policies
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'notifications';
