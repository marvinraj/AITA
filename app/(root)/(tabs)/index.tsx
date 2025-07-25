import FutureTripsTab from '@/components/FutureTripsTab';
import LiveTripTab from '@/components/LiveTripTab';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Trip } from '../../../types/database';

export default function HomeScreen() {
  const router = useRouter();

  // state to manage the active tab
  const [activeTab, setActiveTab] = useState<'live' | 'future'>('live');
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  // Reset to live tab when screen is focused (when home tab is pressed)
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('live');
    }, [])
  );

  // Handle chat button press
  const handleChatPress = () => {
    if (currentTrip) {
      // Pass trip data as navigation params to help with context
      router.push({
        pathname: '/chatAI',
        params: {
          tripId: currentTrip.id,
          tripName: currentTrip.name,
          destination: currentTrip.destination,
          startDate: currentTrip.start_date,
          endDate: currentTrip.end_date,
          companions: currentTrip.companions,
          activities: currentTrip.activities,
          budget: currentTrip.budget
        }
      });
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
      {/* Fixed tabs at the top */}
      <View className="bg-primaryBG px-5 pt-8 pb-4">
        <View className="flex-row items-center justify-center">
          <TouchableOpacity
            className={`flex justify-center items-center h-14 px-4 py-2 rounded-full mr-2 ${activeTab === 'live' ? 'bg-secondaryBG' : ''}`}
            onPress={() => setActiveTab('live')}
          >
            <Text className={`font-UrbanistSemiBold text-sm text-center ${activeTab === 'live' ? 'text-primaryFont' : 'text-secondaryFont'}`}>Live Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex justify-center items-center h-14 px-4 py-2 rounded-full ${activeTab === 'future' ? 'bg-secondaryBG' : ''}`}
            onPress={() => setActiveTab('future')}
          >
            <Text className={`font-UrbanistSemiBold text-sm text-center ${activeTab === 'future' ? 'text-primaryFont' : 'text-secondaryFont'}`}>Future Trips</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView 
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* tab content */}
        {activeTab === 'live' ? 
          <LiveTripTab 
            onTripChange={setCurrentTrip}
            onChatPress={handleChatPress}
            onMapPress={handleMapPress}
          /> : <FutureTripsTab />
        }
      </ScrollView>

      {/* Floating AI Chat Button - Bottom Right (only show for live tab) */}
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
          {/* AI Chat button */}
          <TouchableOpacity onPress={handleChatPress}>
            <View style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#fff', // fff,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 15,
            }}>
              <LinearGradient
                colors={['#16213e', '#EF4444']} 
                // '#16213e', '#EF4444'
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
                <Ionicons name="sparkles" size={21} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
