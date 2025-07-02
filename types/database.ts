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
