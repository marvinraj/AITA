import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'

const _layout = () => {
  return (
    <Tabs>
        {/* hides 'index' on top */}
        <Tabs.Screen
            name="index"
            options={{
                title: 'Home',
                headerShown: false
            }}
        />
        <Tabs.Screen
            name="discover"
            options={{
                title: 'Discover',
                headerShown: false
            }}
        />
        <Tabs.Screen
            name="activity"
            options={{
                title: 'Activity',
                headerShown: false
            }}
        />
        <Tabs.Screen
            name="profile"
            options={{
                title: 'Profile',
                headerShown: false
            }}
        />
    </Tabs>
  )
}

export default _layout