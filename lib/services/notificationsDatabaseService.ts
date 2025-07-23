import { supabase } from '../supabase';
import { SmartNotification } from './notificationService';

export interface DatabaseNotification {
  id: string;
  user_id: string;
  notification_id: string;
  type: 'trip_reminder' | 'location_arrival' | 'weather_alert' | 'activity_suggestion' | 'general';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
  trip_id?: string;
  location_data?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
  updated_at: string;
  notification_timestamp: string;
}

export interface CreateNotificationInput {
  notification_id: string;
  type: SmartNotification['type'];
  title: string;
  body: string;
  data?: any;
  priority?: SmartNotification['priority'];
  trip_id?: string;
  location_data?: SmartNotification['locationData'];
  notification_timestamp?: string;
}

class NotificationsDatabaseService {
  // Save notification to database
  async saveNotification(notification: CreateNotificationInput): Promise<DatabaseNotification | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return null;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          notification_id: notification.notification_id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          priority: notification.priority || 'normal',
          trip_id: notification.trip_id,
          location_data: notification.location_data,
          notification_timestamp: notification.notification_timestamp || new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving notification to database:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to save notification:', error);
      return null;
    }
  }

  // Get all notifications for the current user
  async getUserNotifications(limit: number = 50): Promise<DatabaseNotification[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return 0;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('notification_id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('notification_id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  // Clear all notifications for user
  async clearAllNotifications(): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing all notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      return false;
    }
  }

  // Get notifications by type
  async getNotificationsByType(type: SmartNotification['type'], limit: number = 20): Promise<DatabaseNotification[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch notifications by type:', error);
      return [];
    }
  }

  // Get notifications for a specific trip
  async getTripNotifications(tripId: string, limit: number = 20): Promise<DatabaseNotification[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trip notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch trip notifications:', error);
      return [];
    }
  }

  // Convert database notification to SmartNotification format
  convertToSmartNotification(dbNotification: DatabaseNotification): SmartNotification {
    return {
      id: dbNotification.notification_id,
      type: dbNotification.type,
      title: dbNotification.title,
      body: dbNotification.body,
      data: dbNotification.data,
      timestamp: new Date(dbNotification.notification_timestamp).getTime(),
      read: dbNotification.read,
      priority: dbNotification.priority,
      tripId: dbNotification.trip_id,
      locationData: dbNotification.location_data,
    };
  }

  // Convert SmartNotification to database format
  convertFromSmartNotification(notification: SmartNotification): CreateNotificationInput {
    return {
      notification_id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      priority: notification.priority,
      trip_id: notification.tripId,
      location_data: notification.locationData,
      notification_timestamp: new Date(notification.timestamp).toISOString(),
    };
  }
}

export const notificationsDatabaseService = new NotificationsDatabaseService();
