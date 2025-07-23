import { useEffect, useState } from 'react';
import { notificationService, SmartNotification } from '../lib/services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // set up interval to refresh notifications
    const interval = setInterval(loadNotifications, 20000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const [storedNotifications, count] = await Promise.all([
        notificationService.getStoredNotifications(),
        notificationService.getUnreadCount(),
      ]);
      
      setNotifications(storedNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      await loadNotifications(); // Refresh
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      await loadNotifications(); // Refresh
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const sendNotification = async (
    title: string,
    body: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    try {
      return await notificationService.sendImmediateNotification(title, body, data, priority);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const success = await notificationService.deleteNotification(notificationId);
      if (success) {
        await loadNotifications(); // Refresh
      }
      return success;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  };

  const getNotificationsByType = async (type: SmartNotification['type'], limit?: number) => {
    try {
      return await notificationService.getNotificationsByType(type, limit);
    } catch (error) {
      console.error('Failed to get notifications by type:', error);
      return [];
    }
  };

  const getTripNotifications = async (tripId: string, limit?: number) => {
    try {
      return await notificationService.getTripNotifications(tripId, limit);
    } catch (error) {
      console.error('Failed to get trip notifications:', error);
      return [];
    }
  };

  const syncNotifications = async () => {
    try {
      await notificationService.syncNotifications();
      await loadNotifications(); // Refresh after sync
    } catch (error) {
      console.error('Failed to sync notifications:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      await loadNotifications(); // Refresh
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification,
    deleteNotification,
    getNotificationsByType,
    getTripNotifications,
    syncNotifications,
    clearAllNotifications,
  };
};
