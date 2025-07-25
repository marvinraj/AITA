import React from 'react';
import { Text, View } from 'react-native';
import { RecommendationCard } from './RecommendationCard';

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

interface StructuredData {
  type: 'recommendations';
  category: string;
  items: RecommendationItem[];
  responseText: string;
}

interface StructuredResponseProps {
  data: StructuredData;
  onAddToItinerary: (item: RecommendationItem) => void;
}

export const StructuredResponse: React.FC<StructuredResponseProps> = ({ 
  data, 
  onAddToItinerary 
}) => {
  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cafes': return '☕';
      case 'restaurants': return '🍽️';
      case 'attractions': return '🎯';
      case 'hotels': return '🏨';
      case 'activities': return '🎪';
      default: return '📍';
    }
  };

  return (
    <View className="w-full">
      {/* Response text */}
      {data.responseText && (
        <Text className="text-primaryFont text-base mb-4">
          {data.responseText}
        </Text>
      )}
      
      {/* Category header */}
      <View className="flex-row items-center mb-3">
        <Text className="text-lg mr-2">{getCategoryEmoji(data.category)}</Text>
        <Text className="text-primaryFont font-semibold text-lg capitalize">
          {data.category} Recommendations
        </Text>
      </View>
      
      {/* Recommendation cards */}
      <View>
        {data.items.map((item, index) => (
          <RecommendationCard
            key={index}
            item={item}
            onAddToItinerary={onAddToItinerary}
            showImage={false}
          />
        ))}
      </View>
      
      {/* Footer tip */}
      <Text className="text-secondaryFont text-xs text-center mt-2">
        💡 Tap "View on Maps" for directions or "Add to Trip" to save to your itinerary
      </Text>
    </View>
  );
};
