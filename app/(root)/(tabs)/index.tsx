import FutureTripsTab from '@/components/FutureTripsTab';
import LiveTripTab from '@/components/LiveTripTab';
import { icons } from '@/constants/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../../../types/database';

export default function HomeScreen() {
  const router = useRouter();

  // state to manage the active tab
  const [activeTab, setActiveTab] = useState<'live' | 'future'>('live');
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  // Handle chat button press
  const handleChatPress = () => {
    if (currentTrip) {
      router.push(`/chatAI?tripId=${currentTrip.id}`);
    }
  };

  // Handle map button press
  const handleMapPress = () => {
    if (currentTrip) {
      // @ts-ignore - Router types not updated yet for new map route
      router.push(`/map?tripId=${currentTrip.id}`);
    }
  };

  return (
    <View className="flex-1 bg-primaryBG">
      <ScrollView 
        className="flex-1 px-5"
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
          <LiveTripTab 
            onTripChange={setCurrentTrip}
            onChatPress={handleChatPress}
            onMapPress={handleMapPress}
          /> : <FutureTripsTab />
        }
      </ScrollView>

      {/* Floating Action Buttons - Bottom Right (only show for live tab) */}
      {activeTab === 'live' && currentTrip && (
        <View style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* Map button */}
          <TouchableOpacity onPress={handleMapPress}>
            <LinearGradient
              colors={['#4B70F5', '#1D267D', '#03346E', '#021526']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 6,
                  justifyContent: 'center',
                  alignItems: 'center',
              }}
            >
              <Ionicons name="map" size={21} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          
          {/* AI Chat button */}
          <TouchableOpacity onPress={handleChatPress}>
            <View style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#7C3AED', // F7374F,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.45,
              shadowRadius: 8,
              elevation: 15,
            }}>
              <LinearGradient
                colors={['#22092C', '#321E1E', '#a01a1a', '#09122C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text className="text-sm text-white font-UrbanistSemiBold">AITA</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
