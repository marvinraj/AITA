import { supabase } from '../supabase';
import { Place } from './placesService';

export interface SavedPlace {
  id: string;
  user_id: string;
  place_id: string; // Google Places ID
  folder_id?: string | null;
  name: string;
  address: string;
  rating?: number;
  type: string;
  category: string;
  description?: string;
  image_url?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  saved_at: string;
  notes?: string; // User's personal notes about the place
  tags?: string[]; // User-defined tags
}

export interface CreateSavedPlaceInput {
  place_id: string;
  name: string;
  address: string;
  rating?: number;
  type: string;
  category: string;
  description?: string;
  image_url?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  notes?: string;
  tags?: string[];
  folder_id?: string | null;
}

class SavedPlacesService {
  
  async getSavedPlaces(userId: string): Promise<SavedPlace[]> {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved places:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSavedPlaces:', error);
      return [];
    }
  }

  async savePlace(userId: string, place: CreateSavedPlaceInput): Promise<SavedPlace | null> {
    try {
      // Check if place is already saved
      const { data: existingPlace } = await supabase
        .from('saved_places')
        .select('id')
        .eq('user_id', userId)
        .eq('place_id', place.place_id)
        .single();

      if (existingPlace) {
        throw new Error('Place is already saved');
      }

      const { data, error } = await supabase
        .from('saved_places')
        .insert([
          {
            user_id: userId,
            ...place,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving place:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in savePlace:', error);
      return null;
    }
  }

  async unsavePlace(userId: string, placeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_places')
        .delete()
        .eq('user_id', userId)
        .eq('place_id', placeId);

      if (error) {
        console.error('Error unsaving place:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in unsavePlace:', error);
      return false;
    }
  }

  async isPlaceSaved(userId: string, placeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('id')
        .eq('user_id', userId)
        .eq('place_id', placeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking if place is saved:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isPlaceSaved:', error);
      return false;
    }
  }

  async updateSavedPlace(
    userId: string, 
    placeId: string, 
    updates: Partial<Pick<SavedPlace, 'notes' | 'tags'>>
  ): Promise<SavedPlace | null> {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .update(updates)
        .eq('user_id', userId)
        .eq('place_id', placeId)
        .select()
        .single();

      if (error) {
        console.error('Error updating saved place:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSavedPlace:', error);
      return null;
    }
  }

  async getSavedPlacesByCategory(userId: string, category: string): Promise<SavedPlace[]> {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved places by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSavedPlacesByCategory:', error);
      return [];
    }
  }

  async searchSavedPlaces(userId: string, query: string): Promise<SavedPlace[]> {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,address.ilike.%${query}%,description.ilike.%${query}%,notes.ilike.%${query}%`)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error searching saved places:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchSavedPlaces:', error);
      return [];
    }
  }

  // Convert Place to CreateSavedPlaceInput
  placeToSavedPlace(place: Place, notes?: string, tags?: string[]): CreateSavedPlaceInput {
    return {
      place_id: place.id,
      name: place.name,
      address: place.address,
      rating: place.rating,
      type: place.type,
      category: place.category || 'other',
      description: place.description,
      image_url: place.imageUrl,
      photos: place.photos,
      notes,
      tags,
    };
  }
}

export const savedPlacesService = new SavedPlacesService();
