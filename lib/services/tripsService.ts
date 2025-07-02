import { CreateTripInput, Trip, UpdateTripInput } from '../../types/database';
import { supabase } from '../supabase';

export class TripsService {
  
  // Get all trips for the current user
  async getUserTrips(): Promise<Trip[]> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trips:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      throw error;
    }
  }

  // Get all trips for the current user (alias for getUserTrips for better semantics)
  async getAllTrips(): Promise<Trip[]> {
    return this.getUserTrips();
  }

  // Create a new trip
  async createTrip(tripData: CreateTripInput): Promise<Trip> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('trips')
        .insert([{
          ...tripData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating trip:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create trip:', error);
      throw error;
    }
  }

  // Get or create a default trip for the user
  async getOrCreateDefaultTrip(): Promise<Trip> {
    try {
      // First, try to get existing trips
      const trips = await this.getUserTrips();
      
      if (trips.length > 0) {
        // Return the most recent trip
        return trips[0];
      }

      // No trips exist, create a default one
      const defaultTrip = await this.createTrip({
        name: 'My Travel Plans',
        destination: 'Various destinations'
      });

      return defaultTrip;
    } catch (error) {
      console.error('Failed to get or create default trip:', error);
      throw error;
    }
  }

  // Update an existing trip
  async updateTrip(tripId: string, updates: UpdateTripInput): Promise<Trip> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        console.error('Error updating trip:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update trip:', error);
      throw error;
    }
  }

  // Delete a trip
  async deleteTrip(tripId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        console.error('Error deleting trip:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
      throw error;
    }
  }

  // Get a single trip by ID
  async getTripById(tripId: string): Promise<Trip | null> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching trip:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch trip:', error);
      throw error;
    }
  }

  // Get user's current active trip (most recent)
  async getCurrentTrip(): Promise<Trip | null> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No trips found
          return null;
        }
        console.error('Error fetching current trip:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch current trip:', error);
      throw error;
    }
  }
}

export const tripsService = new TripsService();
