import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  return <Stack>
    {/* hides 'tab' group route on top */}
    <Stack.Screen
      name="(tabs)"
      options={{ headerShown: false }}
    />
  </Stack>;
}
