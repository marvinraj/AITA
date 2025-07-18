import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';

interface RecommendationItem {
  name: string;
  description: string;
  rating: number;
  priceLevel: string;
  location: string;
  highlights: string[];
  googleMapsQuery: string;
}

interface RecommendationCardProps {
  item: RecommendationItem;
  onAddToItinerary: (item: RecommendationItem) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  item, 
  onAddToItinerary 
}) => {
  
  const handleViewOnMaps = async () => {
    try {
      const encodedQuery = encodeURIComponent(item.googleMapsQuery);
      const url = `https://www.google.com/maps/search/${encodedQuery}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open maps application');
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Failed to open maps');
    }
  };

  const handleAddToItinerary = () => {
    onAddToItinerary(item);
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar) stars += '✨';
    return stars;
  };

  const getPriceLevelColor = (priceLevel: string) => {
    switch (priceLevel) {
      case '$': return 'text-green-500';
      case '$$': return 'text-yellow-500';
      case '$$$': return 'text-orange-500';
      case '$$$$': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <View className="bg-secondaryBG rounded-xl p-4 mb-3 border border-border">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-primaryFont font-semibold text-lg" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-secondaryFont text-sm">
            📍 {item.location}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-primaryFont/60">
            {getRatingStars(item.rating)} {item.rating}
          </Text>
          <Text className={`text-sm font-bold ${getPriceLevelColor(item.priceLevel)}`}>
            {item.priceLevel}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-primaryFont text-sm mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      {/* Highlights */}
      <View className="flex-row flex-wrap mb-3">
        {item.highlights.slice(0, 3).map((highlight, index) => (
          <View key={index} className="bg-inputBG rounded-full px-2 py-1 mr-2 mb-1">
            <Text className="text-secondaryFont text-xs">
              {highlight}
            </Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View className="flex-row gap-4">
        <TouchableOpacity
          onPress={handleViewOnMaps}
          className="flex-1 bg-blue-600 rounded-lg py-3 px-3 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons 
            name="map-outline" 
            size={16} 
            color={'white'} 
            style={{ marginRight: 6 }}
          />
          <Text className="text-white text-center font-medium text-sm">
            View on Maps
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleAddToItinerary}
          className="flex-1 bg-green-600 rounded-lg py-3 px-3 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons 
            name="add-circle" 
            size={16} 
            color={'white'} 
            style={{ marginRight: 6 }}
          />
          <Text className="text-white text-center font-medium text-sm">
            Add to Trip
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
