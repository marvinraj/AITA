import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Trip } from '../types/database';

interface LiveTripHeaderProps {
  trip: Trip;
  weather?: string; // Optional weather override
}

export default function LiveTripHeader({ trip, weather = "Sunny, 25°C" }: LiveTripHeaderProps) {
  const router = useRouter();
  
  // Handle chat button press
  const handleChatPress = () => {
    router.push(`/chatAI?tripId=${trip.id}`);
  };

  // Handle map button press
  const handleMapPress = () => {
    // @ts-ignore - Router types not updated yet for new map route
    router.push(`/map?tripId=${trip.id}`);
  };
  // Format trip dates for display
  const formatTripDates = () => {
    if (trip.start_date && trip.end_date) {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' });
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
      const year = startDate.getFullYear();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${year}`;
      } else {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${year}`;
      }
    }
    return 'Dates not set';
  };

  const formatCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };
  return (
    <View className="my-1">
      <LinearGradient
        colors={['#4a1a2b', '#3d1623', '#2d0914', '#1f0509']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          paddingVertical: 24,
          paddingHorizontal: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 justify-between">
              {/* date */}
              <View className="flex-row items-center">
                  {/* <Text className="text-sm">📅</Text> */}
                  <Text className="text-sm font-UrbanistSemiBold tracking-wide text-white/80 mb-1">
                    {trip.status === 'active' ? formatCurrentDate() : formatTripDates()}
                  </Text>
              </View>
              {/* trip name */}
              <Text className="text-4xl font-UrbanistSemiBold mb-4 text-white">{trip.name}</Text>
              {/* weather, location */}
              <View className="flex-row items-center">
                  <View className="flex-row items-center mr-2 bg-white/10 rounded-lg px-2 py-1 border-[0.5px] border-white/20">
                      <Text className="text-xs">☀️</Text>
                      <Text className="text-sm ml-1 font-UrbanistRegular text-white">{weather}</Text>
                  </View>
                  {trip.destination && (
                    <View className="flex-row items-center bg-white/10 rounded-lg px-2 py-1 border-[0.5px] border-white/20">
                        <Text className="text-xs">📍</Text>
                        <Text className="text-sm ml-1 font-UrbanistRegular text-white">{trip.destination}</Text>
                    </View>
                  )}
              </View>
          </View>
          {/* Action buttons */}
          <View className="flex-row items-center space-x-3">
              {/* Map button */}
              <TouchableOpacity onPress={handleMapPress}>
                <LinearGradient
                  colors={['#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                      width: 70,
                      height: 75,
                      borderRadius: 32,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 6,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                  }}
                >
                  <Text className="text-2xl">🗺️</Text>
                  <Text className="text-xs text-white font-UrbanistSemiBold">Map</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* AI Chat button */}
              <TouchableOpacity onPress={handleChatPress}>
                <LinearGradient
                  colors={['#e55555', '#cc1e1e', '#a01a1a', '#801515']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                      width: 70,
                      height: 75,
                      borderRadius: 32,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 6,
                      justifyContent: 'center',
                      alignItems: 'center',
                  }}
                >
                  {/* <Text className="text-3xl">🤖</Text> */}
                  <Text className="text-sm text-primaryFont/70 font-UrbanistSemiBold">AITA</Text>
                </LinearGradient>
              </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
