import { View, Text } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

const TravelAILayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"/>
      <Stack.Screen 
        name="chatAI" 
        options={{ presentation: 'modal' }}
      />
    </Stack>
  )
}

export default TravelAILayout