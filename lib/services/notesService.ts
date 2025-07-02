import { CreateNoteInput, Note, UpdateNoteInput } from '../../types/database';
import { supabase } from '../supabase';

export class NotesService {
  
  // Get all notes for a specific trip
  async getNotesByTrip(tripId: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      throw error;
    }
  }

  // Create a new note
  async createNote(noteData: CreateNoteInput): Promise<Note> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          user_id: user.id,
          category: noteData.category || 'general'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }

  // Update an existing note
  async updateNote(noteId: string, updates: UpdateNoteInput): Promise<Note> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating note:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting note:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  // Get a single note by ID
  async getNoteById(noteId: string): Promise<Note | null> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching note:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch note:', error);
      throw error;
    }
  }

  // Search notes by content
  async searchNotes(tripId: string, searchTerm: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('trip_id', tripId)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching notes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search notes:', error);
      throw error;
    }
  }
}

export const notesService = new NotesService();
