import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { checklistService } from '../lib/services/checklistService';
import { ChecklistCategory, ChecklistItem, ChecklistStats, CreateChecklistItemInput, UpdateChecklistItemInput } from '../types/database';

interface UseChecklistOptions {
  tripId: string;
  autoLoad?: boolean;
  enableStats?: boolean;
  enableCategories?: boolean;
}

interface UseChecklistReturn {
  // Data
  items: ChecklistItem[];
  categories: ChecklistCategory[];
  stats: ChecklistStats | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  loadChecklist: () => Promise<void>;
  createItem: (itemData: CreateChecklistItemInput) => Promise<void>;
  updateItem: (itemId: string, updates: UpdateChecklistItemInput) => Promise<void>;
  toggleItem: (itemId: string, isCompleted: boolean) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  bulkCreateItems: (items: CreateChecklistItemInput[]) => Promise<void>;
  
  // Utility actions
  refreshData: () => Promise<void>;
  clearError: () => void;
  
  // Quick filters
  getItemsByCategory: (category: string) => ChecklistItem[];
  getItemsByPriority: (priority: 'high' | 'medium' | 'low') => ChecklistItem[];
  getIncompleteItems: () => ChecklistItem[];
  getOverdueItems: () => ChecklistItem[];
}

export function useChecklist({
  tripId,
  autoLoad = true,
  enableStats = true,
  enableCategories = true
}: UseChecklistOptions): UseChecklistReturn {
  
  // State
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [stats, setStats] = useState<ChecklistStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load checklist data
  const loadChecklist = useCallback(async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load items
      const checklistItems = await checklistService.getChecklistByTrip(tripId);
      setItems(checklistItems);
      
      // Load categories if enabled
      if (enableCategories) {
        const categoryData = await checklistService.getChecklistByCategory(tripId);
        setCategories(categoryData);
      }
      
      // Load stats if enabled
      if (enableStats) {
        const statsData = await checklistService.getChecklistStats(tripId);
        setStats(statsData);
      }
      
    } catch (err) {
      console.error('Error loading checklist:', err);
      setError('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }, [tripId, enableStats, enableCategories]);

  // Create new checklist item
  const createItem = useCallback(async (itemData: CreateChecklistItemInput) => {
    try {
      setError(null);
      
      const newItem = await checklistService.createChecklistItem(itemData);
      
      // Update local state
      setItems(prev => [newItem, ...prev]);
      
    } catch (err) {
      console.error('Error creating checklist item:', err);
      setError('Failed to create checklist item');
      Alert.alert('Error', 'Failed to create checklist item. Please try again.');
    }
  }, []);

  // Update existing checklist item
  const updateItem = useCallback(async (itemId: string, updates: UpdateChecklistItemInput) => {
    try {
      setError(null);
      
      const updatedItem = await checklistService.updateChecklistItem(itemId, updates);
      
      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
      
    } catch (err) {
      console.error('Error updating checklist item:', err);
      setError('Failed to update checklist item');
      Alert.alert('Error', 'Failed to update checklist item. Please try again.');
    }
  }, []);

  // Toggle completion status
  const toggleItem = useCallback(async (itemId: string, isCompleted: boolean) => {
    try {
      setError(null);
      
      // Optimistic update for better UX
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_completed: isCompleted } : item
      ));
      
      const updatedItem = await checklistService.toggleChecklistItem(itemId, isCompleted);
      
      // Update with server response
      setItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
      
    } catch (err) {
      console.error('Error toggling checklist item:', err);
      setError('Failed to update checklist item');
      
      // Revert optimistic update
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_completed: !isCompleted } : item
      ));
      
      Alert.alert('Error', 'Failed to update checklist item. Please try again.');
    }
  }, []);

  // Delete checklist item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      setError(null);
      
      await checklistService.deleteChecklistItem(itemId);
      
      // Update local state
      setItems(prev => prev.filter(item => item.id !== itemId));
      
    } catch (err) {
      console.error('Error deleting checklist item:', err);
      setError('Failed to delete checklist item');
      Alert.alert('Error', 'Failed to delete checklist item. Please try again.');
    }
  }, []);

  // Bulk create items
  const bulkCreateItems = useCallback(async (itemsData: CreateChecklistItemInput[]) => {
    try {
      setError(null);
      setLoading(true);
      
      const newItems = await checklistService.bulkCreateChecklistItems(itemsData);
      
      // Update local state
      setItems(prev => [...newItems, ...prev]);
      
      // Refresh organized data
      if (enableCategories || enableStats) {
        await refreshData();
      }
      
    } catch (err) {
      console.error('Error bulk creating checklist items:', err);
      setError('Failed to create checklist items');
      Alert.alert('Error', 'Failed to create checklist items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [enableCategories, enableStats]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadChecklist();
  }, [loadChecklist]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Quick filter functions
  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category);
  }, [items]);

  const getItemsByPriority = useCallback((priority: 'high' | 'medium' | 'low') => {
    return items.filter(item => item.priority === priority);
  }, [items]);

  const getIncompleteItems = useCallback(() => {
    return items.filter(item => !item.is_completed);
  }, [items]);

  const getOverdueItems = useCallback(() => {
    const now = new Date();
    return items.filter(item => 
      item.due_date && 
      !item.is_completed && 
      new Date(item.due_date) < now
    );
  }, [items]);

  // Auto-load on mount and tripId change
  useEffect(() => {
    if (autoLoad && tripId) {
      loadChecklist();
    }
  }, [autoLoad, tripId, loadChecklist]);

  return {
    // Data
    items,
    categories,
    stats,
    
    // State
    loading,
    error,
    
    // Actions
    loadChecklist,
    createItem,
    updateItem,
    toggleItem,
    deleteItem,
    bulkCreateItems,
    
    // Utility actions
    refreshData,
    clearError,
    
    // Quick filters
    getItemsByCategory,
    getItemsByPriority,
    getIncompleteItems,
    getOverdueItems
  };
}
