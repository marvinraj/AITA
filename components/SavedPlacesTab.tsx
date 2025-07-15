import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { SavedFolder, savedFoldersService } from '../lib/services/savedFoldersService';
import { SavedPlace, savedPlacesService } from '../lib/services/savedPlacesService';
import { supabase } from '../lib/supabase';
import { ItineraryItem } from '../types/database';
import ActivityDetailModal from './ActivityDetailModal';

export default function SavedPlacesTab() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [folders, setFolders] = useState<SavedFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showingFolders, setShowingFolders] = useState(true);
  const [currentFolderPlaces, setCurrentFolderPlaces] = useState<SavedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadSavedPlaces();
      loadFolders();
    }
  }, [user]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadSavedPlaces = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const places = await savedPlacesService.getSavedPlaces(user.id);
      setSavedPlaces(places);
    } catch (error) {
      console.error('Error loading saved places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    if (!user) return;

    try {
      // Get custom folders from database
      const customFolders = await savedFoldersService.getFolders(user.id);
      
      // Get total count for "All Saves"
      const allSavesCount = await savedFoldersService.getAllSavesCount(user.id);
      
      // Create "All Saves" folder
      const allSavesFolder: SavedFolder = {
        id: 'all',
        user_id: user.id,
        name: 'All Saves',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        place_count: allSavesCount
      };

      setFolders([allSavesFolder, ...customFolders]);
    } catch (error) {
      console.error('Error loading folders:', error);
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
      time: undefined,
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

  const handleCreateFolder = () => {
    Alert.prompt(
      'New Folder',
      'Enter folder name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (folderName) => {
            if (folderName && folderName.trim()) {
              const newFolder = await savedFoldersService.createFolder(user.id, {
                name: folderName.trim()
              });
              
              if (newFolder) {
                // Reload folders to get updated list
                loadFolders();
              } else {
                Alert.alert('Error', 'Failed to create folder. The name might already exist.');
              }
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleFolderPress = async (folderId: string) => {
    setSelectedFolder(folderId);
    setShowingFolders(false);
    
    // Load places for this folder
    if (folderId === 'all') {
      setCurrentFolderPlaces(savedPlaces);
    } else {
      await loadPlacesInFolder(folderId);
    }
  };

  const loadPlacesInFolder = async (folderId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const folderPlaces = await savedFoldersService.getPlacesInFolder(user.id, folderId);
      setCurrentFolderPlaces(folderPlaces);
    } catch (error) {
      console.error('Error loading places in folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToFolders = () => {
    setShowingFolders(true);
    setSelectedFolder(null);
    setCurrentFolderPlaces([]);
  };

  const getFilteredPlaces = () => {
    if (selectedFolder === 'all' || !selectedFolder) {
      return savedPlaces;
    }
    return currentFolderPlaces;
  };

  const handleRemovePlace = async (placeId: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Place',
      'Are you sure you want to remove this place from your saved places?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await savedPlacesService.unsavePlace(user.id, placeId);
            if (success) {
              setSavedPlaces(prev => prev.filter(place => place.place_id !== placeId));
              setCurrentFolderPlaces(prev => prev.filter(place => place.place_id !== placeId));
              loadFolders(); // Refresh folder counts
            } else {
              Alert.alert('Error', 'Failed to remove place');
            }
          }
        }
      ]
    );
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

  const renderFolder = ({ item }: { item: SavedFolder }) => (
    <TouchableOpacity
      className="bg-secondaryBG rounded-lg p-4 m-2 border border-border flex-1"
      onPress={() => handleFolderPress(item.id)}
    >
      <View className="w-full h-32 rounded-lg mb-3 bg-inputBG justify-center items-center">
        <Ionicons 
          name="folder" 
          size={48} 
          color={item.is_default ? colors.accentFont : colors.secondaryFont} 
        />
      </View>
      
      <Text className="text-primaryFont font-semibold text-sm mb-1" numberOfLines={2}>
        {item.name}
      </Text>
      <Text className="text-secondaryFont text-xs">
        {item.place_count || 0} {(item.place_count || 0) === 1 ? 'place' : 'places'}
      </Text>
    </TouchableOpacity>
  );

  const renderAddFolderButton = () => (
    <TouchableOpacity
      className="bg-inputBG rounded-lg p-4 m-2 border border-dashed border-border flex-1"
      onPress={handleCreateFolder}
    >
      <View className="w-full h-32 rounded-lg mb-3 justify-center items-center">
        <Ionicons name="add" size={48} color={colors.secondaryFont} />
      </View>
      
      <Text className="text-secondaryFont font-medium text-sm text-center">
        New Folder
      </Text>
    </TouchableOpacity>
  );

  const renderSavedPlace = ({ item }: { item: SavedPlace }) => (
    <TouchableOpacity 
      onPress={() => handlePlacePress(item)}
      activeOpacity={0.7}
      className="flex-1"
      style={{ maxWidth: '50%' }}
    >
      <View className="bg-secondaryBG rounded-lg p-3 m-2 border border-border">
        {/* Place Image */}
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

        {/* Place Details */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-primaryFont font-semibold text-sm flex-1 mr-2" numberOfLines={2}>
              {item.name}
            </Text>
            {/* Remove Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the parent TouchableOpacity
                handleRemovePlace(item.place_id);
              }}
              className="p-1"
            >
              <Ionicons name="heart" size={16} color={colors.accentFont} />
            </TouchableOpacity>
          </View>

          <Text className="text-secondaryFont text-xs mb-2" numberOfLines={2}>
            {item.address}
          </Text>
          
          {/* Rating */}
          {item.rating && (
            <View className="flex-row items-center mb-2">
              <View className="flex-row mr-2">
                {getRatingStars(item.rating)}
              </View>
              <Text className="text-secondaryFont text-xs">
                {item.rating}
              </Text>
            </View>
          )}

          {/* Category */}
          <Text className="text-accentFont text-xs capitalize mb-2">
            {item.category}
          </Text>

          {/* User Notes */}
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

  if (showingFolders) {
    // Show folders view
    const foldersWithAddButton = [...folders, { id: 'add-folder', name: 'Add Folder', placeCount: 0 }];
    
    return (
      <View className="flex-1 px-2 pt-4">
        <Text className="text-primaryFont text-lg font-semibold mb-4 px-2">
          Your Folders
        </Text>
        <FlatList
          data={foldersWithAddButton}
          renderItem={({ item }) => 
            item.id === 'add-folder' ? renderAddFolderButton() : renderFolder({ item: item as SavedFolder })
          }
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {/* Activity Detail Modal */}
        <ActivityDetailModal
          visible={showModal}
          onClose={handleModalClose}
          activity={selectedPlace ? convertSavedPlaceToItineraryItem(selectedPlace) : null}
          isSavedPlace={true}
          onActivityDeleted={() => {
            // Refresh the saved places list after deletion
            loadSavedPlaces();
            loadFolders();
          }}
        />
      </View>
    );
  }

  // Show places view
  const filteredPlaces = getFilteredPlaces();
  const selectedFolderName = folders.find(f => f.id === selectedFolder)?.name || 'Folder';

  if (filteredPlaces.length === 0) {
    return (
      <View className="flex-1 px-4">
        {/* Header with back button */}
        <View className="flex-row items-center pt-4 mb-4">
          <TouchableOpacity onPress={handleBackToFolders} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.primaryFont} />
          </TouchableOpacity>
          <Text className="text-primaryFont text-lg font-semibold">
            {selectedFolderName}
          </Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <Ionicons name="heart-outline" size={64} color={colors.secondaryFont} />
          <Text className="text-primaryFont text-xl font-semibold mt-4 text-center">
            No Saved Places
          </Text>
          <Text className="text-secondaryFont text-center mt-2">
            Start exploring and save places you love in the Discover tab
          </Text>
        </View>

        {/* Activity Detail Modal */}
        <ActivityDetailModal
          visible={showModal}
          onClose={handleModalClose}
          activity={selectedPlace ? convertSavedPlaceToItineraryItem(selectedPlace) : null}
          isSavedPlace={true}
          onActivityDeleted={() => {
            // Refresh the saved places list after deletion
            loadSavedPlaces();
            loadFolders();
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 px-2 pt-4">
      {/* Header with back button */}
      <View className="flex-row items-center mb-4 px-2">
        <TouchableOpacity onPress={handleBackToFolders} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.primaryFont} />
        </TouchableOpacity>
        <Text className="text-primaryFont text-lg font-semibold">
          {selectedFolderName} ({filteredPlaces.length})
        </Text>
      </View>
      
      <FlatList
        data={filteredPlaces}
        renderItem={renderSavedPlace}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        visible={showModal}
        onClose={handleModalClose}
        activity={selectedPlace ? convertSavedPlaceToItineraryItem(selectedPlace) : null}
        isSavedPlace={true}
        onActivityDeleted={() => {
          // Refresh the saved places list after deletion
          loadSavedPlaces();
          loadFolders();
        }}
      />
    </View>
  );
}
