import React from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getCategoryById, getCategoryIcon } from '../constants/categories';
import { ItineraryItem } from '../types/database';

interface ActivityDetailModalProps {
  visible: boolean;
  onClose: () => void;
  activity: ItineraryItem | null;
}

export default function ActivityDetailModal({ 
  visible, 
  onClose, 
  activity 
}: ActivityDetailModalProps) {
  
  if (!activity) return null;

  // Format time display
  const formatTime = (time?: string) => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const category = getCategoryById(activity.category);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-primaryBG">
        {/* Header */}
        <View className="pt-12 px-4 pb-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-UrbanistSemiBold text-primaryFont">
              Activity Details
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-2xl text-secondaryFont">✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 pt-6">
          {/* Activity Header */}
          <View className="bg-secondaryBG/50 rounded-lg p-4 mb-6">
            <View className="flex-row items-center mb-3">
              {/* Category Icon */}
              <View className="w-12 h-12 rounded-full bg-accentFont/20 items-center justify-center mr-3">
                <Text className="text-xl">{getCategoryIcon(activity.category)}</Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                  {activity.title}
                </Text>
                {category && (
                  <Text className="text-secondaryFont text-sm">
                    {category.label}
                  </Text>
                )}
              </View>
              
              {/* Priority indicator */}
              {activity.priority === 'high' && (
                <View className="bg-red-500/20 px-2 py-1 rounded-full">
                  <Text className="text-red-500 text-xs font-UrbanistSemiBold">
                    High Priority
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Details Section */}
          <View className="space-y-4">
            {/* Date & Time */}
            <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
              <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                📅 When
              </Text>
              <Text className="text-secondaryFont">
                {formatDate(activity.date)}
              </Text>
              {activity.time && (
                <Text className="text-secondaryFont">
                  at {formatTime(activity.time)}
                </Text>
              )}
            </View>

            {/* Location */}
            {activity.location && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  📍 Location
                </Text>
                <Text className="text-secondaryFont">
                  {activity.location}
                </Text>
              </View>
            )}

            {/* Description */}
            {activity.description && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  📝 Description
                </Text>
                <Text className="text-secondaryFont leading-5">
                  {activity.description}
                </Text>
              </View>
            )}

            {/* Duration */}
            {activity.duration && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  ⏱️ Duration
                </Text>
                <Text className="text-secondaryFont">
                  {activity.duration} minutes
                </Text>
              </View>
            )}

            {/* Cost */}
            {activity.cost && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  💰 Cost
                </Text>
                <Text className="text-secondaryFont">
                  {activity.currency || 'USD'} {activity.cost}
                </Text>
              </View>
            )}

            {/* Notes */}
            {activity.notes && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  💭 Notes
                </Text>
                <Text className="text-secondaryFont leading-5">
                  {activity.notes}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mt-8 mb-6 space-y-3">
            <TouchableOpacity 
              className="bg-accentFont rounded-xl py-3 items-center"
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Implement edit functionality
                console.log('Edit activity:', activity.id);
              }}
            >
              <Text className="text-primaryBG font-UrbanistSemiBold">
                Edit Activity
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-red-500/20 rounded-xl py-3 mt-3 items-center border border-red-500/30"
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Implement delete functionality
                console.log('Delete activity:', activity.id);
              }}
            >
              <Text className="text-red-500 font-UrbanistSemiBold">
                Delete Activity
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
