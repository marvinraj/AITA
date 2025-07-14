import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { SavedPlace, savedPlacesService } from '../lib/services/savedPlacesService';
import { Trip } from '../types/database';

interface SavesTabProps {
  trip: Trip;
}

export default function SavesTab({ trip }: SavesTabProps) {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      } else {
        setSavedPlaces([]);
      }
    } catch (error) {
      setSavedPlaces([]);
    } finally {
      setIsLoading(false);
    }
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
    <View className="bg-secondaryBG rounded-lg p-3 m-2 border border-border flex-1">
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
        <Text className="text-secondaryFont text-xs mb-2" numberOfLines={2}>
          {item.address}
        </Text>
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
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.accentFont} />
        <Text className="text-secondaryFont mt-2">Loading saved places...</Text>
      </View>
    );
  }

  if (savedPlaces.length === 0) {
    return (
      <View className="flex-1 px-4 justify-center items-center">
        <Ionicons name="heart-outline" size={64} color={colors.secondaryFont} />
        <Text className="text-primaryFont text-xl font-semibold mt-4 text-center">No Saved Places</Text>
        <Text className="text-secondaryFont text-center mt-2">Start exploring and save places you love in the Discover tab</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-2 pt-4">
      <Text className="text-primaryFont text-lg font-semibold mb-4 px-2">Saves for {trip.name}</Text>
      <FlatList
        data={savedPlaces}
        renderItem={renderSavedPlace}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}