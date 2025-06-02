import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { router, Link } from "expo-router"

const Onboarding = () => {
  return (
    <View className="flex-1 bg-primaryBG items-center justify-center">
        <Text className='text-cyan-100 mb-20'>Onboarding Screen</Text>
        <Link href={'/(auth)/sign-up'} asChild>
            <TouchableOpacity className="px-8 py-3 rounded-lg border-2 border-indigo-50">
                <Text className="text-primaryFont font-semibold text-base">Get Started</Text>
            </TouchableOpacity>
        </Link>
    </View>
  )
}

export default Onboarding