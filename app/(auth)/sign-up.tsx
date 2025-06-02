import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignUp = () => {
  return (
    <View className='flex-1 bg-primaryBG items-center justify-center'>
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ minHeight: '100%', paddingBottom: 10 }}
      >
        <Text className='text-fuchsia-50'>sign up screen</Text>
        <Link href={'/(auth)/sign-up'} asChild>
            <TouchableOpacity className="px-8 py-3 rounded-lg border-2 border-indigo-50">
                <Text className="text-primaryFont font-semibold text-base">Sign Up</Text>
            </TouchableOpacity>
        </Link>
        <Link href={'/(auth)/sign-in'} asChild>
            <TouchableOpacity className="px-8 py-3 rounded-lg border-2 border-indigo-50">
                <Text className="text-primaryFont font-semibold text-base">Log In</Text>
            </TouchableOpacity>
        </Link>
      </ScrollView>
    </View>
  )
}

export default SignUp