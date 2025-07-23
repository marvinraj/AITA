import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { SavedPlace, savedPlacesService } from '../lib/services/savedPlacesService';
import { ItineraryItem, Trip } from '../types/database';
import ActivityDetailModal from './ActivityDetailModal';

interface SavesTabProps {
  trip: Trip;
}

export default function SavesTab({ trip }: SavesTabProps) {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    if (trip?.id) {
      loadSavedPlaces();
    }
  }, [trip?.id]);

  const loadSavedPlaces = async () => {
    setIsLoading(true);
    try {
      // Only fetch places for this trip
      const { data, error } = await savedPlacesService.getSavedPlacesForTrip(trip.id);
      if (!error) {
        setSavedPlaces(data || []);
        setFilteredPlaces(data || []);
      } else {
        setSavedPlaces([]);
        setFilteredPlaces([]);
      }
    } catch (error) {
      setSavedPlaces([]);
      setFilteredPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert SavedPlace to ItineraryItem format for the modal
  const convertSavedPlaceToItineraryItem = (place: SavedPlace): ItineraryItem => {
    return {
      id: place.id,
      trip_id: place.trip_id || '',
      user_id: place.user_id,
      title: place.name,
      description: place.description || '',
      date: new Date().toISOString().split('T')[0], // Use current date as placeholder
      time: '09:00', // Default time since it's now required
      duration: undefined,
      location: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.category as 'activity' | 'restaurant' | 'hotel' | 'transport' | 'flight' | 'attraction' | 'shopping' | 'nightlife' | 'other',
      priority: 'medium' as const,
      item_order: 0,
      notes: place.notes || '',
      cost: undefined,
      currency: undefined,
      image_url: place.image_url,
      photos: place.photos || [],
      created_at: place.saved_at,
      updated_at: place.saved_at,
    };
  };

  const handlePlacePress = (place: SavedPlace) => {
    setSelectedPlace(place);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedPlace(null);
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(savedPlaces.map(place => place.category))];
    return categories.sort();
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    if (category === null) {
      setFilteredPlaces(savedPlaces);
    } else {
      const filtered = savedPlaces.filter(place => place.category === category);
      setFilteredPlaces(filtered);
    }
    setShowCategoryFilter(false);
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={12} color="#FFD700" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={12} color="#FFD700" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Ionicons key={i} name="star-outline" size={12} color="#FFD700" />);
    }
    return stars;
  };

  const renderSavedPlace = ({ item }: { item: SavedPlace }) => (
    <TouchableOpacity 
      onPress={() => handlePlacePress(item)}
      activeOpacity={0.7}
    >
      <View className="bg-transparent rounded-lg py-2 px-2 m-2  flex-1">
        <View className="w-full h-32 rounded-lg mb-3 bg-inputBG justify-center items-center">
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={32} color={colors.secondaryFont} />
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-primaryFont font-semibold text-sm flex-1 mr-2" numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          {/* <Text className="text-secondaryFont text-xs mb-2" numberOfLines={2}>
            {item.address}
          </Text> */}
          {item.rating && (
            <View className="flex-row items-center mb-2">
              <View className="flex-row mr-2">{getRatingStars(item.rating)}</View>
              <Text className="text-secondaryFont text-xs">{item.rating}</Text>
            </View>
          )}
          <Text className="text-accentFont text-xs capitalize mb-2">{item.category}</Text>
          {item.notes && (
            <Text className="text-secondaryFont text-xs italic" numberOfLines={2}>
              "{item.notes}"
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.accentFont} />
        <Text className="text-secondaryFont mt-2">Loading saved places...</Text>
      </View>
    );
  }

  if (filteredPlaces.length === 0 && !isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Ionicons name="heart-outline" size={64} color={colors.secondaryFont} />
        <Text className="text-primaryFont text-xl font-semibold mt-4 text-center">
          {selectedCategory ? `No ${selectedCategory} places found` : 'No Saved Places'}
        </Text>
        <Text className="text-secondaryFont text-center mt-2">
          {selectedCategory ? 'Try selecting a different category' : 'Start exploring and save places you love in the Discover tab'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-4">
      {/* Stats Section with Filter */}
      <View className="flex-row justify-between items-center px-4 mb-2">
        <View className="flex-row justify-start items-center gap-2">
          <View className="">
            <View className="flex-row items-center mb-1">
              <Ionicons name="heart" size={18} color="#ef4444" style={{ marginRight: 8 }} />
              <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                {filteredPlaces.length}
              </Text>
            </View>
            <Text className="text-secondaryFont text-xs text-center">
              Total Saves
            </Text>
          </View>
          
          {/* Divider */}
          <View className="w-px h-8 bg-border mx-2" />
          
          <View className="">
            <View className="flex-row items-center mb-1">
              <Ionicons name="grid-outline" size={18} color="#f97316" style={{ marginRight: 8 }} />
              <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                {new Set(filteredPlaces.map(place => place.category)).size}
              </Text>
            </View>
            <Text className="text-secondaryFont text-xs text-center">
              Categories
            </Text>
          </View>
          
          {/* Divider */}
          <View className="w-px h-8 bg-border mx-2" />
          
          <View className="">
            <View className="flex-row items-center mb-1">
              <Ionicons name="star" size={18} color="#a855f7" style={{ marginRight: 8 }} />
              <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                {filteredPlaces.filter(place => place.rating && place.rating >= 4).length}
              </Text>
            </View>
            <Text className="text-secondaryFont text-xs text-center">
              Top Rated
            </Text>
          </View>
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          onPress={() => setShowCategoryFilter(!showCategoryFilter)}
          className="bg-inputBG p-2 rounded-lg"
        >
          <Ionicons name="filter" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Category Filter Dropdown */}
      {showCategoryFilter && (
        <View className="px-4 mb-2">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="bg-inputBG rounded-lg p-2"
          >
            <TouchableOpacity
              onPress={() => handleCategoryFilter(null)}
              className={`px-3 py-2 rounded-lg mr-2 ${selectedCategory === null ? 'bg-accentFont' : 'bg-transparent'}`}
            >
              <Text className={`text-xs ${selectedCategory === null ? 'text-white' : 'text-primaryFont'}`}>
                All
              </Text>
            </TouchableOpacity>
            {getUniqueCategories().map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryFilter(category)}
                className={`px-3 py-2 rounded-lg mr-2 ${selectedCategory === category ? 'bg-accentFont' : 'bg-transparent'}`}
              >
                <Text className={`text-xs capitalize ${selectedCategory === category ? 'text-white' : 'text-primaryFont'}`}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 100 }}
      >
        {filteredPlaces.map((item) => (
          <View key={item.id} style={{ width: '50%' }}>
            {renderSavedPlace({ item })}
          </View>
        ))}
      </ScrollView>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        visible={showModal}
        onClose={handleModalClose}
        activity={selectedPlace ? convertSavedPlaceToItineraryItem(selectedPlace) : null}
        isSavedPlace={true}
        onActivityDeleted={() => {
          // Refresh the saved places list after deletion
          loadSavedPlaces();
        }}
      />
    </View>
  );
}