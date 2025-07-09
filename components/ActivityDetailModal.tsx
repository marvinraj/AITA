import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getCategoryById, getCategoryIcon } from '../constants/categories';
import { itineraryService } from '../lib/services/itineraryService';
import { ItineraryItem } from '../types/database';

// Get screen width for gallery
const { width: screenWidth } = Dimensions.get('window');

// Image Gallery Component
interface ImageGalleryProps {
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log('ImageGallery received images:', images?.length || 0, images);

  if (!images || images.length === 0) return null;

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const imageIndex = Math.round(contentOffset.x / (screenWidth - 32)); // 32 = padding
    setCurrentIndex(imageIndex);
  };

  return (
    <View className="mb-4">
      {/* Image ScrollView */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        className="rounded-lg"
      >
        {images.map((imageUrl, index) => (
          <View key={index} style={{ width: screenWidth - 32 }} className="pr-0">
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>
      
      {/* Image Counter & Dots */}
      {images.length > 1 && (
        <View className="mt-3">
          {/* Image Counter */}
          <View className="bg-black/70 self-center px-3 py-1 rounded-full mb-2">
            <Text className="text-white text-xs font-UrbanistSemiBold">
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
          
          {/* Dot Indicators */}
          <View className="flex-row justify-center space-x-2">
            {images.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-accentFont' : 'bg-secondaryFont/30'
                }`}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

interface ActivityDetailModalProps {
  visible: boolean;
  onClose: () => void;
  activity: ItineraryItem | null;
  onActivityDeleted?: () => void;
}

export default function ActivityDetailModal({ 
  visible, 
  onClose, 
  activity,
  onActivityDeleted 
}: ActivityDetailModalProps) {
  
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  // Handle delete activity
  const handleDeleteActivity = () => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDeleteActivity 
        }
      ]
    );
  };

  const confirmDeleteActivity = async () => {
    if (!activity) return;

    setIsDeleting(true);
    try {
      await itineraryService.deleteItineraryItem(activity.id);
      
      // Close modal and trigger refresh
      onClose();
      if (onActivityDeleted) {
        onActivityDeleted();
      }
      
      Alert.alert('Success', 'Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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

          {/* Activity Image Gallery */}
          {activity.image_url && (
            <ImageGallery 
              images={
                activity.photos && activity.photos.length > 0 
                  ? activity.photos 
                  : [activity.image_url]
              }
            />
          )}

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
              className={`bg-red-500/20 rounded-xl py-3 mt-3 items-center border border-red-500/30 ${
                isDeleting ? 'opacity-50' : ''
              }`}
              activeOpacity={0.8}
              onPress={handleDeleteActivity}
              disabled={isDeleting}
            >
              <Text className="text-red-500 font-UrbanistSemiBold">
                {isDeleting ? 'Deleting...' : 'Delete Activity'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
