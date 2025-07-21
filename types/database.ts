// Database types for Supabase tables
export interface Trip {
  id: string;
  user_id: string;
  name: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  companions?: string; // 'solo', 'partner', 'friends', 'family'
  activities?: string; // comma-separated list or JSON string
  status?: 'planning' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  trip_id: string;
  user_id: string;
  title?: string;
  content: string;
  category: 'general' | 'important' | 'todo' | 'reminder';
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  trip_id: string;
  user_id: string;
  category: string;
  item_name: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

// AI Chat System Types
export interface AIChat {
  id: string;
  trip_id: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_order: number;
  created_at: string;
  token_count?: number;
  model_used?: string;
  response_time_ms?: number;
  structured_data?: string; // JSON string for structured responses like recommendations
}

// Itinerary System Types
export interface ItineraryItem {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  description?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // Time in HH:MM format - now required
  duration?: number; // Duration in minutes
  location?: string;
  latitude?: number; // Latitude coordinate for map display
  longitude?: number; // Longitude coordinate for map display
  category: 'activity' | 'restaurant' | 'hotel' | 'transport' | 'flight' | 'attraction' | 'shopping' | 'nightlife' | 'other';
  priority: 'low' | 'medium' | 'high';
  item_order: number; // Order within the day
  notes?: string;
  cost?: number;
  currency?: string;
  image_url?: string; // Primary image URL for the activity/place
  photos?: string[]; // Array of additional photo URLs for gallery
  created_at: string;
  updated_at: string;
}

// Helper interface for UI components
export interface DailyItinerary {
  date: string;
  dayOfWeek: string;
  formattedDate: string; // "Tuesday, 22 Jul"
  items: ItineraryItem[];
  isExpanded: boolean;
  itemCount: number;
}

// Interface for generated activities in preview modal
export interface GeneratedActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  location: string;
  category: 'activity' | 'restaurant' | 'hotel' | 'transport' | 'flight' | 'attraction' | 'shopping' | 'nightlife' | 'other';
  priority: 'low' | 'medium' | 'high';
}

// Trip form data interface for smart form
export interface TripFormData {
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  companions: string;
  activities: string;
}

// Input types for creating and updating records
export interface CreateNoteInput {
  trip_id: string;
  title?: string;
  content: string;
  category?: 'general' | 'important' | 'todo' | 'reminder';
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  category?: 'general' | 'important' | 'todo' | 'reminder';
}

export interface CreateTripInput {
  name: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  companions?: string;
  activities?: string;
  status?: 'planning' | 'active' | 'completed';
}

export interface UpdateTripInput {
  name?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  companions?: string;
  activities?: string;
  status?: 'planning' | 'active' | 'completed';
}

// Input types for creating and updating checklist items
export interface CreateChecklistItemInput {
  trip_id: string;
  category?: string;
  item_name: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  due_date?: string;
}

export interface UpdateChecklistItemInput {
  category?: string;
  item_name?: string;
  is_completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  due_date?: string;
}

// Input types for AI chat system
export interface CreateAIChatInput {
  trip_id: string;
  title?: string;
  is_active?: boolean;
}

export interface UpdateAIChatInput {
  title?: string;
  is_active?: boolean;
}

export interface CreateAIMessageInput {
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_order: number;
  token_count?: number;
  model_used?: string;
  response_time_ms?: number;
  structured_data?: string; // JSON string for structured responses
}

export interface UpdateAIMessageInput {
  content?: string;
  token_count?: number;
  model_used?: string;
  response_time_ms?: number;
  structured_data?: string;
}

// Itinerary input types
export interface CreateItineraryItemInput {
  trip_id: string;
  title: string;
  description?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // Time in HH:MM format - now required
  duration?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: 'activity' | 'restaurant' | 'hotel' | 'transport' | 'flight' | 'attraction' | 'shopping' | 'nightlife' | 'other';
  priority?: 'low' | 'medium' | 'high';
  item_order?: number;
  notes?: string;
  cost?: number;
  currency?: string;
  image_url?: string; // Primary image URL for the activity/place
  photos?: string[]; // Array of additional photo URLs for gallery
}

export interface UpdateItineraryItemInput {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  duration?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: 'activity' | 'restaurant' | 'hotel' | 'transport' | 'flight' | 'attraction' | 'shopping' | 'nightlife' | 'other';
  priority?: 'low' | 'medium' | 'high';
  item_order?: number;
  notes?: string;
  cost?: number;
  currency?: string;
}

// Helper types for UI components
export interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
}

export interface ChecklistStats {
  totalItems: number;
  completedItems: number;
  highPriorityItems: number;
  overdueTasks: number;
  categories: string[];
}

// Common checklist categories for UI suggestions
export const CHECKLIST_CATEGORIES = [
  'documents',
  'packing', 
  'preparation',
  'health',
  'technology',
  'booking',
  'general'
] as const;

export type ChecklistCategoryType = typeof CHECKLIST_CATEGORIES[number];
