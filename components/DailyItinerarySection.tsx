import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { getCategoryIcon } from '../constants/categories';
import { itineraryService } from '../lib/services/itineraryService';
import { formatDayHeader } from '../lib/utils/dateUtils';
import { ItineraryItem } from '../types/database';
import ActivityDetailModal from './ActivityDetailModal';
import AddActivityModal from './AddActivityModal';

interface DailyItinerarySectionProps {
  date: string;
  items: ItineraryItem[];
  isExpanded: boolean;
  onToggle: (date: string) => void;
  tripId: string;
  onActivityAdded: () => void;
}

export default function DailyItinerarySection({ 
  date, 
  items, 
  isExpanded, 
  onToggle,
  tripId,
  onActivityAdded
}: DailyItinerarySectionProps) {
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ItineraryItem | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<string | null>(null); // Track which activity is being deleted
  const animatedHeight = useSharedValue(isExpanded ? 1 : 0);
  const rotationValue = useSharedValue(isExpanded ? 1 : 0);

  // Update animation values when isExpanded changes
  React.useEffect(() => {
    animatedHeight.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
    rotationValue.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded]);

  // Animated styles - using max-height approach for better flexibility
  const animatedContentStyle = useAnimatedStyle(() => {
    // Instead of calculating exact height, use a large max-height that shrinks to 0
    const maxHeight = 2000; // Large enough for any reasonable number of activities
    
    const height = interpolate(
      animatedHeight.value,
      [0, 1],
      [0, maxHeight],
      Extrapolate.CLAMP
    );
    
    return {
      maxHeight: height,
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

  // Handle add activity
  const handleAddActivity = () => {
    setShowAddModal(true);
  };

  // Handle activity added
  const handleActivityAdded = () => {
    onActivityAdded();
    setShowAddModal(false);
  };

  // Handle activity tap
  const handleActivityTap = (activity: ItineraryItem) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  // Handle activity delete
  const handleActivityDelete = async (activityId: string) => {
    setDeletingActivity(activityId); // Set loading state
    try {
      await itineraryService.deleteItineraryItem(activityId);
      onActivityAdded(); // Refresh the list
      Alert.alert('Success', 'Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity. Please try again.');
    } finally {
      setDeletingActivity(null); // Clear loading state
    }
  };

  // Handle detail modal close
  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedActivity(null);
  };

  return (
    <View className="mb-4">
      {/* Day Header - Clickable */}
      <TouchableOpacity
        onPress={handleToggle}
        className="flex-row items-center justify-between px-4 py-6 rounded-3xl"
      >
        <Text className="text-primaryFont font-UrbanistSemiBold text-2xl">
          {dayHeader}
        </Text>
        
        <View className="flex-row items-center">
          {/* Item count */}
          {items.length > 0 && (
            <Text className="text-secondaryFont text-sm mr-3">
              {items.length} {items.length === 1 ? 'activity' : 'activities'}
            </Text>
          )}
          
          {/* Dropdown arrow */}
          <Animated.View style={animatedArrowStyle}>
            <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.6)" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Animated Content */}
      <Animated.View 
        style={[animatedContentStyle, { overflow: 'hidden' }]}
        className="px-4"
      >
        <View className={`${isExpanded ? 'block' : 'hidden'}`}>
          {items.length > 0 ? (
            <View className="py-2">
              {items.map((item, index) => (
                <View key={item.id} className="flex-row items-start">
                  {/* Timeline indicator */}
                  <View className="items-center mr-3 mt-1">
                    {/* Number circle */}
                    <View className="w-6 h-6 rounded-full bg-[#311010] items-center justify-center">
                      <Text className="text-primaryFont/50 text-xs font-UrbanistSemiBold">
                        {index + 1}
                      </Text>
                    </View>
                    
                    {/* Connecting line - only show if not the last item */}
                    {index < items.length - 1 && (
                      <View className="w-0.5 h-16 bg-[#311010] mt-2" />
                    )}
                  </View>
                  
                  {/* Activity card - modified to work with timeline */}
                  <View className="flex-1">
                    <ItineraryItemCard 
                      item={item} 
                      onPress={() => handleActivityTap(item)}
                      onDelete={() => handleActivityDelete(item.id)}
                      isDeleting={deletingActivity === item.id}
                    />
                  </View>
                </View>
              ))}
              
              {/* Add Activity Button - Always visible when expanded */}
              <TouchableOpacity 
                className="mt-3 mb-1 px-4 py-3 bg-transparent rounded-lg border border-border flex-row items-center justify-center"
                onPress={handleAddActivity}
                activeOpacity={0.7}
              >
                <Text className="text-primaryFont text-sm font-UrbanistSemiBold">
                  + Add Activity
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="py-6 items-center">
              <Text className="text-secondaryFont text-sm">
                No activities planned for this day
              </Text>
              <TouchableOpacity 
                className="mt-3 px-4 py-3 bg-transparent border border-border rounded-lg"
                onPress={handleAddActivity}
                activeOpacity={0.7}
              >
                <Text className="text-primaryFont text-sm font-UrbanistSemiBold">
                  + Add Activity
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
      
      {/* Add Activity Modal */}
      <AddActivityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        date={date}
        tripId={tripId}
        onActivityAdded={handleActivityAdded}
      />
      
      {/* Activity Detail Modal */}
      <ActivityDetailModal
        visible={showDetailModal}
        onClose={handleDetailModalClose}
        activity={selectedActivity}
        onActivityDeleted={handleActivityAdded} // Reuse the refresh callback
      />
    </View>
  );
}

// Individual itinerary item card
interface ItineraryItemCardProps {
  item: ItineraryItem;
  onPress?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function ItineraryItemCard({ item, onPress, onDelete, isDeleting = false }: ItineraryItemCardProps) {
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

  // Handle long press for context menu
  const handleLongPress = () => {
    Alert.alert(
      'Activity Options',
      `What would you like to do with "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Details', 
          onPress: () => onPress?.()
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Activity',
              `Are you sure you want to delete "${item.title}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => onDelete?.()
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      className={`flex-row items-center p-3 mb-2 bg-primaryBG/50 rounded-lg border border-border/30 ${
        isDeleting ? 'opacity-50' : ''
      }`}
      onPress={isDeleting ? undefined : onPress || (() => console.log('View item:', item.id))}
      onLongPress={isDeleting ? undefined : handleLongPress}
      activeOpacity={0.7}
      disabled={isDeleting}
    >
      {/* Category Icon */}
      <View className="w-10 h-10 rounded-full bg-secondaryBG/70 items-center justify-center mr-3">
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

        {/* Show deleting indicator */}
        {isDeleting && (
          <Text className="text-red-500 text-xs mt-1 font-UrbanistSemiBold">
            Deleting...
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
