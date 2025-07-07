import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { formatDayHeader } from '../lib/utils/dateUtils';
import { ItineraryItem } from '../types/database';

interface DailyItinerarySectionProps {
  date: string;
  items: ItineraryItem[];
  isExpanded: boolean;
  onToggle: (date: string) => void;
}

export default function DailyItinerarySection({ 
  date, 
  items, 
  isExpanded, 
  onToggle 
}: DailyItinerarySectionProps) {
  
  const animatedHeight = useSharedValue(isExpanded ? 1 : 0);
  const rotationValue = useSharedValue(isExpanded ? 1 : 0);

  // Update animation values when isExpanded changes
  React.useEffect(() => {
    animatedHeight.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
    rotationValue.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded]);

  // Animated styles
  const animatedContentStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animatedHeight.value,
      [0, 1],
      [0, items.length * 80 + 20], // Approximate height based on items
      Extrapolate.CLAMP
    );
    
    return {
      height,
      opacity: animatedHeight.value,
    };
  });

  const animatedArrowStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      rotationValue.value,
      [0, 1],
      [0, 180],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Format the day header
  const dayHeader = formatDayHeader(date);
  
  // Handle toggle
  const handleToggle = () => {
    onToggle(date);
  };

  return (
    <View className="mb-2">
      {/* Day Header - Clickable */}
      <TouchableOpacity
        onPress={handleToggle}
        className="flex-row items-center justify-between px-4 py-4 bg-secondaryBG/50 rounded-lg"
      >
        <Text className="text-primaryFont font-UrbanistSemiBold text-lg">
          {dayHeader}
        </Text>
        
        <View className="flex-row items-center">
          {/* Item count */}
          {items.length > 0 && (
            <Text className="text-secondaryFont text-sm mr-3">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Text>
          )}
          
          {/* Dropdown arrow */}
          <Animated.View style={animatedArrowStyle}>
            <Text className="text-secondaryFont text-lg">▼</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Animated Content */}
      <Animated.View 
        style={[animatedContentStyle, { overflow: 'hidden' }]}
        className="px-4"
      >
        {items.length > 0 ? (
          <View className="py-2">
            {items.map((item, index) => (
              <ItineraryItemCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View className="py-6 items-center">
            <Text className="text-secondaryFont text-sm">
              No activities planned for this day
            </Text>
            <TouchableOpacity 
              className="mt-2 px-4 py-2 bg-accentFont/20 rounded-lg"
              onPress={() => console.log('Add activity for', date)}
            >
              <Text className="text-accentFont text-sm font-UrbanistSemiBold">
                + Add Activity
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// Individual itinerary item card
interface ItineraryItemCardProps {
  item: ItineraryItem;
}

function ItineraryItemCard({ item }: ItineraryItemCardProps) {
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'restaurant': return '🍽️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      case 'transport': return '🚗';
      case 'flight': return '✈️';
      default: return '📍';
    }
  };

  // Format time display
  const formatTime = (time?: string) => {
    if (!time) return '';
    
    // If time is in HH:MM format, convert to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <TouchableOpacity 
      className="flex-row items-center p-3 mb-2 bg-primaryBG/50 rounded-lg border border-border/30"
      onPress={() => console.log('View item:', item.id)}
    >
      {/* Category Icon */}
      <View className="w-10 h-10 rounded-full bg-accentFont/20 items-center justify-center mr-3">
        <Text className="text-lg">{getCategoryIcon(item.category)}</Text>
      </View>
      
      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          {item.time && (
            <Text className="text-secondaryFont text-xs font-UrbanistSemiBold mr-2">
              {formatTime(item.time)}
            </Text>
          )}
          <Text className="text-primaryFont font-UrbanistSemiBold text-base flex-1">
            {item.title}
          </Text>
        </View>
        
        {item.description && (
          <Text className="text-secondaryFont text-sm" numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        {item.location && (
          <Text className="text-secondaryFont/70 text-xs mt-1">
            📍 {item.location}
          </Text>
        )}
      </View>
      
      {/* Priority indicator */}
      {item.priority === 'high' && (
        <View className="w-2 h-2 rounded-full bg-red-500 ml-2" />
      )}
    </TouchableOpacity>
  );
}
