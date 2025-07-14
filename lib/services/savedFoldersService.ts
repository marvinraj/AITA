import { supabase } from '../supabase';

export interface SavedFolder {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  place_count?: number;
}

export interface CreateFolderInput {
  name: string;
  is_default?: boolean;
}

class SavedFoldersService {
  
  async getFolders(userId: string): Promise<SavedFolder[]> {
    try {
      const { data, error } = await supabase
        .from('saved_folders')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching folders:', error);
        return [];
      }

      // Get place counts for each folder
      const foldersWithCounts = await Promise.all(
        (data || []).map(async (folder) => {
          const placeCount = await this.getFolderPlaceCount(userId, folder.id);
          return { ...folder, place_count: placeCount };
        })
      );

      return foldersWithCounts;
    } catch (error) {
      console.error('Error in getFolders:', error);
      return [];
    }
  }

  async getFolderPlaceCount(userId: string, folderId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('saved_places')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('folder_id', folderId);

      if (error) {
        console.error('Error getting folder place count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getFolderPlaceCount:', error);
      return 0;
    }
  }

  async getAllSavesCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('saved_places')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting all saves count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getAllSavesCount:', error);
      return 0;
    }
  }

  async createFolder(userId: string, folderData: CreateFolderInput): Promise<SavedFolder | null> {
    try {
      const { data, error } = await supabase
        .from('saved_folders')
        .insert([
          {
            user_id: userId,
            ...folderData,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating folder:', error);
        return null;
      }

      return { ...data, place_count: 0 };
    } catch (error) {
      console.error('Error in createFolder:', error);
      return null;
    }
  }

  async deleteFolder(userId: string, folderId: string): Promise<boolean> {
    try {
      // First, move all places in this folder to no folder (null)
      await supabase
        .from('saved_places')
        .update({ folder_id: null })
        .eq('user_id', userId)
        .eq('folder_id', folderId);

      // Then delete the folder
      const { error } = await supabase
        .from('saved_folders')
        .delete()
        .eq('user_id', userId)
        .eq('id', folderId);

      if (error) {
        console.error('Error deleting folder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteFolder:', error);
      return false;
    }
  }

  async updateFolder(userId: string, folderId: string, updates: Partial<CreateFolderInput>): Promise<SavedFolder | null> {
    try {
      const { data, error } = await supabase
        .from('saved_folders')
        .update(updates)
        .eq('user_id', userId)
        .eq('id', folderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating folder:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateFolder:', error);
      return null;
    }
  }

  async getPlacesInFolder(userId: string, folderId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error getting places in folder:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPlacesInFolder:', error);
      return [];
    }
  }

  async movePlaceToFolder(userId: string, placeId: string, folderId: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_places')
        .update({ folder_id: folderId })
        .eq('user_id', userId)
        .eq('place_id', placeId);

      if (error) {
        console.error('Error moving place to folder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in movePlaceToFolder:', error);
      return false;
    }
  }
}

export const savedFoldersService = new SavedFoldersService();
