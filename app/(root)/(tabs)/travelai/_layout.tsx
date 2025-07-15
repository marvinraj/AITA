import { Stack } from 'expo-router';
import React from 'react';

const TravelAILayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index"/>
      <Stack.Screen 
        name="smartForm"
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="manual"
        options={{ presentation: 'modal' }} 
      />
      {/* add gestureEnabled: false to the above to prevent users from sliding down to close the smartform modal */}
    </Stack>
  )
}

export default TravelAILayout