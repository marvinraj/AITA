import { Link } from 'expo-router'
import React from 'react'
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

const SignUp = () => {
  return (
    <ScrollView className="flex-1 bg-primaryBG px-6" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
      <View className="items-center mt-10 mb-8">
        <Image
          source={require('../../assets/images/logo.png')}
          className="w-20 h-20 mb-2"
          resizeMode="contain"
          accessibilityLabel="AITA Logo"
        />
        <Text className="text-2xl text-primaryFont text-center font-BellezaRegular">Welcome to AITA.</Text>
      </View>
      <View className="flex-1 items-center justify-center w-full">
        <View className="w-full mb-6" style={{maxWidth: 400}}>
          <Text className="text-primaryFont text-sm mb-2 font-InterRegular">Name</Text>
          <TextInput
            placeholder="Enter name"
            placeholderTextColor="#666"
            className="bg-inputBG focus:border-primaryFont rounded-full px-6 py-5 mb-5 text-primaryFont text-base font-InterRegular"
          />
          <Text className="text-primaryFont text-sm mb-2 font-InterRegular">Email</Text>
          <TextInput
            placeholder="Enter email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-inputBG focus:border-primaryFont rounded-full px-6 py-5 mb-5 text-primaryFont text-base font-InterRegular"
          />
          <Text className="text-primaryFont text-sm mb-2 font-InterRegular">Password</Text>
          <TextInput
            placeholder="Enter password"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-inputBG focus:border-primaryFont rounded-full px-6 py-5 mb-2 text-primaryFont text-base font-InterRegular"
          />
        </View>
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity className="bg-buttonPrimary w-full px-6 py-5 rounded-full shadow-lg active:opacity-80 mb-4 mt-4" style={{maxWidth: 400}}>
            <Text className="font-BellezaRegular text-lg text-center">Sign Up</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity className="bg-transparent w-full px-6 py-4 rounded-full mb-2 flex-row justify-center items-center" style={{maxWidth: 400}}>
            <Text className="text-secondaryFont font-InterRegular text-base text-center">
              Already have an account?{' '}
              <Text className="underline text-primaryFont font-BellezaRegular text-lg">Log in</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  )
}

export default SignUp