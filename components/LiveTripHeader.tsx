import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { useWeather } from '../hooks/useWeather';
import { weatherService } from '../lib/services/weatherService';
import { Trip } from '../types/database';

interface LiveTripHeaderProps {
  trip: Trip;
  weather?: string; // Optional weather override (for backward compatibility)
}

export default function LiveTripHeader({ trip, weather: weatherOverride }: LiveTripHeaderProps) {
  const { weatherData, isLoading: isLoadingWeather } = useWeather(
    weatherOverride ? undefined : trip.destination
  );
  
  // Get weather icon
  const getWeatherIcon = () => {
    if (weatherData) {
      return weatherService.getWeatherEmoji(weatherData.icon);
    }
    return "🌤️"; // Default icon
  };

  // Get weather display string
  const getWeatherDisplay = () => {
    if (weatherOverride) {
      return weatherOverride;
    }
    
    if (isLoadingWeather) {
      return "Loading weather...";
    }
    
    if (weatherData) {
      return `${weatherData.temperature}°C, ${weatherData.description}`;
    }
    
    return "Weather unavailable";
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
                      <Text className="text-xs">{getWeatherIcon()}</Text>
                      <Text className="text-sm ml-1 font-UrbanistRegular text-white">{getWeatherDisplay()}</Text>
                  </View>
                  {trip.destination && (
                    <View className="flex-row items-center bg-white/10 rounded-lg px-2 py-1 border-[0.5px] border-white/20">
                        <Text className="text-xs">📍</Text>
                        <Text className="text-sm ml-1 font-UrbanistRegular text-white">{trip.destination}</Text>
                    </View>
                  )}
              </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
