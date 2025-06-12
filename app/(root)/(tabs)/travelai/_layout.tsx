import { View, Text } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

const TravelAILayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"/>
      {/* <Stack.Screen 
        name="chatAI" 
        options={{ presentation: 'modal' }}
      /> */}
      <Stack.Screen 
        name="smartForm"
        options={{ presentation: 'modal' }} 
      />
      {/* add gestureEnabled: false to the above to prevent users from sliding down to close the smartform modal */}
    </Stack>
  )
}

export default TravelAILayout