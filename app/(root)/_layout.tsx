import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { notificationService } from '../../lib/services/notificationService';

export default function RootLayout() {
  
  // initialize notification service when app starts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const success = await notificationService.initialize();
        if (success) {
          console.log('Notification service initialized successfully');
        } else {
          console.log('Notification permissions not granted');
        }
      } catch (error) {
        console.error('Failed to initialize notification service:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="trip" />
      <Stack.Screen name="settings" />
      <Stack.Screen 
        name="chatAI" 
        options={{ 
          presentation: 'card',
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="map" 
        options={{ 
          presentation: 'modal',
          gestureEnabled: true 
        }} 
      />
    </Stack>
  );
}