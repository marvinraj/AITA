import { icons } from '@/constants/icons'
import tailwindConfig from '@/tailwind.config'
import { Tabs, useRouter } from 'expo-router'
import React from 'react'
import { Image, Text, View } from 'react-native'
import resolveConfig from 'tailwindcss/resolveConfig'
import { useNotifications } from '../../../hooks/useNotifications'


const fullConfig = resolveConfig(tailwindConfig)
const colors = fullConfig.theme?.colors as any


const TabsLayout = () => {
  const router = useRouter();
  const { unreadCount } = useNotifications();

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
                backgroundColor: '#0E0E0E',
                height: 88,
                borderColor: '#0E0E0E'
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
            listeners={{
                tabPress: (e) => {
                    // Reset the travelai stack to the index screen when tab is pressed
                    // This ensures we always go to the planning page, not the chat
                    router.push('/travelai');
                }
            }}
        />
        <Tabs.Screen
            name="activity"
            options={{
                title: 'Activity',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <View style={{ position: 'relative' }}>
                        <Image 
                            source={icons.activity} 
                            className='size-7'
                            style={{
                                tintColor: focused ? colors.primaryFont : colors.secondaryFont,
                            }}
                        />
                        {unreadCount > 0 && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    backgroundColor: '#F7374F',
                                    borderRadius: 10,
                                    minWidth: 20,
                                    height: 20,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingHorizontal: 4,
                                }}
                            >
                                <Text 
                                    style={{ 
                                        color: 'white', 
                                        fontSize: 12, 
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
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

export default TabsLayout