-- AI Chat System Database Schema
-- This creates the tables needed for persistent AI chat storage

-- ==========================================
-- AI CHATS TABLE
-- ==========================================
-- Each trip gets its own AI chat conversation
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  
  -- Chat metadata
  title TEXT DEFAULT 'AI Assistant Chat',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(trip_id) -- One chat per trip
);

-- ==========================================
-- AI MESSAGES TABLE
-- ==========================================
-- Individual messages within each chat
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Ordering and metadata
  message_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional performance metadata
  token_count INTEGER,
  model_used TEXT DEFAULT 'gemini-pro',
  response_time_ms INTEGER,
  
  -- Ensure proper ordering within each chat
  UNIQUE(chat_id, message_order)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
-- Index for finding chats by trip
CREATE INDEX IF NOT EXISTS idx_ai_chats_trip_id ON ai_chats(trip_id);

-- Index for finding messages by chat (ordered)
CREATE INDEX IF NOT EXISTS idx_ai_messages_chat_id_order ON ai_messages(chat_id, message_order);

-- Index for finding messages by creation time
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Enable RLS on both tables
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own chats
-- Note: This assumes you have a trips table with user_id for reference
CREATE POLICY "Users can access their own ai_chats" ON ai_chats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = ai_chats.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Policy: Users can only access messages from their own chats
CREATE POLICY "Users can access their own ai_messages" ON ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_chats 
      JOIN trips ON trips.id = ai_chats.trip_id
      WHERE ai_chats.id = ai_messages.chat_id 
      AND trips.user_id = auth.uid()
    )
  );

-- ==========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ai_chats.updated_at when modified
CREATE TRIGGER update_ai_chats_updated_at
  BEFORE UPDATE ON ai_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update ai_chats.updated_at when messages are added
CREATE OR REPLACE FUNCTION update_chat_on_message_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent chat's updated_at timestamp
  UPDATE ai_chats 
  SET updated_at = NOW() 
  WHERE id = COALESCE(NEW.chat_id, OLD.chat_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for when messages are inserted, updated, or deleted
CREATE TRIGGER update_chat_on_message_insert
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_on_message_change();

CREATE TRIGGER update_chat_on_message_update
  AFTER UPDATE ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_on_message_change();

CREATE TRIGGER update_chat_on_message_delete
  AFTER DELETE ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_on_message_change();

-- ==========================================
-- SAMPLE DATA (Optional - for testing)
-- ==========================================
-- Uncomment these lines if you want to add sample data for testing
-- INSERT INTO ai_chats (trip_id, title) VALUES 
--   ('your-trip-id-here', 'Paris Trip Chat'),
--   ('another-trip-id', 'Tokyo Adventure Chat');
