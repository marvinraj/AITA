import { Stack } from 'expo-router';

export default function RootLayout() {
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