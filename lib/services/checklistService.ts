import { ChecklistCategory, ChecklistItem, ChecklistStats, CreateChecklistItemInput, UpdateChecklistItemInput } from '../../types/database';
import { supabase } from '../supabase';

export class ChecklistService {
  
  // Get all checklist items for a specific trip
  async getChecklistByTrip(tripId: string): Promise<ChecklistItem[]> {
    try {
      const { data, error } = await supabase
        .from('travel_checklist')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching checklist items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch checklist items:', error);
      throw error;
    }
  }

  // Create a new checklist item
  async createChecklistItem(itemData: CreateChecklistItemInput): Promise<ChecklistItem> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('travel_checklist')
        .insert([{
          ...itemData,
          user_id: user.id,
          category: itemData.category || 'general',
          priority: itemData.priority || 'medium'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating checklist item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create checklist item:', error);
      throw error;
    }
  }

  // Update an existing checklist item
  async updateChecklistItem(itemId: string, updates: UpdateChecklistItemInput): Promise<ChecklistItem> {
    try {
      const { data, error } = await supabase
        .from('travel_checklist')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating checklist item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      throw error;
    }
  }

  // Toggle completion status of a checklist item
  async toggleChecklistItem(itemId: string, isCompleted: boolean): Promise<ChecklistItem> {
    try {
      return this.updateChecklistItem(itemId, { is_completed: isCompleted });
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      throw error;
    }
  }

  // Delete a checklist item
  async deleteChecklistItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('travel_checklist')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting checklist item:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
      throw error;
    }
  }

  // Bulk create multiple checklist items
  async bulkCreateChecklistItems(items: CreateChecklistItemInput[]): Promise<ChecklistItem[]> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const itemsWithUser = items.map(item => ({
        ...item,
        user_id: user.id,
        category: item.category || 'general',
        priority: item.priority || 'medium'
      }));

      const { data, error } = await supabase
        .from('travel_checklist')
        .insert(itemsWithUser)
        .select();

      if (error) {
        console.error('Error bulk creating checklist items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to bulk create checklist items:', error);
      throw error;
    }
  }

  // Get checklist items organized by category
  async getChecklistByCategory(tripId: string): Promise<ChecklistCategory[]> {
    try {
      const items = await this.getChecklistByTrip(tripId);
      
      // Group items by category
      const categoryMap = new Map<string, ChecklistItem[]>();
      
      items.forEach(item => {
        const category = item.category || 'general';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(item);
      });

      // Convert to ChecklistCategory array
      const categories: ChecklistCategory[] = [];
      categoryMap.forEach((items, categoryName) => {
        const completedCount = items.filter(item => item.is_completed).length;
        categories.push({
          name: categoryName,
          items: items.sort((a, b) => {
            // Sort by priority (high first), then by completion status, then by creation date
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (a.priority !== b.priority) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            if (a.is_completed !== b.is_completed) {
              return a.is_completed ? 1 : -1; // Incomplete items first
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }),
          completedCount,
          totalCount: items.length
        });
      });

      // Sort categories by completion percentage (incomplete categories first)
      return categories.sort((a, b) => {
        const aCompletion = a.totalCount > 0 ? a.completedCount / a.totalCount : 0;
        const bCompletion = b.totalCount > 0 ? b.completedCount / b.totalCount : 0;
        return aCompletion - bCompletion;
      });
    } catch (error) {
      console.error('Failed to get checklist by category:', error);
      throw error;
    }
  }

  // Get checklist statistics for a trip
  async getChecklistStats(tripId: string): Promise<ChecklistStats> {
    try {
      const items = await this.getChecklistByTrip(tripId);
      const now = new Date();
      
      const stats: ChecklistStats = {
        totalItems: items.length,
        completedItems: items.filter(item => item.is_completed).length,
        highPriorityItems: items.filter(item => item.priority === 'high' && !item.is_completed).length,
        overdueTasks: items.filter(item => 
          item.due_date && 
          !item.is_completed && 
          new Date(item.due_date) < now
        ).length,
        categories: [...new Set(items.map(item => item.category))].sort()
      };

      return stats;
    } catch (error) {
      console.error('Failed to get checklist stats:', error);
      throw error;
    }
  }

  // Get checklist items by priority
  async getChecklistByPriority(tripId: string, priority: 'high' | 'medium' | 'low'): Promise<ChecklistItem[]> {
    try {
      const { data, error } = await supabase
        .from('travel_checklist')
        .select('*')
        .eq('trip_id', tripId)
        .eq('priority', priority)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching checklist items by priority:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch checklist items by priority:', error);
      throw error;
    }
  }

  // Get overdue checklist items
  async getOverdueItems(tripId: string): Promise<ChecklistItem[]> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('travel_checklist')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', now)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching overdue checklist items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch overdue checklist items:', error);
      throw error;
    }
  }
}

export const checklistService = new ChecklistService();
