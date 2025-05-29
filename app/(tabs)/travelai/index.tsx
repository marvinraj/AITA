import { View, Text, TouchableOpacity } from "react-native";
import { Link } from 'expo-router';
import React from 'react';

const travelAI = () => {
  return (
    <View className="flex-1 bg-primaryBG items-center justify-center">
      <Link href={'/(tabs)/travelai/chatAI'} asChild>
        <TouchableOpacity className="bg-accentFont px-5 py-3 rounded-lg">
          <Text className="text-primaryFont font-semibold text-base">Open AITA Chat</Text>
        </TouchableOpacity>
      </Link>
    </View>
  )
}

export default travelAI