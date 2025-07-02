import { useEffect, useState } from 'react';
import { notesService } from '../lib/services/notesService';
import { CreateNoteInput, Note, UpdateNoteInput } from '../types/database';

export const useNotes = (tripId: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notes for the trip
  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await notesService.getNotesByTrip(tripId);
      setNotes(fetchedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new note
  const createNote = async (noteData: Omit<CreateNoteInput, 'trip_id'>) => {
    try {
      const newNote = await notesService.createNote({
        ...noteData,
        trip_id: tripId
      });
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update an existing note
  const updateNote = async (noteId: string, updates: UpdateNoteInput) => {
    try {
      const updatedNote = await notesService.updateNote(noteId, updates);
      setNotes(prev => 
        prev.map(note => note.id === noteId ? updatedNote : note)
      );
      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete a note
  const deleteNote = async (noteId: string) => {
    try {
      await notesService.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Search notes
  const searchNotes = async (searchTerm: string) => {
    try {
      setLoading(true);
      const searchResults = await notesService.searchNotes(tripId, searchTerm);
      setNotes(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search notes');
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Load notes on mount and when tripId changes
  useEffect(() => {
    if (tripId) {
      loadNotes();
    }
  }, [tripId]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    refreshNotes: loadNotes,
    clearError,
  };
};
