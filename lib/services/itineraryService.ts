import { CreateItineraryItemInput, ItineraryItem, UpdateItineraryItemInput } from '../../types/database';
import { supabase } from '../supabase';

export class ItineraryService {
  
  // Get all itinerary items for a specific trip
  async getItineraryByTrip(tripId: string): Promise<ItineraryItem[]> {
    try {
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true })
        .order('item_order', { ascending: true });

      if (error) {
        console.error('Error fetching itinerary:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
      throw error;
    }
  }

  // Get itinerary items for a specific date
  async getItineraryByDate(tripId: string, date: string): Promise<ItineraryItem[]> {
    try {
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', tripId)
        .eq('date', date)
        .order('item_order', { ascending: true });

      if (error) {
        console.error('Error fetching itinerary for date:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch itinerary for date:', error);
      throw error;
    }
  }

  // Create a new itinerary item
  async createItineraryItem(itemData: CreateItineraryItemInput): Promise<ItineraryItem> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // If no item_order is specified, get the next order number for this date
      let item_order = itemData.item_order;
      if (!item_order) {
        const existingItems = await this.getItineraryByDate(itemData.trip_id, itemData.date);
        item_order = existingItems.length + 1;
      }

      const { data, error } = await supabase
        .from('itinerary_items')
        .insert([{
          ...itemData,
          user_id: user.id,
          item_order,
          category: itemData.category || 'activity',
          priority: itemData.priority || 'medium'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating itinerary item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create itinerary item:', error);
      throw error;
    }
  }

  // Update an existing itinerary item
  async updateItineraryItem(itemId: string, updates: UpdateItineraryItemInput): Promise<ItineraryItem> {
    try {
      const { data, error } = await supabase
        .from('itinerary_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating itinerary item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update itinerary item:', error);
      throw error;
    }
  }

  // Delete an itinerary item
  async deleteItineraryItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting itinerary item:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete itinerary item:', error);
      throw error;
    }
  }

  // Reorder items within a day
  async reorderItems(tripId: string, date: string, itemIds: string[]): Promise<void> {
    try {
      // Update each item with its new order
      const updates = itemIds.map((itemId, index) => ({
        id: itemId,
        item_order: index + 1,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        await supabase
          .from('itinerary_items')
          .update({ item_order: update.item_order, updated_at: update.updated_at })
          .eq('id', update.id)
          .eq('trip_id', tripId)
          .eq('date', date);
      }
    } catch (error) {
      console.error('Failed to reorder itinerary items:', error);
      throw error;
    }
  }

  // Get itinerary statistics for a trip
  async getItineraryStats(tripId: string): Promise<{
    totalItems: number;
    itemsByCategory: Record<string, number>;
    itemsByDate: Record<string, number>;
  }> {
    try {
      const items = await this.getItineraryByTrip(tripId);
      
      const stats = {
        totalItems: items.length,
        itemsByCategory: {} as Record<string, number>,
        itemsByDate: {} as Record<string, number>
      };

      items.forEach(item => {
        // Count by category
        stats.itemsByCategory[item.category] = (stats.itemsByCategory[item.category] || 0) + 1;
        
        // Count by date
        stats.itemsByDate[item.date] = (stats.itemsByDate[item.date] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get itinerary stats:', error);
      throw error;
    }
  }
}

export const itineraryService = new ItineraryService();
