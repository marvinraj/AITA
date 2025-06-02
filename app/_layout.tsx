import { Stack } from "expo-router";
import './globals.css';
import SafeScreen from "@/components/safesScreen";

export default function RootLayout() {
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
    </Stack>
  </SafeScreen>;
}
