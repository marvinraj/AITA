import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";

const TravelAI = () => {
  useEffect(() => {
    console.log('TravelAI index page mounted');
  }, []);

  return (
    <ImageBackground
      source={require('../../../../assets/images/plantripbg6.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View className="flex-1 items-center justify-center px-6">
      {/* Plan Trip GIF */}
      <Image 
        source={require('../../../../assets/images/plan-trip2.gif')}
        style={{ width: 180, height: 180, marginBottom: 20 }}
        resizeMode="contain"
      />
      {/* header/title */}
      <Text className="text-5xl font-BellezaRegular text-primaryFont mb-4">Plan a New Trip</Text>
      {/* description */}
      <Text className="text-sm font-InterRegular text-primaryFont/65 mb-8 text-center">Let TRAVA help you create the perfect trip tailored to your preferences and interests!</Text>
      {/* 2 buttons */}
      <View className="w-full gap-4">
        {/* manual button -> need to alter the href soon*/}
        {/* <Link href={'/travelai/manual'} asChild>
          <TouchableOpacity className="flex-row items-center bg-primaryBG rounded-2xl px-5 py-6 mb-2 w-full shadow-md" style={{
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
            opacity: 0.65,
          }}>
            <View className="bg-inputBG rounded-full p-4 mr-4">
              <Ionicons name="create-outline" size={19} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-primaryFont font-semibold text-lg">Build Your Own</Text>
              <Text className="text-secondaryFont text-sm">Plan everything yourself</Text>
            </View>
            <Text className="text-secondaryFont text-2xl">›</Text>
          </TouchableOpacity>
        </Link> */}
        {/* ai button */}
        <Link href={'/travelai/smartForm'} asChild>
          <TouchableOpacity className="flex-row items-center bg-primaryBG rounded-2xl px-5 py-6 w-full shadow-md" style={{
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
            opacity: 0.8,
          }}>
            <LinearGradient
              colors={['#16213e', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 999,
                padding: 16,
                marginRight: 16,
              }}
            >
              <Ionicons name="sparkles" size={19} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-primaryFont font-semibold text-lg">AI-Powered Plan</Text>
              <Text className="text-secondaryFont text-sm">Let TRAVA help you plan</Text>
            </View>
            <Text className="text-secondaryFont text-2xl">›</Text>
          </TouchableOpacity>
        </Link>
      </View>
      </View>
    </ImageBackground>
  )
}

export default TravelAI