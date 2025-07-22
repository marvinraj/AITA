import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
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
import { ACTIVITY_CATEGORIES, getCategoryById, getCategoryIcon } from '../constants/categories';
import { colors } from '../constants/colors';
import { itineraryService } from '../lib/services/itineraryService';
import { savedPlacesService } from '../lib/services/savedPlacesService';
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
              className="w-full h-96 rounded-lg"
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
  onActivityUpdated?: () => void; // Add callback for updates
  onEdit?: (updatedActivity: ItineraryItem) => void; // Callback with updated data
  isSavedPlace?: boolean; // New prop to indicate if this is a saved place
}

export default function ActivityDetailModal({ 
  visible, 
  onClose, 
  activity,
  onActivityDeleted,
  onActivityUpdated,
  onEdit,
  isSavedPlace = false
}: ActivityDetailModalProps) {
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local activity state for immediate updates
  const [localActivity, setLocalActivity] = useState<ItineraryItem | null>(activity);
  
  // Update local activity when prop changes
  React.useEffect(() => {
    setLocalActivity(activity);
  }, [activity]);
  
  // Edit state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  
  if (!localActivity) return null;

  // Initialize edit state when entering edit mode
  const initializeEditState = () => {
    setSelectedCategory(localActivity.category);
    
    if (localActivity.time) {
      const [hours, minutes] = localActivity.time.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      
      if (hour === 0) {
        setSelectedHour(12);
        setSelectedPeriod('AM');
      } else if (hour <= 12) {
        setSelectedHour(hour);
        setSelectedPeriod(hour === 12 ? 'PM' : 'AM');
      } else {
        setSelectedHour(hour - 12);
        setSelectedPeriod('PM');
      }
      
      setSelectedMinute(minute);
    } else {
      setSelectedHour(9);
      setSelectedMinute(0);
      setSelectedPeriod('AM');
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (!isEditing) {
      initializeEditState();
    }
    setIsEditing(!isEditing);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!activity || isSavedPlace) return;

    setIsSaving(true);
    try {
      // Convert time to 24-hour format
      let hour = selectedHour;
      if (selectedPeriod === 'PM' && hour !== 12) {
        hour += 12;
      } else if (selectedPeriod === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const timeString = `${hour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;

      // Update the activity
      await itineraryService.updateItineraryItem(localActivity.id, {
        category: selectedCategory as ItineraryItem['category'],
        time: timeString,
      });

      // Create updated activity for callback
      const updatedActivity = {
        ...localActivity,
        category: selectedCategory as ItineraryItem['category'],
        time: timeString,
      };

      // Update local state immediately for UI
      setLocalActivity(updatedActivity);

      // Close edit mode
      setIsEditing(false);
      
      // Trigger callbacks
      onEdit?.(updatedActivity);
      if (onActivityUpdated) {
        onActivityUpdated();
      }

      Alert.alert('Success', 'Activity updated successfully');
    } catch (error) {
      console.error('Error updating activity:', error);
      Alert.alert('Error', 'Failed to update localActivity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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

  const category = getCategoryById(localActivity.category);

  // Handle delete activity
  const handleDeleteActivity = async () => {
    const actionType = isSavedPlace ? 'Remove from Saved Places' : 'Delete Activity';
    const message = isSavedPlace 
      ? `Are you sure you want to remove "${localActivity.title}" from your saved places?`
      : `Are you sure you want to delete "${localActivity.title}"? This action cannot be undone.`;
    
    Alert.alert(
      actionType,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: isSavedPlace ? 'Remove' : 'Delete', 
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
      if (isSavedPlace) {
        // Create a method to delete saved place by ID
        const { error } = await savedPlacesService.deleteSavedPlaceById(localActivity.id);
        if (error) {
          throw error;
        }
      } else {
        // Delete itinerary item
        await itineraryService.deleteItineraryItem(localActivity.id);
      }
      
      // Close modal and trigger refresh
      onClose();
      if (onActivityDeleted) {
        onActivityDeleted();
      }
      
      const successMessage = isSavedPlace 
        ? 'Place removed from saved places successfully'
        : 'Activity deleted successfully';
      Alert.alert('Success', successMessage);
    } catch (error) {
      console.error('Error deleting activity:', error);
      const errorMessage = isSavedPlace 
        ? 'Failed to remove place from saved places. Please try again.'
        : 'Failed to delete localActivity. Please try again.';
      Alert.alert('Error', errorMessage);
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
              {isSavedPlace ? 'Saved Place Details' : 'Activity Details'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-2xl text-secondaryFont">✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          className="flex-1 px-4 pt-6" 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Activity Header */}
          <View className="rounded-lg p-4">
            <View className="flex-row items-center mb-3">
              {/* Category Icon */}
              <View className="w-12 h-12 rounded-full bg-accentFont/20 items-center justify-center mr-3">
                <Text className="text-xl">{getCategoryIcon(localActivity.category)}</Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-primaryFont font-UrbanistSemiBold text-3xl">
                  {localActivity.title}
                </Text>
                {/* {category && (
                  <Text className="text-secondaryFont text-sm">
                    {category.label}
                  </Text>
                )} */}
              </View>
              
              {/* Priority indicator */}
              {localActivity.priority === 'high' && (
                <View className="bg-red-500/20 px-2 py-1 rounded-full">
                  <Text className="text-red-500 text-xs font-UrbanistSemiBold">
                    High Priority
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Activity Image Gallery */}
          {localActivity.image_url && (
            <ImageGallery 
              images={
                localActivity.photos && localActivity.photos.length > 0 
                  ? localActivity.photos 
                  : [localActivity.image_url]
              }
            />
          )}

          {/* Details Section */}
          <View className="space-y-4">
            {/* Date & Time - Only show for itinerary items */}
            {!isSavedPlace && (
              <View className="flex flex-row items-center justify-between bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color={colors.accentFont} style={{ marginRight: 8 }} />
                  <Text className="text-primaryFont font-UrbanistSemiBold text-base">
                    When
                  </Text>
                </View>
                <Text className="text-secondaryFont">
                  {formatDate(localActivity.date)}
                </Text>
                {localActivity.time && (
                  <Text className="text-secondaryFont">
                    {formatTime(localActivity.time)}
                  </Text>
                )}
              </View>
            )}

            {/* Location */}
            {localActivity.location && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <View className="flex flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={20} color={colors.accentFont} style={{ marginRight: 8 }} />
                    <Text className="text-primaryFont font-UrbanistSemiBold text-base mr-2">
                      Location
                    </Text>
                  </View>
                  <View className='ml-8' style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      className="text-secondaryFont"
                      // numberOfLines={4}
                      // ellipsizeMode="tail"
                      style={{ maxWidth: '100%' }}
                    >
                      {localActivity.location}
                    </Text>
                  </View>
                  <View className="flex-row flex-shrink-0">
                    {/* Waze Icon Button */}
                    <TouchableOpacity
                      onPress={() => {
                        const query = encodeURIComponent(localActivity.location ?? '');
                        const wazeUrl = `https://waze.com/ul?q=${query}`;
                        Alert.alert(
                          'Open Waze',
                          'Do you want to open this location in Waze?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open', onPress: () => Linking.openURL(wazeUrl) }
                          ]
                        );
                      }}
                      activeOpacity={0.8}
                      accessibilityLabel="Open in Waze"
                      style={{ marginRight: 8 }}
                    >
                      <View className="w-12 h-12 rounded-3xl bg-secondaryBG items-center justify-center">
                        <Ionicons name="navigate" size={18} color={colors.accentFont} />
                      </View>
                    </TouchableOpacity>
                    {/* Google Maps Icon Button */}
                    <TouchableOpacity
                      onPress={() => {
                        const query = encodeURIComponent(localActivity.location ?? '');
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
                        Alert.alert(
                          'Open Google Maps',
                          'Do you want to open this location in Google Maps?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open', onPress: () => Linking.openURL(mapsUrl) }
                          ]
                        );
                      }}
                      activeOpacity={0.8}
                      accessibilityLabel="Open in Google Maps"
                    >
                      <View className="w-12 h-12 rounded-3xl bg-secondaryBG items-center justify-center">
                        <Ionicons name="map" size={18} color={colors.accentFont} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Description */}
            {localActivity.description && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="document-text-outline" size={20} color={colors.accentFont} style={{ marginRight: 8 }} />
                  <Text className="text-primaryFont font-UrbanistSemiBold text-base">
                    Description
                  </Text>
                </View>
                <Text className="text-secondaryFont leading-5">
                  {localActivity.description}
                </Text>
              </View>
            )}

            {/* Duration - Only show for itinerary items */}
            {!isSavedPlace && localActivity.duration && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  ⏱️ Duration
                </Text>
                <Text className="text-secondaryFont">
                  {localActivity.duration} minutes
                </Text>
              </View>
            )}

            {/* Cost - Only show for itinerary items */}
            {!isSavedPlace && localActivity.cost && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  💰 Cost
                </Text>
                <Text className="text-secondaryFont">
                  {localActivity.currency || 'USD'} {localActivity.cost}
                </Text>
              </View>
            )}

            {/* Notes */}
            {localActivity.notes && (
              <View className="bg-primaryBG/50 rounded-lg p-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-base mb-2">
                  💭 Notes
                </Text>
                <Text className="text-secondaryFont leading-5">
                  {localActivity.notes}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mt-8 mb-6 space-y-3">
            {/* Edit Mode */}
            {isEditing && !isSavedPlace ? (
              <View className="bg-secondaryBG/30 rounded-xl p-4 border-2 border-accentFont/30 mb-4">
                <Text className="text-accentFont font-UrbanistSemiBold mb-4 text-center">
                  ✏️ Edit Activity
                </Text>
                
                {/* Category Selection */}
                <View className="mb-4">
                  <Text className="text-primaryFont font-UrbanistSemiBold mb-3">
                    Choose category
                  </Text>
                  
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {ACTIVITY_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        className={`px-4 py-2 rounded-full border flex-row items-center ${
                          selectedCategory === category.id
                            ? 'bg-accentFont border-accentFont'
                            : 'bg-secondaryBG border-border'
                        }`}
                        onPress={() => setSelectedCategory(category.id)}
                        activeOpacity={0.8}
                      >
                        <Text className="mr-2">{category.icon}</Text>
                        <Text className={`font-UrbanistSemiBold ${
                          selectedCategory === category.id
                            ? 'text-primaryBG'
                            : 'text-primaryFont'
                        }`}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Time Picker */}
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-primaryFont font-UrbanistSemiBold">
                      Set time
                    </Text>
                  </View>
                  
                  <View className="bg-secondaryBG rounded-xl p-4 border border-border">
                    <View className="flex-row items-center justify-center">
                      {/* Hour Picker */}
                      <View className="items-center">
                        <Text className="text-secondaryFont text-xs mb-2">Hour</Text>
                        <View className="flex-row items-center">
                          <TouchableOpacity
                            onPress={() => setSelectedHour(selectedHour > 1 ? selectedHour - 1 : 12)}
                            className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                            activeOpacity={0.7}
                          >
                            <Text className="text-accentFont font-UrbanistSemiBold">−</Text>
                          </TouchableOpacity>
                          <Text className="text-primaryFont font-UrbanistSemiBold text-xl mx-4 min-w-8 text-center">
                            {selectedHour}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedHour(selectedHour < 12 ? selectedHour + 1 : 1)}
                            className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                            activeOpacity={0.7}
                          >
                            <Text className="text-accentFont font-UrbanistSemiBold">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <Text className="text-primaryFont font-UrbanistSemiBold text-xl mx-2">:</Text>
                      
                      {/* Minute Picker */}
                      <View className="items-center">
                        <Text className="text-secondaryFont text-xs mb-2">Min</Text>
                        <View className="flex-row items-center">
                          <TouchableOpacity
                            onPress={() => setSelectedMinute(selectedMinute >= 15 ? selectedMinute - 15 : 45)}
                            className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                            activeOpacity={0.7}
                          >
                            <Text className="text-accentFont font-UrbanistSemiBold">−</Text>
                          </TouchableOpacity>
                          <Text className="text-primaryFont font-UrbanistSemiBold text-xl mx-4 min-w-8 text-center">
                            {selectedMinute.toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedMinute(selectedMinute <= 30 ? selectedMinute + 15 : 0)}
                            className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                            activeOpacity={0.7}
                          >
                            <Text className="text-accentFont font-UrbanistSemiBold">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* AM/PM Toggle */}
                      <View className="items-center ml-4">
                        <Text className="text-secondaryFont text-xs mb-2">Period</Text>
                        <View className="bg-primaryBG rounded-lg overflow-hidden">
                          <TouchableOpacity
                            onPress={() => setSelectedPeriod('AM')}
                            className={`px-3 py-2 ${selectedPeriod === 'AM' ? 'bg-accentFont' : 'bg-transparent'}`}
                            activeOpacity={0.7}
                          >
                            <Text className={`font-UrbanistSemiBold text-sm ${selectedPeriod === 'AM' ? 'text-primaryBG' : 'text-primaryFont'}`}>
                              AM
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setSelectedPeriod('PM')}
                            className={`px-3 py-2 ${selectedPeriod === 'PM' ? 'bg-accentFont' : 'bg-transparent'}`}
                            activeOpacity={0.7}
                          >
                            <Text className={`font-UrbanistSemiBold text-sm ${selectedPeriod === 'PM' ? 'text-primaryBG' : 'text-primaryFont'}`}>
                              PM
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    
                    {/* Selected time preview */}
                    <Text className="text-center text-secondaryFont text-sm mt-3">
                      Selected: {selectedHour}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                    </Text>
                  </View>
                </View>

                {/* Save/Cancel Buttons */}
                <View className="flex-row space-x-3">
                  <TouchableOpacity 
                    className="flex-1 bg-transparent rounded-xl py-3 items-center border border-border/30"
                    activeOpacity={0.8}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text className="text-primaryFont font-UrbanistSemiBold">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className={`flex-1 rounded-xl py-3 items-center ${
                      isSaving ? 'bg-accentFont/50' : 'bg-accentFont'
                    }`}
                    activeOpacity={0.8}
                    onPress={handleSaveChanges}
                    disabled={isSaving}
                  >
                    <Text className="text-primaryBG font-UrbanistSemiBold">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Normal Mode Buttons */
              <>
                {!isSavedPlace && (
                  <TouchableOpacity 
                    className="bg-transparent rounded-xl py-3 items-center border border-blue-300/20"
                    activeOpacity={0.8}
                    onPress={handleEditToggle}
                  >
                    <Text className="text-blue-300 font-UrbanistSemiBold">
                      Edit Activity
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  className={`bg-red-500/20 rounded-xl py-3 mt-3 items-center border border-red-500/30 ${
                    isDeleting ? 'opacity-50' : ''
                  }`}
                  activeOpacity={0.8}
                  onPress={handleDeleteActivity}
                  disabled={isDeleting}
                >
                  <Text className="text-red-500 font-UrbanistSemiBold">
                    {isDeleting 
                      ? (isSavedPlace ? 'Removing...' : 'Deleting...') 
                      : (isSavedPlace ? 'Remove from Saved Places' : 'Delete Activity')
                    }
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
