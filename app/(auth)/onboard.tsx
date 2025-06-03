import { Link } from "expo-router"
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

const Onboarding = () => {
  return (
    <View className="flex-1 bg-primaryBG px-6">
      <View className="items-center mt-6 mb-8">
        <Text className="text-3xl font-bold text-primaryFont text-center">AITA</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Image
          source={require('../../assets/images/logo.png')}
          className="w-80 h-80 mb-8"
          resizeMode="contain"
          accessibilityLabel="AITA Logo"
        />
        {/* <Text className="text-lg text-cyan-200 text-center">
          Your AI-powered travel assistant. Plan, discover, and chat with AI for your next adventure!
        </Text> */}
      </View>
      <View className="w-full items-center mb-14">
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity className="bg-primaryFont w-full px-6 py-5 rounded-full shadow-lg active:opacity-80" style={{maxWidth: 500}}>
            <Text className="font-semibold text-base text-center">Get Started</Text>
          </TouchableOpacity>
        </Link>
        <View className="mt-4 items-center w-full">
          <Text className="text-secondaryFont text-xs text-center">
            By tapping on <Text className="font-semibold">"Get Started"</Text>, you agree to our
          </Text>
          <Text className="text-secondaryFont text-xs text-center mt-1">
            <Text className="underline">Terms</Text> and <Text className="underline">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Onboarding