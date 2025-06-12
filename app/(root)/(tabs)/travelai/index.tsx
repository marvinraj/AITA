import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from "react-native";

const TravelAI = () => {
  return (
    <View className="flex-1 bg-primaryBG items-center justify-center px-6">
      {/* header/title */}
      <Text className="text-5xl font-BellezaRegular text-primaryFont mb-4">Plan a New Trip</Text>
      {/* description */}
      <Text className="text-base font-InterRegular text-secondaryFont mb-8 text-center">Choose how you want to plan your trip. You can plan everything yourself or let AITA help you!</Text>
      {/* 2 buttons */}
      <View className="w-full gap-4">
        {/* manual button */}
        <Link href={'/travelai/manual'} asChild>
          <TouchableOpacity className="flex-row items-center bg-buttonPrimaryBG rounded-2xl px-5 py-6 mb-2 w-full shadow-md">
            <View className="bg-[#2D2D30] rounded-full p-3 mr-4">
              <Text className="text-xl">📝</Text> 
            </View>
            <View className="flex-1">
              <Text className="text-primaryFont font-semibold text-lg">Build Your Own</Text>
              <Text className="text-secondaryFont text-sm">Plan everything yourself</Text>
            </View>
            <Text className="text-secondaryFont text-2xl">›</Text>
          </TouchableOpacity>
        </Link>
        {/* ai button */}
        <Link href={'/travelai/chatAI'} asChild>
          <TouchableOpacity className="flex-row items-center bg-buttonPrimaryBG rounded-2xl px-5 py-6 w-full shadow-md">
            <View className="bg-[#2D2D30] rounded-full p-3 mr-4">
              <Text className="text-xl">🤖</Text>
            </View>
            <View className="flex-1">
              <Text className="text-primaryFont font-semibold text-lg">AI-Powered Plan</Text>
              <Text className="text-secondaryFont text-sm">Let AITA help you plan</Text>
            </View>
            <Text className="text-secondaryFont text-2xl">›</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
}

export default TravelAI