import FutureTripsTab from '@/components/FutureTripsTab';
import LiveTripTab from '@/components/LiveTripTab';
import { icons } from '@/constants/icons';
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {

  // state to manage the active tab
  const [activeTab, setActiveTab] = useState<'live' | 'future'>('live');

  return (
      <ScrollView 
        className="flex-1 px-5 bg-primaryBG"
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ minHeight: '100%', paddingBottom: 10 }}
      >
        {/* main header --> should i remove this? */}
        <View className="flex-row items-center mb-5">
          <Image source={icons.logo} className="w-10 h-10"/>
          <Text className="text-primaryFont text-lg ml-2 font-BellezaRegular">AITA.</Text>
        </View>
        {/* live travel & future travels tabs */}
        <View className="flex-row items-center justify-center mb-6">
          <TouchableOpacity
            className={`flex justify-center items-center h-14 px-4 py-2 rounded-full mr-2 ${activeTab === 'live' ? 'bg-secondaryBG' : ''}`}
            onPress={() => setActiveTab('live')}
          >
            <Text className={`font-UrbanistSemiBold text-sm text-center ${activeTab === 'live' ? 'text-primaryFont' : 'text-secondaryFont'}`}>Live Travel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex justify-center items-center h-14 px-4 py-2 rounded-full ${activeTab === 'future' ? 'bg-secondaryBG' : ''}`}
            onPress={() => setActiveTab('future')}
          >
            <Text className={`font-UrbanistSemiBold text-sm text-center ${activeTab === 'future' ? 'text-primaryFont' : 'text-secondaryFont'}`}>Future Travels</Text>
          </TouchableOpacity>
        </View>
        {/* tab content */}
        {activeTab === 'live' ? 
          <LiveTripTab /> : <FutureTripsTab />
        }
      </ScrollView>
  );
}
