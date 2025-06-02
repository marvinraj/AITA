import { View, Text } from 'react-native'
import { Stack } from 'expo-router'
import React from 'react'

const _layout = () => {
  return (
    <Stack>
        <Stack.Screen 
            name="onboard" 
            options={{ headerShown: false }}
        />
        <Stack.Screen 
            name="sign-up" 
            options={{ headerShown: false }}
        />
        <Stack.Screen 
            name="sign-in" 
            options={{ headerShown: false }}
            />
    </Stack>
  )
}

export default _layout