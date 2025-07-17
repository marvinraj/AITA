import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { useWeather } from '../hooks/useWeather';
import { DestinationImage, imageService } from '../lib/services/imageService';
import { weatherService } from '../lib/services/weatherService';
import { Trip } from '../types/database';
import EditTripModal from './EditTripModal';

interface LiveTripHeaderProps {
  trip: Trip;
  weather?: string; // Optional weather override (for backward compatibility)
  onTripUpdate?: (updatedTrip: Trip) => void; // Callback for when trip is updated
}

export default function LiveTripHeader({ trip, weather: weatherOverride, onTripUpdate }: LiveTripHeaderProps) {
  const { weatherData, isLoading: isLoadingWeather } = useWeather(
    weatherOverride ? undefined : trip.destination
  );
  
  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Destination image state
  const [destinationImage, setDestinationImage] = useState<DestinationImage | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Load destination image
  useEffect(() => {
    const loadDestinationImage = async () => {
      if (trip.destination) {
        setImageLoading(true);
        try {
          const image = await imageService.getDestinationImage(trip.destination);
          setDestinationImage(image);
        } catch (error) {
          console.error('Error loading destination image:', error);
        } finally {
          setImageLoading(false);
        }
      } else {
        setImageLoading(false);
      }
    };

    loadDestinationImage();
  }, [trip.destination]);
  
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

  // Handle edit trip
  const handleEditTrip = () => {
    setShowEditModal(true);
  };

  // Handle trip update from modal
  const handleTripUpdate = (updatedTrip: Trip) => {
    if (onTripUpdate) {
      onTripUpdate(updatedTrip);
    }
  };
  return (
    <View className="my-2">
      {/* Background Image Container */}
      <View 
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        {destinationImage && !imageLoading ? (
          <ImageBackground
            source={{ uri: destinationImage.url }}
            style={{
              paddingVertical: 24,
              paddingHorizontal: 16,
            }}
            imageStyle={{
              borderRadius: 16,
            }}
          >
            {/* dark left to transparent right */}
            <LinearGradient
              colors={[
                'rgba(20, 5, 10, 0.95)',  // Very dark left
                'rgba(45, 9, 20, 0.8)',   // Dark left-center
                'rgba(74, 26, 43, 0.6)',  // Medium center
                'rgba(0, 0, 0, 0.3)',     // Light right-center
                'rgba(0, 0, 0, 0)'        // Transparent right
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />
            
            {/* Content */}
            <View className="flex-row items-center justify-between relative z-10">
              <View className="flex-1 justify-between">
                  {/* date and 3 dots - same row */}
                  <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-UrbanistSemiBold tracking-wide text-primaryFont/40">
                        {trip.status === 'active' ? formatCurrentDate() : formatTripDates()}
                      </Text>
                      <TouchableOpacity
                        onPress={handleEditTrip}
                        className="p-2 -mr-2 -mt-2"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255, 255, 255, 0.6)" />
                      </TouchableOpacity>
                  </View>
                  {/* trip name */}
                  <Text className="text-4xl font-UrbanistSemiBold mb-4 text-[#ECDFCC]">{trip.name}</Text>
                  {/* weather, location */}
                  <View className="flex-row items-center">
                      <View className="flex-row items-center mr-2 bg-primaryFont/20 rounded-lg px-3 py-1">
                          <Text className="text-xs">{getWeatherIcon()}</Text>
                          <Text className="text-sm ml-1 font-UrbanistRegular text-primaryFont/80">{getWeatherDisplay()}</Text>
                      </View>
                      {trip.destination && (
                        <View className="flex-row items-center bg-primaryFont/20 rounded-lg px-3 py-1">
                            <Text className="text-xs">📍</Text>
                            <Text className="text-sm ml-1 font-UrbanistRegular text-primaryFont/80">{trip.destination}</Text>
                        </View>
                      )}
                  </View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          // Fallback to gradient while loading or if no image
          <LinearGradient
            colors={['#4a1a2b', '#3d1623', '#2d0914', '#1f0509']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              paddingVertical: 24,
              paddingHorizontal: 16,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 justify-between">
                  {/* date and 3 dots - same row */}
                  <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-UrbanistSemiBold tracking-wide text-primaryFont/40">
                        {trip.status === 'active' ? formatCurrentDate() : formatTripDates()}
                      </Text>
                      <TouchableOpacity
                        onPress={handleEditTrip}
                        className="p-2 -mr-2 -mt-2"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255, 255, 255, 0.6)" />
                      </TouchableOpacity>
                  </View>
                  {/* trip name */}
                  <Text className="text-4xl font-UrbanistSemiBold mb-4 text-[#ECDFCC]">{trip.name}</Text>
                  {/* weather, location */}
                  <View className="flex-row items-center">
                      <View className="flex-row items-center mr-2 bg-primaryFont/20 rounded-lg px-3 py-1">
                          <Text className="text-xs">{getWeatherIcon()}</Text>
                          <Text className="text-sm ml-1 font-UrbanistRegular text-primaryFont/80">{getWeatherDisplay()}</Text>
                      </View>
                      {trip.destination && (
                        <View className="flex-row items-center bg-primaryFont/20 rounded-lg px-3 py-1">
                            <Text className="text-xs">📍</Text>
                            <Text className="text-sm ml-1 font-UrbanistRegular text-primaryFont/80">{trip.destination}</Text>
                        </View>
                      )}
                  </View>
              </View>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* Edit Trip Modal */}
      <EditTripModal
        visible={showEditModal}
        trip={trip}
        onClose={() => setShowEditModal(false)}
        onTripUpdate={handleTripUpdate}
      />
    </View>
  );
}
