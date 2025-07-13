-- Add structured_data column to ai_messages table for rich responses
-- This will allow storing JSON data for recommendations, attractions, etc.

ALTER TABLE ai_messages 
ADD COLUMN structured_data TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN ai_messages.structured_data IS 'JSON string containing structured data for rich responses like recommendations, place details, etc.';
