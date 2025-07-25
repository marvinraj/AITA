import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Text, TouchableOpacity, View } from 'react-native';

interface RecommendationItem {
  name: string;
  description: string;
  rating: number;
  priceLevel: string;
  location: string;
  highlights: string[];
  googleMapsQuery: string;
  imageUrl?: string; // URL to image (from Places API, Unsplash, etc.)
  imageCategory?: string; // 'restaurant', 'attraction', 'hotel' for fallback images
}

interface RecommendationCardProps {
  item: RecommendationItem;
  onAddToItinerary: (item: RecommendationItem) => void;
  isLoadingPhoto?: boolean;
  showImage?: boolean; // New prop to control image display
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  item, 
  onAddToItinerary,
  isLoadingPhoto = false,
  showImage = true // Default to showing images
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

  // Fallback images based on category
  const getFallbackImage = (category?: string) => {
    const fallbackImages = {
      restaurant: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop',
      cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop',
      attraction: 'https://images.unsplash.com/photo-1539650116574-75c0c6d0c6b4?w=300&h=200&fit=crop',
      hotel: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=300&h=200&fit=crop',
      activity: 'https://images.unsplash.com/photo-1539650116574-75c0c6d0c6b4?w=300&h=200&fit=crop',
      default: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop'
    };
    
    return fallbackImages[category as keyof typeof fallbackImages] || fallbackImages.default;
  };

  const getImageSource = () => {
    if (item.imageUrl) {
      return { uri: item.imageUrl };
    }
    return { uri: getFallbackImage(item.imageCategory) };
  };

  const [imageLoading, setImageLoading] = useState(true);

  return (
    <View className="bg-secondaryBG rounded-xl mb-3 border border-border overflow-hidden">
      {/* Image Header - only show if showImage is true */}
      {showImage && (
        <View className="relative">
          <Image 
            source={getImageSource()}
            className="w-full h-32"
            resizeMode="cover"
            defaultSource={{ uri: getFallbackImage('default') }}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          
          {/* Loading overlay - only show if specifically loading photos from API */}
          {isLoadingPhoto && (
            <View className="absolute inset-0 bg-gray-200/80 items-center justify-center">
              <ActivityIndicator size="small" color="#666" />
              <Text className="text-xs text-gray-600 mt-1">Loading photo...</Text>
            </View>
          )}
          
          {/* Image loading overlay - for normal image loading */}
          {imageLoading && !isLoadingPhoto && (
            <View className="absolute inset-0 bg-gray-200/50 items-center justify-center">
              <ActivityIndicator size="small" color="#999" />
            </View>
          )}
          
          {/* Real photo indicator */}
          {item.imageUrl && !isLoadingPhoto && !imageLoading && (
            <View className="absolute top-2 right-2 bg-green-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-medium">📸 Real</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Content Container */}
      <View className="p-4">
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
    </View>
  );
};
