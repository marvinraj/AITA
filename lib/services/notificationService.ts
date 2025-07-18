import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

export interface SmartNotification {
  id: string;
  type: 'trip_reminder' | 'location_arrival' | 'weather_alert' | 'activity_suggestion' | 'general';
  title: string;
  body: string;
  data?: any;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
  tripId?: string;
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface TripReminder {
  tripId: string;
  type: 'departure' | 'packing' | 'check_in' | 'activity';
  scheduledTime: number;
  title: string;
  body: string;
  data?: any;
}

// location tracking task
const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_TRACKING_KEY = 'location_tracking_enabled';
const NOTIFICATIONS_KEY = 'stored_notifications';
const TRIP_REMINDERS_KEY = 'trip_reminders';

// configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // check if this is a scheduled trip notification in development
    const data = notification.request.content.data as any;
    if (data?.type && ['packing', 'check_in', 'departure', 'activity'].includes(data.type)) {
      console.log('🚫 Preventing popup for scheduled notification (Expo Go limitation)');
      return {
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }
    
    // for all other notifications show normally
    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private notificationListener: any;
  private responseListener: any;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // initialize notification service
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // set up notification listeners
      this.setupNotificationListeners();

      // location for now is optional - don't fail initialization if it's not available
      try {
        await this.setupLocationServices();
      } catch (locationError) {
        console.warn('⚠️ Location services setup failed (this is optional):', locationError);
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  // separate method for location setup
  private async setupLocationServices(): Promise<void> {
    // request location permissions (optional - don't fail if denied)
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (locationStatus === 'granted') {
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
          await this.enableLocationTracking();
        } else {
          // background location permission denied - location features will be limited
          // this is normal and expected behavior for most users
        }
      } catch (backgroundError) {
        // background location not available - location features will be limited
        // this is normal for Expo Go and apps without background location setup
      }
    } else {
      console.log('⚠️ Location permission denied - location features will be disabled');
    }
  }

  // set up notification event listeners
  private setupNotificationListeners() {
    // listen for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      this.handleNotificationReceived(notification);
    });

    // listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationResponse(response);
    });
  }

  // handle received notifications
  private async handleNotificationReceived(notification: Notifications.Notification) {
    console.log('🔔 Notification received:', {
      id: notification.request.identifier,
      title: notification.request.content.title,
      trigger: notification.request.trigger,
      date: new Date().toLocaleString()
    });
    
    // in development, Expo Go incorrectly triggers scheduled notifications immediately
    // check if this is a scheduled notification that shouldn't be immediate
    const data = notification.request.content.data as any;
    if (data?.type && ['packing', 'check_in', 'departure', 'activity'].includes(data.type)) {
      console.log('⚠️ Scheduled notification triggered immediately (Expo Go limitation)');
      console.log('🚫 Skipping immediate storage - this would fire at the correct time in production');
      return;
    }
    
    const smartNotification: SmartNotification = {
      id: notification.request.identifier,
      type: (data?.type as SmartNotification['type']) || 'general',
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data,
      timestamp: Date.now(),
      read: false,
      priority: (data?.priority as SmartNotification['priority']) || 'normal',
      tripId: data?.tripId as string | undefined,
      locationData: data?.locationData as SmartNotification['locationData'],
    };

    await this.storeNotification(smartNotification);
  }

  // handle user notification interactions
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    // mark notification as read
    this.markNotificationAsRead(response.notification.request.identifier);

    // handle different notification types
    switch (data?.type) {
      case 'trip_reminder':
        // navigate to trip details
        break;
      case 'location_arrival':
        // open map or activity suggestions
        break;
      case 'weather_alert':
        // show weather details
        break;
      default:
        // default action
        break;
    }
  }

  // schedule trip reminders
  async scheduleTripReminder(reminder: TripReminder): Promise<string> {
    try {
      const secondsUntilTrigger = Math.max(1, Math.floor((reminder.scheduledTime - Date.now()) / 1000));
      
      console.log(`📅 Scheduling ${reminder.type} reminder:`, {
        scheduledFor: new Date(reminder.scheduledTime).toLocaleString(),
        secondsFromNow: secondsUntilTrigger,
        title: reminder.title
      });

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: {
            type: reminder.type,
            tripId: reminder.tripId,
            priority: 'high',
            ...reminder.data,
          },
        },
        trigger: { 
          seconds: secondsUntilTrigger
        } as any,
      });

      // store reminder reference
      await this.storeTripReminder(reminder, notificationId);
      
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule trip reminder:', error);
      throw error;
    }
  }

  // schedule smart notifications based on location
  async scheduleLocationBasedNotification(
    latitude: number,
    longitude: number,
    radius: number,
    title: string,
    body: string,
    data?: any
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'location_arrival',
            priority: 'normal',
            locationData: { latitude, longitude },
            ...data,
          },
        },
        trigger: {
          type: 'location',
          region: {
            latitude,
            longitude,
            radius,
          },
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule location-based notification:', error);
      throw error;
    }
  }

  // send immediate notification
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'general',
            priority,
            ...data,
          },
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
      throw error;
    }
  }

  // enable background location tracking
  async enableLocationTracking(): Promise<void> {
    try {
      // check if location services are available
      const hasLocationSupport = await Location.hasServicesEnabledAsync();
      if (!hasLocationSupport) {
        console.log('Location services are disabled on this device');
        return;
      }

      await TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
        if (error) {
          console.error('Location tracking error:', error);
          return;
        }

        if (data) {
          const { locations } = data;
          await this.handleLocationUpdate(locations[0]);
        }
      });

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 300000, // 5 minutes
        distanceInterval: 1000, // 1km
        foregroundService: {
          notificationTitle: 'AITA Travel Assistant',
          notificationBody: 'Tracking location for smart travel suggestions',
        },
      });

      await AsyncStorage.setItem(LOCATION_TRACKING_KEY, 'true');
      console.log('Location tracking enabled successfully');
    } catch (error) {
      console.error('Failed to enable location tracking:', error);
    }
  }

  // Handle location updates TODO: need this or no?
  private async handleLocationUpdate(location: Location.LocationObject) {
    // Here you can implement logic to check if user is near:
    // - Trip destinations
    // - Points of interest
    // - Hotels/accommodations
    // - Activity locations
    
    // Example: Check if near airport for departure reminders
    // Example: Check if at destination for arrival notifications
    // Example: Weather-based activity suggestions
  }

  // store notification in local storage
  private async storeNotification(notification: SmartNotification): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const notifications: SmartNotification[] = stored ? JSON.parse(stored) : [];
      
      notifications.unshift(notification); // Add to beginning
      
      // keep only last 50 notifications
      const trimmed = notifications.slice(0, 50);
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  // store trip reminder reference
  private async storeTripReminder(reminder: TripReminder, notificationId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TRIP_REMINDERS_KEY);
      const reminders: Array<{ reminder: TripReminder; notificationId: string }> = stored ? JSON.parse(stored) : [];
      
      reminders.push({ reminder, notificationId });
      
      await AsyncStorage.setItem(TRIP_REMINDERS_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Failed to store trip reminder:', error);
    }
  }

  // get all stored notifications
  async getStoredNotifications(): Promise<SmartNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }

  // mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      const updated = notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // mark all notifications as read
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      const updated = notifications.map(notif => ({ ...notif, read: true }));
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  // cancel scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  // cancel all trip reminders for a specific trip
  async cancelTripReminders(tripId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TRIP_REMINDERS_KEY);
      const reminders: Array<{ reminder: TripReminder; notificationId: string }> = stored ? JSON.parse(stored) : [];
      
      const tripReminders = reminders.filter(r => r.reminder.tripId === tripId);
      
      // cancel notifications
      for (const { notificationId } of tripReminders) {
        await this.cancelNotification(notificationId);
      }
      
      // remove from storage
      const remaining = reminders.filter(r => r.reminder.tripId !== tripId);
      await AsyncStorage.setItem(TRIP_REMINDERS_KEY, JSON.stringify(remaining));
    } catch (error) {
      console.error('Failed to cancel trip reminders:', error);
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getStoredNotifications();
      return notifications.filter(notif => !notif.read).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Clear all stored notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
      console.log('✅ All notifications cleared successfully');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      throw error;
    }
  }

  // Cleanup
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export const notificationService = NotificationService.getInstance();
