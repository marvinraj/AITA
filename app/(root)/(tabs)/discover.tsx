import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler'
import MapView, { Marker } from 'react-native-maps'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlaceDetailModal from '../../../components/PlaceDetailModal'
import SearchCategories from '../../../components/SearchCategories'
import TripSelectModal from '../../../components/TripSelectModal'
import { colors } from '../../../constants/colors'
import { GooglePlace, googlePlacesService } from '../../../lib/services/googlePlacesService'
import { Place, placesService } from '../../../lib/services/placesService'
import { CreateSavedPlaceInput, SavedPlace, savedPlacesService } from '../../../lib/services/savedPlacesService'
import { supabase } from '../../../lib/supabase'

// Constants for draggable modal
const SCREEN_HEIGHT = Dimensions.get('window').height
const MODAL_MIN_HEIGHT = 80 // Minimum visible height (handle + some content)
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.7 // Leave space for navigation
const MODAL_DEFAULT_HEIGHT = 500 // Start with higher height for better UX
const MODAL_COLLAPSED_HEIGHT = 80 // Height when collapsed but still visible
const BOTTOM_TAB_HEIGHT = 84 // Approximate height of bottom navigation

const DiscoverScreen = () => {
  // PlaceDetailModal state
  const [placeDetailModalVisible, setPlaceDetailModalVisible] = useState(false);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<GooglePlace | null>(null);
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [savedPlaces, setSavedPlaces] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  // Modal state for trip selection
  const [tripModalVisible, setTripModalVisible] = useState(false)
  const [placeToSave, setPlaceToSave] = useState<GooglePlace | null>(null)
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState('Current Location')
  const [locationModalVisible, setLocationModalVisible] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<Place[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [searchingLocations, setSearchingLocations] = useState(false)
  
  // Modal state for bottom categories
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(true)
  const [modalHeight, setModalHeight] = useState(MODAL_DEFAULT_HEIGHT)
  const [isModalCollapsed, setIsModalCollapsed] = useState(false)
  
  // Animated values for draggable modal
  const modalHeightAnimated = useSharedValue(MODAL_DEFAULT_HEIGHT)
  
  // Map reference for controlling the map
  const mapRef = useRef<MapView>(null)
  
  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filters, setFilters] = useState({
    rating: null as number | null,
    priceLevel: null as number | null,
    types: [] as string[],
    openNow: false,
    sortBy: 'relevance' as 'relevance' | 'rating' | 'distance'
  })
  
  // Filter options
  const filterOptions = {
    types: [
      { label: 'Restaurants', value: 'restaurant', icon: '🍽️' },
      { label: 'Hotels', value: 'lodging', icon: '🏨' },
      { label: 'Attractions', value: 'tourist_attraction', icon: '🎯' },
      { label: 'Museums', value: 'museum', icon: '🏛️' },
      { label: 'Parks', value: 'park', icon: '🌳' },
      { label: 'Shopping', value: 'shopping_mall', icon: '🛍️' },
      { label: 'Gas Stations', value: 'gas_station', icon: '⛽' },
      { label: 'Hospitals', value: 'hospital', icon: '🏥' },
      { label: 'Banks', value: 'bank', icon: '🏦' },
    ],
    ratings: [
      { label: '4+ Stars', value: 4 },
      { label: '3+ Stars', value: 3 },
      { label: '2+ Stars', value: 2 },
      { label: '1+ Stars', value: 1 },
    ],
    priceLevels: [
      { label: 'Free', value: 0 },
      { label: 'Inexpensive', value: 1 },
      { label: 'Moderate', value: 2 },
      { label: 'Expensive', value: 3 },
      { label: 'Very Expensive', value: 4 },
    ],
    sortOptions: [
      { label: 'Relevance', value: 'relevance' },
      { label: 'Rating', value: 'rating' },
      { label: 'Distance', value: 'distance' },
    ]
  }

  // Function to update modal height from animated value
  const updateModalHeight = (newHeight: number) => {
    setModalHeight(newHeight)
  }

  // Modal gesture handler for resizing
  const modalGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: { startHeight: number }) => {
      context.startHeight = modalHeightAnimated.value
    },
    onActive: (event, context: { startHeight: number }) => {
      const newHeight = context.startHeight - event.translationY
      const constrainedHeight = Math.max(MODAL_MIN_HEIGHT, Math.min(newHeight, MODAL_MAX_HEIGHT))
      modalHeightAnimated.value = constrainedHeight
    },
    onEnd: () => {
      const finalHeight = modalHeightAnimated.value
      
      // If dragged below collapse threshold, collapse to minimum height
      if (finalHeight < MODAL_COLLAPSED_HEIGHT + 20) {
        modalHeightAnimated.value = withSpring(MODAL_COLLAPSED_HEIGHT, { damping: 20, stiffness: 90 })
        runOnJS(setIsModalCollapsed)(true)
        runOnJS(updateModalHeight)(MODAL_COLLAPSED_HEIGHT)
      } else {
        // Snap to reasonable height and ensure it's expanded
        const targetHeight = finalHeight < MODAL_DEFAULT_HEIGHT ? MODAL_DEFAULT_HEIGHT : finalHeight
        modalHeightAnimated.value = withSpring(targetHeight, { damping: 20, stiffness: 90 })
        runOnJS(setIsModalCollapsed)(false)
        runOnJS(updateModalHeight)(targetHeight)
      }
    },
  })

  // Animated style for the modal
  const animatedModalStyle = useAnimatedStyle(() => {
    return {
      height: modalHeightAnimated.value,
    }
  })

  // Show/hide modal functions
  const showCategoriesModal = () => {
    setCategoriesModalVisible(true)
    setIsModalCollapsed(false)
    const targetHeight = modalHeight > MODAL_COLLAPSED_HEIGHT ? modalHeight : MODAL_DEFAULT_HEIGHT
    modalHeightAnimated.value = withSpring(targetHeight, { damping: 20, stiffness: 90 })
  }

  const hideCategoriesModal = () => {
    modalHeightAnimated.value = withSpring(0, { damping: 20, stiffness: 90 })
    setTimeout(() => {
      setCategoriesModalVisible(false)
      setIsModalCollapsed(false)
    }, 300)
  }

  const expandModal = () => {
    setIsModalCollapsed(false)
    modalHeightAnimated.value = withSpring(MODAL_DEFAULT_HEIGHT, { damping: 20, stiffness: 90 })
    setModalHeight(MODAL_DEFAULT_HEIGHT)
  }

  const collapseModal = () => {
    setIsModalCollapsed(true)
    modalHeightAnimated.value = withSpring(MODAL_COLLAPSED_HEIGHT, { damping: 20, stiffness: 90 })
    setModalHeight(MODAL_COLLAPSED_HEIGHT)
  }

  const fitMarkersToMap = () => {
    if (mapRef.current && searchResults.length > 0) {
      const coordinates = searchResults.map(place => ({
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      }));
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }

  useEffect(() => {
    getCurrentUser()
    loadSavedPlaces()
    loadRecentSearches()
    loadTrips()
    
    // Initialize modal animation
    if (categoriesModalVisible) {
      modalHeightAnimated.value = MODAL_DEFAULT_HEIGHT
    }
  }, [])

  const loadTrips = async () => {
    if (!user) return;
    const fetchedTrips = await require('../../../lib/services/tripsService').tripsService.getUserTrips();
    setTrips(fetchedTrips);
  }
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadSavedPlaces = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const places = await savedPlacesService.getSavedPlaces(user.id)
      setSavedPlaces(places.map((place: SavedPlace) => place.place_id))
    }
  }

  const loadRecentSearches = async () => {
    // You can implement local storage for recent searches
    // For now, we'll use a simple array
    setRecentSearches(['restaurants', 'hotels', 'attractions', 'museums'])
  }

  const handleSearch = useCallback(async (query: string, location?: string) => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      // Use the provided location or current location for search
      const searchLocation = location || (currentLocation !== 'Current Location' ? currentLocation : undefined)
      const searchQueryWithLocation = searchLocation ? `${query} in ${searchLocation}` : query
      let results = await googlePlacesService.searchGooglePlaces(searchQueryWithLocation)
      
      // Apply filters
      results = applyFilters(results)
      
      setSearchResults(results)
      
      // Add to recent searches
      if (!recentSearches.includes(query)) {
        setRecentSearches(prev => [query, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Search error:', error)
      Alert.alert('Error', 'Failed to search places. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [currentLocation, filters, recentSearches])

  // Default search for restaurants when page loads
  useEffect(() => {
    if (user) { // Only search after user is loaded
      setSearchQuery('restaurants')
      setSelectedCategory('restaurants')
      handleSearch('restaurants')
    }
  }, [user, handleSearch])

  const handleLocationSelect = () => {
    if (locationInput.trim()) {
      setCurrentLocation(locationInput.trim())
      setLocationModalVisible(false)
      setLocationInput('')
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
      
      // Re-run search with new location if there's an active search
      if (searchQuery.trim()) {
        handleSearch(searchQuery, locationInput.trim())
      }
    }
  }

  // Handle location search with API autocomplete (similar to smart form)
  const handleLocationSearch = async (query: string) => {
    setLocationInput(query)
    
    if (query.length < 2) {
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
      return
    }

    setSearchingLocations(true)
    try {
      console.log('Searching for locations with query:', query)
      const results = await placesService.searchPlaces(query)
      console.log('Location search results received:', results.length, 'places')
      
      // For locations, we want cities, countries, and places
      setLocationSuggestions(results.slice(0, 8)) // Show up to 8 suggestions
      setShowLocationSuggestions(results.length > 0)
    } catch (error) {
      console.error('Error searching locations:', error)
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
    } finally {
      setSearchingLocations(false)
    }
  }

  // Handle location suggestion selection
  const handleLocationSuggestionSelect = (place: Place) => {
    setCurrentLocation(place.name)
    setLocationInput(place.name)
    setShowLocationSuggestions(false)
    setLocationSuggestions([])
    setLocationModalVisible(false)
    
    // Re-run search with new location if there's an active search
    if (searchQuery.trim()) {
      handleSearch(searchQuery, place.name)
    }
  }

  const handleLocationCancel = () => {
    setLocationModalVisible(false)
    setLocationInput('')
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  const applyFilters = (results: GooglePlace[]): GooglePlace[] => {
    let filteredResults = [...results]

    // Filter by rating
    if (filters.rating !== null) {
      filteredResults = filteredResults.filter(place => 
        place.rating && place.rating >= filters.rating!
      )
    }

    // Filter by price level
    if (filters.priceLevel !== null) {
      filteredResults = filteredResults.filter(place => 
        place.price_level === filters.priceLevel
      )
    }

    // Filter by types
    if (filters.types.length > 0) {
      filteredResults = filteredResults.filter(place => 
        place.types.some(type => filters.types.includes(type))
      )
    }

    // Filter by open now (this would need to be added to GooglePlace interface)
    // if (filters.openNow) {
    //   filteredResults = filteredResults.filter(place => 
    //     place.opening_hours?.open_now === true
    //   )
    // }

    // Sort results
    switch (filters.sortBy) {
      case 'rating':
        filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'distance':
        // Note: This would require user location and distance calculation
        // For now, we'll keep the original order
        break
      default:
        // Keep relevance order (original order from Google)
        break
    }

    return filteredResults
  }

  const clearFilters = () => {
    setFilters({
      rating: null,
      priceLevel: null,
      types: [],
      openNow: false,
      sortBy: 'relevance'
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.rating !== null) count++
    if (filters.priceLevel !== null) count++
    if (filters.types.length > 0) count++
    if (filters.openNow) count++
    if (filters.sortBy !== 'relevance') count++
    return count
  }

  const handleSavePlace = async (place: GooglePlace) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to save places')
      return
    }

    const isAlreadySaved = savedPlaces.includes(place.place_id)
    if (isAlreadySaved) {
      // Unsave place
      const success = await savedPlacesService.unsavePlace(user.id, place.place_id)
      if (success) {
        setSavedPlaces(prev => prev.filter(id => id !== place.place_id))
        Alert.alert('Success', 'Place removed from saved places')
      } else {
        Alert.alert('Error', 'Failed to remove place from saved places')
      }
      return;
    }

    // Show TripSelectModal for trip selection
    if (!trips || trips.length === 0) {
      await loadTrips();
    }
    setPlaceToSave(place);
    setTripModalVisible(true);
  }

  const getCategoryFromTypes = (types: string[]): string => {
    const categoryMap: { [key: string]: string } = {
      'restaurant': 'Food & Dining',
      'food': 'Food & Dining',
      'lodging': 'Accommodation',
      'tourist_attraction': 'Attractions',
      'museum': 'Culture',
      'park': 'Nature',
      'shopping_mall': 'Shopping',
      'hospital': 'Healthcare',
      'bank': 'Finance',
      'gas_station': 'Transportation'
    }

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type]
      }
    }
    return 'Other'
  }

  const getPhotoUrl = (photoReference: string): string => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`
  }

  const getRatingStars = (rating?: number) => {
    if (!rating) return null
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />)
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={14} color="#FFD700" />)
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Ionicons key={i} name="star-outline" size={14} color="#FFD700" />)
    }
    return stars
  }

  const renderSearchResult = ({ item }: { item: GooglePlace }) => {
    const isPlaceSaved = savedPlaces.includes(item.place_id)
    
    return (
      <TouchableOpacity 
        key={item.place_id}
        className="bg-white/5 rounded-xl p-3 mb-3 border border-white/10"
        style={{ width: '48%' }}
        onPress={() => {
          setSelectedPlaceDetail(item);
          setPlaceDetailModalVisible(true);
        }}
      >
        {/* Place Image */}
        <View className="w-full h-32 rounded-lg mb-2 bg-white/10 justify-center items-center">
          {item.photos && item.photos.length > 0 ? (
            <Image
              source={{ uri: getPhotoUrl(item.photos[0].photo_reference) }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.5)" />
          )}
        </View>

        {/* Place Details */}
        <View className="flex-1">
          <Text className="text-white font-semibold text-base mb-1" numberOfLines={2}>
            {item.name}
          </Text>
          
          {/* Rating */}
          {item.rating && (
            <View className="flex-row items-center mb-1">
              <View className="flex-row mr-1">
                {getRatingStars(item.rating)}
              </View>
              <Text className="text-gray-300 text-xs">
                {item.rating}
              </Text>
            </View>
          )}
          
          {/* Place Type */}
          <Text className="text-blue-300 text-xs capitalize mb-2">
            {item.types[0]?.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={() => handleSavePlace(item)}
          className={`absolute top-2 right-2 p-1.5 rounded-full ${
            isPlaceSaved ? 'bg-red-500' : 'bg-white/20'
          }`}
        >
          <Ionicons
            name={isPlaceSaved ? "heart" : "heart-outline"}
            size={16}
            color={isPlaceSaved ? "white" : "rgba(255,255,255,0.7)"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  const renderRecentSearch = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => {
        setSearchQuery(item)
        handleSearch(item)
      }}
      className="bg-inputBG rounded-full px-4 py-2 mr-2 mb-2"
    >
      <Text className="text-primaryFont capitalize">{item}</Text>
    </TouchableOpacity>
  )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-primaryBG">
          {/* PlaceDetailModal Integration */}
          <PlaceDetailModal
            visible={placeDetailModalVisible}
            place={selectedPlaceDetail}
            onClose={() => {
              setPlaceDetailModalVisible(false);
              setSelectedPlaceDetail(null);
            }}
            getPhotoUrl={getPhotoUrl}
          />
          
          {/* Full Screen Map */}
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {/* Map Markers for Search Results */}
            {searchResults.map((place) => (
              <Marker
                key={place.place_id}
                coordinate={{
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                }}
                title={place.name}
                description={place.formatted_address}
                onPress={() => {
                  setSelectedPlaceDetail(place);
                  setPlaceDetailModalVisible(true);
                }}
              />
            ))}
          </MapView>
          
          {/* Floating Search Bar and Filter - Overlay on Map */}
          <View className="absolute left-4 right-4 z-10" style={{ top: 60 }}>
            {/* Search Bar with Filter */}
            <View className="flex-row items-center space-x-5">
              <View className="flex-1 flex-row items-center bg-primaryBG/70 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                <Ionicons name="search" size={20} color={colors.secondaryFont} />
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text)
                    if (text.trim() === '') {
                      setSearchResults([])
                      setSelectedCategory(null)
                    } else {
                      // Clear selected category when manually typing
                      setSelectedCategory(null)
                    }
                  }}
                  placeholder="Search for places..."
                  placeholderTextColor={colors.secondaryFont}
                  className="flex-1 text-primaryFont ml-3"
                  onSubmitEditing={() => handleSearch(searchQuery)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setSelectedCategory(null)
                  }}>
                    <Ionicons name="close" size={20} color={colors.secondaryFont} />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Filter Button */}
              <TouchableOpacity
                onPress={() => setFilterModalVisible(true)}
                className="relative bg-primaryBG/70 backdrop-blur-sm p-3 ml-3 rounded-lg shadow-lg"
              >
                <Ionicons name="filter" size={20} color={colors.secondaryFont} />
                {getActiveFiltersCount() > 0 && (
                  <View className="absolute -top-2 -right-2 bg-accentFont rounded-full w-5 h-5 justify-center items-center">
                    <Text className="text-white text-xs font-bold">
                      {getActiveFiltersCount()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Floating Categories Button */}
          {/* {(!categoriesModalVisible || isModalCollapsed) && (
            <TouchableOpacity
              onPress={() => isModalCollapsed ? expandModal() : showCategoriesModal()}
              className="absolute bottom-6 right-4 bg-accentFont rounded-full w-14 h-14 justify-center items-center shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                bottom: BOTTOM_TAB_HEIGHT + 24, // Position above navigation
              }}
            >
              <Ionicons name="grid" size={24} color="white" />
            </TouchableOpacity>
          )} */}

          {/* Draggable Bottom Categories Modal */}
          {categoriesModalVisible && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0, // Start from the very bottom of the screen
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  zIndex: 1000,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 20,
                  overflow: 'hidden',
                },
                animatedModalStyle,
              ]}
            >
              {/* Background Gradient */}
              <LinearGradient
                colors={['rgba(8, 12, 20, 0.99)', 'rgba(12, 17, 26, 0.99)', 'rgba(6, 10, 16, 1)']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />

              {/* Draggable Handle */}
              <PanGestureHandler onGestureEvent={modalGestureHandler}>
                <Animated.View className="items-center py-3 bg-transparent relative">
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      backgroundColor: '#9CA3AF',
                      borderRadius: 2,
                      marginBottom: 4,
                    }}
                  />
                  {isModalCollapsed && (
                    <TouchableOpacity
                      onPress={expandModal}
                      className="flex-row items-center px-4 py-2 bg-white/10 rounded-full mt-2"
                    >
                      <Text className="text-white text-sm font-medium mr-2">Discover Places</Text>
                      <Ionicons name="chevron-up" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </PanGestureHandler>
              
              {/* Modal Content - Hidden when collapsed */}
              {!isModalCollapsed && (
                <ScrollView 
                  className="flex-1 px-4 pb-2" 
                  style={{ paddingBottom: BOTTOM_TAB_HEIGHT }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Categories Header */}
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-white text-xl font-semibold">
                        Discover Places
                      </Text>
                      
                      {/* Location Selector */}
                      <TouchableOpacity 
                        onPress={() => setLocationModalVisible(true)}
                        className="flex-row items-center bg-transparent rounded-full px-3 py-2 border border-white/20"
                      >
                        <Ionicons name="location-outline" size={14} color="white" />
                        <Text className="text-white text-sm ml-1 mr-1" numberOfLines={1}>
                          {currentLocation.length > 12 ? currentLocation.substring(0, 12) + '...' : currentLocation}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color="white" />
                      </TouchableOpacity>
                    </View>
{/*                     
                    <Text className="text-gray-300 text-sm text-center">
                      Explore amazing locations around you
                    </Text> */}
                  </View>

                {/* Categories Content */}
                <SearchCategories 
                  selectedCategory={selectedCategory}
                  onCategorySelect={(query, categoryId) => {
                    setSearchQuery(query)
                    setSelectedCategory(categoryId)
                    handleSearch(query)
                  }} 
                />
                
                {/* Search Results in Modal if any */}
                {searchResults.length > 0 && !isLoading && (
                  <View className="mt-4">
                    {/* <Text className="text-white text-lg font-semibold mb-3">Search Results</Text> */}
                    <View className="flex-row flex-wrap justify-between">
                      {searchResults.slice(0, 6).map((item, index) => (
                        renderSearchResult({ item })
                      ))}
                    </View>
                    <TouchableOpacity 
                      className="bg-accentFont rounded-lg py-3 items-center mt-4"
                      onPress={() => {
                        collapseModal();
                        // Fit all markers in the map view
                        setTimeout(() => fitMarkersToMap(), 300);
                      }}
                    >
                      <Text className="text-white font-semibold">View All Results on Map ({searchResults.length})</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Loading */}
                {isLoading && (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color={colors.accentFont} />
                    <Text className="text-gray-300 mt-2">Searching places...</Text>
                  </View>
                )}
              </ScrollView>
              )}
            </Animated.View>
          )}

        {/* TripSelectModal Integration */}
        <TripSelectModal
          visible={tripModalVisible}
          trips={trips}
          onSelect={async (selectedTrip) => {
            if (!user || !placeToSave) return;
            const savedPlace: CreateSavedPlaceInput = {
              place_id: placeToSave.place_id,
              name: placeToSave.name,
              address: placeToSave.formatted_address,
              rating: placeToSave.rating,
              type: placeToSave.types[0] || 'place',
              category: getCategoryFromTypes(placeToSave.types),
              latitude: placeToSave.geometry.location.lat,
              longitude: placeToSave.geometry.location.lng,
              image_url: placeToSave.photos?.[0] ? getPhotoUrl(placeToSave.photos[0].photo_reference) : undefined,
              photos: placeToSave.photos?.map(photo => getPhotoUrl(photo.photo_reference)) || [],
              trip_id: selectedTrip.id,
            };
            await savedPlacesService.savePlace(user.id, savedPlace);
            setSavedPlaces(prev => [...prev, placeToSave.place_id]);
            setTripModalVisible(false);
            setPlaceToSave(null);
            Alert.alert('Success', 'Place saved to trip successfully!');
          }}
          onCancel={() => {
            setTripModalVisible(false);
            setPlaceToSave(null);
          }}
        />

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <SafeAreaView className="flex-1 bg-primaryBG">
            {/* Filter Header */}
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
              <Text className="text-primaryFont text-xl font-bold">Filters</Text>
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={clearFilters}
                  className="mr-4"
                >
                  <Text className="text-accentFont font-semibold">Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.primaryFont} />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-1 px-4 py-4">
              {/* Place Types */}
              <Text className="text-primaryFont text-lg font-semibold mb-3">Place Types</Text>
              <View className="flex-row flex-wrap mb-6">
                {filterOptions.types.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        types: prev.types.includes(type.value)
                          ? prev.types.filter(t => t !== type.value)
                          : [...prev.types, type.value]
                      }))
                    }}
                    className={`flex-row items-center px-3 py-2 rounded-full mr-2 mb-2 border ${
                      filters.types.includes(type.value)
                        ? 'bg-accentFont border-accentFont'
                        : 'bg-inputBG border-border'
                    }`}
                  >
                    <Text className="mr-2">{type.icon}</Text>
                    <Text className={`${
                      filters.types.includes(type.value)
                        ? 'text-white'
                        : 'text-primaryFont'
                    }`}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating Filter */}
              <Text className="text-primaryFont text-lg font-semibold mb-3">Minimum Rating</Text>
              <View className="flex-row flex-wrap mb-6">
                {filterOptions.ratings.map((rating) => (
                  <TouchableOpacity
                    key={rating.value}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        rating: prev.rating === rating.value ? null : rating.value
                      }))
                    }}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${
                      filters.rating === rating.value
                        ? 'bg-accentFont border-accentFont'
                        : 'bg-inputBG border-border'
                    }`}
                  >
                    <Text className={`${
                      filters.rating === rating.value
                        ? 'text-white'
                        : 'text-primaryFont'
                    }`}>
                      {rating.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Level Filter */}
              <Text className="text-primaryFont text-lg font-semibold mb-3">Price Level</Text>
              <View className="flex-row flex-wrap mb-6">
                {filterOptions.priceLevels.map((price) => (
                  <TouchableOpacity
                    key={price.value}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        priceLevel: prev.priceLevel === price.value ? null : price.value
                      }))
                    }}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${
                      filters.priceLevel === price.value
                        ? 'bg-accentFont border-accentFont'
                        : 'bg-inputBG border-border'
                    }`}
                  >
                    <Text className={`${
                      filters.priceLevel === price.value
                        ? 'text-white'
                        : 'text-primaryFont'
                    }`}>
                      {price.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort By */}
              <Text className="text-primaryFont text-lg font-semibold mb-3">Sort By</Text>
              <View className="flex-row flex-wrap mb-6">
                {filterOptions.sortOptions.map((sort) => (
                  <TouchableOpacity
                    key={sort.value}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        sortBy: sort.value as 'relevance' | 'rating' | 'distance'
                      }))
                    }}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${
                      filters.sortBy === sort.value
                        ? 'bg-accentFont border-accentFont'
                        : 'bg-inputBG border-border'
                    }`}
                  >
                    <Text className={`${
                      filters.sortBy === sort.value
                        ? 'text-white'
                        : 'text-primaryFont'
                    }`}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Open Now Toggle */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-primaryFont text-lg font-semibold">Open Now</Text>
                <TouchableOpacity
                  onPress={() => {
                    setFilters(prev => ({
                      ...prev,
                      openNow: !prev.openNow
                    }))
                  }}
                  className={`w-12 h-6 rounded-full ${
                    filters.openNow ? 'bg-accentFont' : 'bg-inputBG'
                  } justify-center`}
                >
                  <View className={`w-5 h-5 rounded-full bg-white ${
                    filters.openNow ? 'self-end mr-0.5' : 'self-start ml-0.5'
                  }`} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Apply Filters Button */}
            <View className="px-4 pb-4">
              <TouchableOpacity
                onPress={() => {
                  setFilterModalVisible(false)
                  if (searchQuery.trim()) {
                    handleSearch(searchQuery)
                  }
                }}
                className="bg-accentFont rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold text-lg">
                  Apply Filters ({getActiveFiltersCount()})
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Location Selection Modal */}
        <Modal
          visible={locationModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleLocationCancel}
        >
          <SafeAreaView className="flex-1 bg-primaryBG">
            {/* Location Modal Header */}
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
              <Text className="text-primaryFont text-xl font-bold">Select Location</Text>
              <TouchableOpacity onPress={handleLocationCancel}>
                <Ionicons name="close" size={24} color={colors.primaryFont} />
              </TouchableOpacity>
            </View>

            <View className="flex-1 px-4 py-6">
              <Text className="text-primaryFont text-lg font-semibold mb-4">
                Select Location
              </Text>
              <Text className="text-secondaryFont text-sm mb-4">
                Search for cities, countries, or specific places to discover nearby attractions
              </Text>
              
              <TextInput
                className="bg-inputBG border border-border rounded-lg px-4 py-3 text-primaryFont text-base mb-4"
                placeholder="e.g., New York, Tokyo, London..."
                placeholderTextColor={colors.secondaryFont}
                value={locationInput}
                onChangeText={handleLocationSearch}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleLocationSelect}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowLocationSuggestions(true)
                  }
                }}
              />

              {/* Location Suggestions */}
              {showLocationSuggestions && (
                <View className="bg-inputBG border border-border rounded-lg mb-4 max-h-64">
                  <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                    {searchingLocations ? (
                      <View className="px-4 py-3">
                        <Text className="text-secondaryFont text-sm">Searching locations...</Text>
                      </View>
                    ) : locationSuggestions.length > 0 ? (
                      locationSuggestions.map((place) => (
                        <TouchableOpacity
                          key={place.id}
                          className="px-4 py-3 border-b border-border/30 last:border-b-0"
                          onPress={() => handleLocationSuggestionSelect(place)}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-start">
                            <View className="w-8 h-8 rounded-full bg-accentFont/20 items-center justify-center mr-3 mt-0.5">
                              <Text className="text-sm">📍</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-primaryFont font-semibold text-base">
                                {place.name || 'Unknown Place'}
                              </Text>
                              {place.address && (
                                <Text className="text-secondaryFont text-sm mt-0.5" numberOfLines={2}>
                                  {place.address}
                                </Text>
                              )}
                              {place.type && (
                                <Text className="text-secondaryFont/70 text-xs mt-1 capitalize">
                                  {place.type.replace(/_/g, ' ')}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View className="px-4 py-3">
                        <Text className="text-secondaryFont text-sm">No locations found. Try searching for cities, countries, or places.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                onPress={handleLocationSelect}
                disabled={!locationInput.trim()}
                className={`rounded-lg py-3 items-center ${
                  locationInput.trim() 
                    ? 'bg-accentFont' 
                    : 'bg-gray-400'
                }`}
              >
                <Text className="text-white font-semibold text-lg">
                  Set Location
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCurrentLocation('Current Location');
                  setLocationModalVisible(false);
                  setLocationInput('');
                  setLocationSuggestions([]);
                  setShowLocationSuggestions(false);
                  // Re-run search with current location if there's an active search
                  if (searchQuery.trim()) {
                    handleSearch(searchQuery);
                  }
                }}
                className="rounded-lg py-3 items-center mt-3 bg-white/10 border border-white/20"
              >
                <Text className="text-white font-semibold text-lg">
                  Use Current Location
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
        </View>
    </GestureHandlerRootView>
  )
}

export default DiscoverScreen