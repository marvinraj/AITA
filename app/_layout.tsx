import SafeScreen from "@/components/safesScreen";
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Newsreader-Regular': require('../assets/fonts/Newsreader_24pt-Regular.ttf'),
    'Belleza-Regular': require('../assets/fonts/Belleza-Regular.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Urbanist-SemiBold': require('../assets/fonts/Urbanist-SemiBold.ttf'),
    'Urbanist-Regular': require('../assets/fonts/Urbanist-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return <SafeScreen>
    <Stack>
      {/* hides 'tab' group route on top */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(root)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="map"
        options={{ 
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true 
        }}
      />
    </Stack>
  </SafeScreen>;
}
