import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignIn = () => {
  return (
    <ScrollView className="flex-1 bg-primaryBG px-6" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
      <View className="items-center mt-10 mb-8">
        <Image
          source={require('../../assets/images/logo.png')}
          className="w-20 h-20 mb-2"
          resizeMode="contain"
          accessibilityLabel="AITA Logo"
        />
        <Text className="text-2xl font-semibold text-primaryFont text-center">Welcome Back!</Text>
      </View>
      <View className="flex-1 items-center justify-center w-full">
        <View className="w-full mb-6" style={{maxWidth: 400}}>
          <Text className="text-primaryFont text-sm mb-2">Email</Text>
          <TextInput
            placeholder="enter email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-[#1b1c1d] focus:border-primaryFont rounded-full px-6 py-5 mb-5 text-primaryFont text-base"
            style={{fontSize: 16}}
          />
          <Text className="text-primaryFont text-sm mb-2">Password</Text>
          <TextInput
            placeholder="enter password"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-[#1b1c1d] focus:border-primaryFont rounded-full px-6 py-5 mb-2 text-primaryFont text-base"
            style={{fontSize: 16}}
          />
        </View>
        <Link href="/(root)/(tabs)" asChild>
          <TouchableOpacity className="bg-primaryFont w-full px-6 py-5 rounded-full shadow-lg active:opacity-80 mb-4 mt-4" style={{maxWidth: 400}}>
            <Text className="font-semibold text-base text-center">Log In</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity className="bg-transparent w-full px-6 py-4 rounded-full mb-2 flex-row justify-center items-center" style={{maxWidth: 400}}>
            <Text className="text-primaryFont font-semibold text-base text-center">
              Don't have an account?{' '}
              <Text className="underline">Sign up</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  )
}

export default SignIn