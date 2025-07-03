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
