import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ACTIVITY_CATEGORIES, Category, getSuggestedCategories } from '../constants/categories';
import { itineraryService } from '../lib/services/itineraryService';
import { Place, placesService } from '../lib/services/placesService';

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
      setTimeEnabled(false);
      loadInitialData();
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
    
    // Auto-select if there's a clear suggestion
    if (place.category) {
      setSelectedCategory(place.category);
    } else if (suggested.length === 1) {
      setSelectedCategory(suggested[0].id);
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

      // Create itinerary item
      const newItem = await itineraryService.createItineraryItem({
        trip_id: tripId,
        title: selectedPlace.name,
        description: selectedPlace.description,
        date: date,
        time: timeFormatted || undefined,
        location: selectedPlace.address,
        category: selectedCategory as any, // Type assertion for now
        priority: 'medium'
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

        <ScrollView className="flex-1 px-4 pt-6">
          {!selectedPlace ? (
            // Search Phase
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
                      <Text className="text-primaryFont font-UrbanistSemiBold">
                        {place.name}
                      </Text>
                      <Text className="text-secondaryFont text-sm">
                        📍 {place.address}
                      </Text>
                      {place.rating && (
                        <Text className="text-secondaryFont text-xs mt-1">
                          ⭐ {place.rating} • {place.type}
                        </Text>
                      )}
                      {place.description && (
                        <Text className="text-secondaryFont text-xs mt-1" numberOfLines={1}>
                          {place.description}
                        </Text>
                      )}
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
                      <Text className="text-primaryFont font-UrbanistSemiBold">
                        {place.name}
                      </Text>
                      <Text className="text-secondaryFont text-sm">
                        📍 {place.address}
                      </Text>
                      {place.rating && (
                        <Text className="text-secondaryFont text-xs mt-1">
                          ⭐ {place.rating} • {place.type}
                        </Text>
                      )}
                      {place.description && (
                        <Text className="text-secondaryFont text-xs mt-1" numberOfLines={1}>
                          {place.description}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
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

              {/* Time Picker (Optional) */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-primaryFont font-UrbanistSemiBold">
                    Set time (optional)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTimeEnabled(!timeEnabled)}
                    className={`w-12 h-6 rounded-full ${timeEnabled ? 'bg-accentFont' : 'bg-secondaryBG border border-border'} items-center justify-center`}
                    activeOpacity={0.8}
                  >
                    <View className={`w-4 h-4 rounded-full bg-primaryBG ${timeEnabled ? 'translate-x-3' : '-translate-x-3'}`} />
                  </TouchableOpacity>
                </View>
                
                {timeEnabled && (
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
                )}
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
