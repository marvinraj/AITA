import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ACTIVITY_CATEGORIES, Category, getSuggestedCategories } from '../constants/categories';
import { searchLocationByName } from '../lib/locationUtils';
import { itineraryService } from '../lib/services/itineraryService';
import { Place, placesService } from '../lib/services/placesService';
import { savedPlacesService } from '../lib/services/savedPlacesService';

interface AddActivityModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  tripId: string;
  onActivityAdded: () => void;
}

// Mock data for now - will be replaced with actual search service
const mockRecentSearches = ["Colosseum", "Vatican Museums", "Trevi Fountain"];

export default function AddActivityModal({ 
  visible, 
  onClose, 
  date, 
  tripId, 
  onActivityAdded 
}: AddActivityModalProps) {
  // Tab state and saved places state
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'saves'>('search');
  // Fetch saved places for this trip
  const fetchSavedPlaces = async () => {
    try {
      const { data, error } = await savedPlacesService.getSavedPlacesForTrip(tripId);
      if (!error) {
        setSavedPlaces(data || []);
      } else {
        setSavedPlaces([]);
      }
    } catch (error) {
      setSavedPlaces([]);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<Place[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  // Time picker states
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPlace(null);
      setSuggestedCategories([]);
      setSelectedCategory('');
      setSelectedHour(9);
      setSelectedMinute(0);
      setSelectedPeriod('AM');
      setTimeEnabled(true); // Enable time by default since it's required
      loadInitialData();
      // Fetch saved places for this trip
      fetchSavedPlaces();
    }
  }, [visible]);

  // Load initial data (popular places, recent searches)
  const loadInitialData = async () => {
    try {
      const [popular, recent] = await Promise.all([
        placesService.getPopularPlaces(6),
        placesService.getRecentSearches()
      ]);
      setPopularPlaces(popular);
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Debounced search functionality
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (searchQuery.trim()) {
      setSearchLoading(true);
      timeoutId = setTimeout(async () => {
        try {
          const results = await placesService.searchPlaces(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    setSearchQuery('');
    setSearchResults([]);

    // Get suggested categories for this place
    const suggested = getSuggestedCategories(place.type);
    setSuggestedCategories(suggested);

    // Only auto-select if the category is valid (exists in ACTIVITY_CATEGORIES)
    const validCategory = ACTIVITY_CATEGORIES.find(cat => cat.id === place.category);
    if (place.category && validCategory) {
      setSelectedCategory(place.category);
    } else if (suggested.length === 1) {
      setSelectedCategory(suggested[0].id);
    } else {
      setSelectedCategory(''); // Force user to pick a category
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleAddActivity = async () => {
    if (!selectedPlace || !selectedCategory) {
      Alert.alert('Error', 'Please select a place and category');
      return;
    }

    // Make time compulsory
    if (!timeEnabled) {
      Alert.alert('Time Required', 'Please set a time for this activity');
      return;
    }

    // Validate category against ACTIVITY_CATEGORIES
    const validCategory = ACTIVITY_CATEGORIES.find(cat => cat.id === selectedCategory);
    if (!validCategory) {
      Alert.alert('Error', 'Please select a valid category for this place');
      return;
    }

    setLoading(true);
    try {
      // Format time if enabled
      let timeFormatted = '';
      if (timeEnabled) {
        // Convert to 24-hour format for database storage
        let hour24 = selectedHour;
        if (selectedPeriod === 'PM' && selectedHour !== 12) {
          hour24 += 12;
        } else if (selectedPeriod === 'AM' && selectedHour === 12) {
          hour24 = 0;
        }
        timeFormatted = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
      }

      console.log('Selected category:', selectedCategory);
      console.log('Saving activity with category:', selectedCategory);
      console.log('Selected place photos:', selectedPlace.photos?.length || 0, selectedPlace.photos);

      // Try to fetch location coordinates automatically
      let locationData = null;
      try {
        locationData = await searchLocationByName(selectedPlace.name + ' ' + selectedPlace.address);
        console.log('Location data found:', locationData);
      } catch (error) {
        console.log('Could not fetch location data:', error);
      }

      // Create itinerary item
      const newItem = await itineraryService.createItineraryItem({
        trip_id: tripId,
        title: selectedPlace.name,
        description: selectedPlace.description,
        date: date,
        time: timeFormatted, // Now always required
        location: selectedPlace.address,
        category: selectedCategory as any, // Type assertion for now
        priority: 'medium',
        image_url: selectedPlace.imageUrl, // Primary image URL from the place
        photos: selectedPlace.photos || [], // All available photos for gallery
        latitude: locationData?.latitude || undefined,
        longitude: locationData?.longitude || undefined
      });

      console.log('Activity created successfully:', newItem);
      
      // Trigger refresh and close modal
      onActivityAdded();
      onClose();
      Alert.alert('Success', 'Activity added to your itinerary!');
    } catch (error) {
      console.error('Error adding activity:', error);
      Alert.alert('Error', 'Failed to add activity. Please try again.');
    } finally {
      fetchSavedPlaces();
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
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
              Add Activity
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-2xl text-secondaryFont">✕</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-secondaryFont text-sm mt-1">
            {formatDate(date)}
          </Text>
        </View>

        {/* Tab Bar */}
        {!selectedPlace && (
          <View className="flex-row items-end mb-4 mt-6 ml-2">
            <View className="flex-row space-x-4">
              <TouchableOpacity
                className={`py-2 px-4 border-b-2 ${activeTab === 'search' ? 'border-[#f48080] bg-primaryBG' : ''}`}
                onPress={() => setActiveTab('search')}
                activeOpacity={0.8}
              >
                <Text className={`font-UrbanistSemiBold text-lg ${activeTab === 'search' ? 'text-[#f48080]' : 'text-secondaryFont'}`}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`py-2 px-4 border-b-2 ${activeTab === 'saves' ? 'border-[#f48080] bg-primaryBG' : ''}`}
                onPress={() => setActiveTab('saves')}
                activeOpacity={0.8}
              >
                <Text className={`font-UrbanistSemiBold text-lg ${activeTab === 'saves' ? 'text-[#f48080]' : 'text-secondaryFont'}`}>Saves</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <ScrollView className="flex-1 px-4 pt-2">
          {!selectedPlace ? (
            <>
              {activeTab === 'search' && (
                // ...existing search feature code...
                <>
                  <Text className="text-primaryFont font-UrbanistSemiBold mb-3">
                    Search for a place
                  </Text>
                  {/* Search Input */}
                  <View className="mb-4">
                    <TextInput
                      className="bg-secondaryBG text-primaryFont rounded-xl px-4 py-3 border border-border"
                      placeholder="Search places..."
                      placeholderTextColor="#888"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                  </View>
                  {/* Search Results */}
                  {searchLoading && (
                    <View className="items-center py-4">
                      <ActivityIndicator color="#f48080" />
                      <Text className="text-secondaryFont text-sm mt-2">Searching...</Text>
                    </View>
                  )}
                  {searchResults.length > 0 && !searchLoading && (
                    <View className="mb-4">
                      <Text className="text-primaryFont font-UrbanistSemiBold mb-2">
                        Search Results
                      </Text>
                      {searchResults.map((place) => (
                        <TouchableOpacity
                          key={place.id}
                          className="bg-secondaryBG/50 rounded-lg p-3 mb-2 border border-border/30"
                          onPress={() => handlePlaceSelect(place)}
                          activeOpacity={0.8}
                        >
                          <View className="flex-row">
                            {/* Place Image */}
                            {place.imageUrl && (
                              <Image
                                source={{ uri: place.imageUrl }}
                                className="w-16 h-16 rounded-lg mr-3"
                                resizeMode="cover"
                              />
                            )}
                            {/* Place Info */}
                            <View className="flex-1">
                              <Text className="text-primaryFont font-UrbanistSemiBold">
                                {place.name || 'Unknown Place'}
                              </Text>
                              <Text className="text-secondaryFont text-sm">
                                📍 {place.address || 'Address not available'}
                              </Text>
                              {(place.rating && place.rating > 0) && (
                                <Text className="text-secondaryFont text-xs mt-1">
                                  ⭐ {place.rating} • {place.type || 'Place'}
                                </Text>
                              )}
                              {place.description && (
                                <Text className="text-secondaryFont text-xs mt-1" numberOfLines={1}>
                                  {place.description}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {/* Recent Searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-primaryFont font-UrbanistSemiBold mb-2">
                        Recent Searches
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {recentSearches.map((search, index) => (
                          <TouchableOpacity
                            key={index}
                            className="bg-secondaryBG/30 rounded-full px-3 py-1 border border-border/30"
                            onPress={() => setSearchQuery(search)}
                            activeOpacity={0.8}
                          >
                            <Text className="text-primaryFont text-sm">
                              {search}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                  {/* Popular Places */}
                  {!searchQuery && popularPlaces.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-primaryFont font-UrbanistSemiBold mb-2">
                        Popular Places
                      </Text>
                      {popularPlaces.map((place) => (
                        <TouchableOpacity
                          key={place.id}
                          className="bg-secondaryBG/50 rounded-lg p-3 mb-2 border border-border/30"
                          onPress={() => handlePlaceSelect(place)}
                          activeOpacity={0.8}
                        >
                          <View className="flex-row">
                            {/* Place Image */}
                            {place.imageUrl && (
                              <Image
                                source={{ uri: place.imageUrl }}
                                className="w-16 h-16 rounded-lg mr-3"
                                resizeMode="cover"
                              />
                            )}
                            {/* Place Info */}
                            <View className="flex-1">
                              <Text className="text-primaryFont font-UrbanistSemiBold">
                                {place.name || 'Unknown Place'}
                              </Text>
                              <Text className="text-secondaryFont text-sm">
                                📍 {place.address || 'Address not available'}
                              </Text>
                              {(place.rating && place.rating > 0) && (
                                <Text className="text-secondaryFont text-xs mt-1">
                                  ⭐ {place.rating} • {place.type || 'Place'}
                                </Text>
                              )}
                              {place.description && (
                                <Text className="text-secondaryFont text-xs mt-1" numberOfLines={1}>
                                  {place.description}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
              {activeTab === 'saves' && (
                <>
                  <Text className="text-primaryFont font-UrbanistSemiBold mb-3">Saved Places</Text>
                  {savedPlaces.length > 0 ? (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 100 }}
                    >
                      {savedPlaces.map((place: Place) => (
                        <View key={place.id} style={{ width: '50%' }}>
                          <TouchableOpacity
                            className="bg-secondaryBG rounded-lg p-3 m-2 border border-border flex-1"
                            onPress={() => handlePlaceSelect(place)}
                            activeOpacity={0.8}
                          >
                            <View className="w-full h-32 rounded-lg mb-3 bg-inputBG justify-center items-center">
                              {(place as any).image_url || place.imageUrl ? (
                                <Image
                                  source={{ uri: (place as any).image_url || place.imageUrl }}
                                  className="w-full h-full rounded-lg"
                                  resizeMode="cover"
                                />
                              ) : (
                                <View className="w-full h-full justify-center items-center">
                                  <Text className="text-secondaryFont text-4xl">🖼️</Text>
                                </View>
                              )}
                            </View>
                            <View className="flex-1">
                              <View className="flex-row justify-between items-start mb-2">
                                <Text className="text-primaryFont font-semibold text-sm flex-1 mr-2" numberOfLines={2}>
                                  {place.name}
                                </Text>
                              </View>
                              <Text className="text-secondaryFont text-xs mb-2" numberOfLines={2}>
                                {place.address}
                              </Text>
                              {place.rating !== undefined && place.rating !== null && (
                                <View className="flex-row items-center mb-2">
                                  {/* Star rating logic from SavesTab.tsx */}
                                  {(() => {
                                    const fullStars = Math.floor(place.rating);
                                    const halfStar = place.rating % 1 >= 0.5;
                                    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
                                    return (
                                      <View className="flex-row mr-2">
                                        {Array.from({ length: fullStars }).map((_, i) => (
                                          <Text key={`full-${i}`} className="text-accentFont text-xs">★</Text>
                                        ))}
                                        {halfStar && (
                                          <Text key="half" className="text-accentFont text-xs">☆</Text>
                                        )}
                                        {Array.from({ length: emptyStars }).map((_, i) => (
                                          <Text key={`empty-${i}`} className="text-secondaryFont text-xs">☆</Text>
                                        ))}
                                      </View>
                                    );
                                  })()}
                                  <Text className="text-secondaryFont text-xs ml-1">{place.rating.toFixed(1)}</Text>
                                </View>
                              )}
                              <Text className="text-accentFont text-xs capitalize mb-2">{place.category}</Text>
                              {(place as any).notes && (
                                <Text className="text-secondaryFont text-xs italic" numberOfLines={2}>
                                  {`"${(place as any).notes}"`}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text className="text-secondaryFont text-sm">No saved places found for this trip.</Text>
                  )}
                </>
              )}
            </>
          ) : (
            // Category Selection Phase
            <>
              {/* Selected Place */}
              <View className="bg-secondaryBG/50 rounded-lg p-4 mb-4 border border-border/30">
                <Text className="text-primaryFont font-UrbanistSemiBold text-lg">
                  📍 {selectedPlace.name}
                </Text>
                <Text className="text-secondaryFont text-sm">
                  {selectedPlace.address}
                </Text>
                {selectedPlace.rating && (
                  <Text className="text-secondaryFont text-xs mt-1">
                    ⭐ {selectedPlace.rating} • {selectedPlace.type}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => setSelectedPlace(null)}
                  className="mt-2"
                  activeOpacity={0.8}
                >
                  <Text className="text-accentFont text-sm font-UrbanistSemiBold">
                    Change Place
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category Selection */}
              <Text className="text-primaryFont font-UrbanistSemiBold mb-3">
                Choose category
              </Text>
              
              {/* Show suggested categories first if available */}
              {suggestedCategories.length > 0 && (
                <>
                  <Text className="text-secondaryFont text-sm mb-2">
                    Suggested for this place:
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {suggestedCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        className={`px-4 py-2 rounded-full border flex-row items-center ${
                          selectedCategory === category.id
                            ? 'bg-accentFont border-accentFont'
                            : 'bg-secondaryBG border-border'
                        }`}
                        onPress={() => handleCategorySelect(category.id)}
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
                  
                  <Text className="text-secondaryFont text-sm mb-2">
                    Or choose from all categories:
                  </Text>
                </>
              )}
              
              {/* All categories */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                {ACTIVITY_CATEGORIES.filter(cat => !suggestedCategories.find(s => s.id === cat.id)).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className={`px-4 py-2 rounded-full border flex-row items-center ${
                      selectedCategory === category.id
                        ? 'bg-accentFont border-accentFont'
                        : 'bg-secondaryBG border-border'
                    }`}
                    onPress={() => handleCategorySelect(category.id)}
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

              {/* Time Picker (Required) */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-primaryFont font-UrbanistSemiBold">
                    Set time (required)
                  </Text>
                  <Text className="text-red-400 text-sm">*</Text>
                </View>
                
                {/* Since time is required, always show the time picker */}
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

              {/* Add Button */}
              <TouchableOpacity
                className={`px-8 py-3 rounded-xl items-center mb-4 ${
                  selectedCategory && !loading 
                    ? 'bg-accentFont' 
                    : 'bg-accentFont/50'
                }`}
                onPress={handleAddActivity}
                disabled={!selectedCategory || loading}
                activeOpacity={0.8}
              >
                <Text className="text-primaryBG font-UrbanistSemiBold">
                  {loading ? 'Adding...' : 'Add to Itinerary'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
