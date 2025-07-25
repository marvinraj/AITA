import { Stack } from 'expo-router'
import React from 'react'

const AuthLayout = () => {
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
        <Stack.Screen 
            name="profile-setup" 
            options={{ headerShown: false }}
        />
        <Stack.Screen 
            name="welcome-aboard" 
            options={{ headerShown: false }}  
        />
    </Stack>
  )
}

export default AuthLayout