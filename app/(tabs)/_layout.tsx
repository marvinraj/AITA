import { View, Text, Image } from 'react-native'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '@/tailwind.config'
import React from 'react'
import { Tabs } from 'expo-router'
import { icons } from '@/constants/icons'


const fullConfig = resolveConfig(tailwindConfig)
const colors = fullConfig.theme?.colors as any


const _layout = () => {
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle: {
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 10
            },
            tabBarStyle: {
                backgroundColor: '#0d0d0d',
                height: 88,
            }
        }}
    >
        <Tabs.Screen
            name="index"
            options={{
                title: 'Home',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <>
                        <Image 
                            source={icons.home} 
                            className='size-7 tint-accentFont' 
                            style={{
                                tintColor: focused ? colors.primaryFont : colors.secondaryFont,
                            }}
                        />
                    </>
                )
            }}
        />
        <Tabs.Screen
            name="discover"
            options={{
                title: 'Discover',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <>
                        <Image 
                            source={icons.discover} 
                            className='size-7' 
                            style={{
                                tintColor: focused ? colors.primaryFont : colors.secondaryFont,
                            }}
                        />
                    </>
                )
            }}
        />
        <Tabs.Screen
            name="travelai"
            options={{
                title: 'TravelAI',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <>
                        <Image 
                            source={icons.add} 
                            className='size-7' 
                            style={{
                                tintColor: focused ? colors.primaryFont : colors.secondaryFont,
                            }}
                        />
                    </>
                )
            }}
        />
        <Tabs.Screen
            name="activity"
            options={{
                title: 'Activity',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <>
                        <Image 
                            source={icons.activity} 
                            className='size-7'
                            style={{
                                tintColor: focused ? colors.primaryFont : colors.secondaryFont,
                            }}
                        />
                    </>
                )
            }}
        />
        <Tabs.Screen
            name="profile"
            options={{
                title: 'Profile',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <>
                        <Image 
                            source={icons.profile} 
                            className='size-7'
                            style={{
                                tintColor: focused ? colors.primaryFont : colors.secondaryFont,
                            }} 
                        />
                    </>
                )
            }}
        />
    </Tabs>
  )
}

export default _layout