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

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification,
  };
};
