import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlaceDetailModal from '../../../components/PlaceDetailModal'
import SearchCategories from '../../../components/SearchCategories'
import TripSelectModal from '../../../components/TripSelectModal'
import { colors } from '../../../constants/colors'
import { GooglePlace, googlePlacesService } from '../../../lib/services/googlePlacesService'
import { CreateSavedPlaceInput, SavedPlace, savedPlacesService } from '../../../lib/services/savedPlacesService'
import { supabase } from '../../../lib/supabase'

const DiscoverScreen = () => {
  // PlaceDetailModal state
  const [placeDetailModalVisible, setPlaceDetailModalVisible] = useState(false);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<GooglePlace | null>(null);
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [savedPlaces, setSavedPlaces] = useState<string[]>([])
  const [trips, setTrips] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  // Modal state for trip selection
  const [tripModalVisible, setTripModalVisible] = useState(false)
  const [placeToSave, setPlaceToSave] = useState<GooglePlace | null>(null)

  useEffect(() => {
    getCurrentUser()
    loadSavedPlaces()
    loadRecentSearches()
    loadTrips()
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

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const results = await googlePlacesService.searchGooglePlaces(query)
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
        className="bg-secondaryBG rounded-lg p-4 mb-3 border border-border"
        onPress={() => {
          setSelectedPlaceDetail(item);
          setPlaceDetailModalVisible(true);
        }}
      >
        <View className="flex-row items-start">
          {/* Place Image */}
          <View className="w-20 h-20 rounded-lg mr-3 bg-inputBG justify-center items-center">
            {item.photos && item.photos.length > 0 ? (
              <Image
                source={{ uri: getPhotoUrl(item.photos[0].photo_reference) }}
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="image-outline" size={24} color={colors.secondaryFont} />
            )}
          </View>

          {/* Place Details */}
          <View className="flex-1">
            <Text className="text-primaryFont font-semibold text-lg mb-1" numberOfLines={2}>
              {item.name}
            </Text>
            <Text className="text-secondaryFont text-sm mb-2" numberOfLines={2}>
              {item.formatted_address}
            </Text>
            {/* Rating */}
            {item.rating && (
              <View className="flex-row items-center mb-2">
                <View className="flex-row mr-2">
                  {getRatingStars(item.rating)}
                </View>
                <Text className="text-secondaryFont text-sm">
                  {item.rating} ({item.user_ratings_total || 0} reviews)
                </Text>
              </View>
            )}
            {/* Place Type */}
            <Text className="text-accentFont text-sm capitalize">
              {item.types[0]?.replace(/_/g, ' ')}
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={() => handleSavePlace(item)}
            className={`p-2 rounded-lg ${isPlaceSaved ? 'bg-accentFont' : 'bg-inputBG'} self-start`}
          >
            <Ionicons
              name={isPlaceSaved ? "heart" : "heart-outline"}
              size={20}
              color={isPlaceSaved ? colors.primaryFont : colors.secondaryFont}
            />
          </TouchableOpacity>
        </View>
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
    <SafeAreaView className="flex-1 bg-primaryBG">
      <View className="flex-1 px-4">
        {/* PlaceDetailModal Integration (moved to top level) */}
        <PlaceDetailModal
          visible={placeDetailModalVisible}
          place={selectedPlaceDetail}
          onClose={() => {
            setPlaceDetailModalVisible(false);
            setSelectedPlaceDetail(null);
          }}
          getPhotoUrl={getPhotoUrl}
        />
        {/* Header */}
        <View className="flex-row justify-between items-center py-4">
          <Text className="text-primaryFont text-2xl font-bold">Discover</Text>
          <TouchableOpacity>
            <Ionicons name="filter" size={24} color={colors.primaryFont} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-inputBG rounded-lg px-4 py-3 mb-4">
          <Ionicons name="search" size={20} color={colors.secondaryFont} />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text)
              // Clear results when search query is empty
              if (text.trim() === '') {
                setSearchResults([])
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
            }}>
              <Ionicons name="close" size={20} color={colors.secondaryFont} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Categories */}
        {searchResults.length === 0 && !isLoading && (
          <SearchCategories onCategorySelect={(query) => {
            setSearchQuery(query)
            handleSearch(query)
          }} />
        )}

        {/* Recent Searches */}
        {searchResults.length === 0 && !isLoading && (
          <View className="mb-4">
            <Text className="text-primaryFont text-lg font-semibold mb-3">Recent Searches</Text>
            <FlatList
              data={recentSearches}
              renderItem={renderRecentSearch}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            />
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.accentFont} />
            <Text className="text-secondaryFont mt-2">Searching places...</Text>
          </View>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !isLoading && (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.place_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        {/* No Results */}
        {searchResults.length === 0 && !isLoading && searchQuery.length > 0 && (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="search-outline" size={64} color={colors.secondaryFont} />
            <Text className="text-secondaryFont text-lg mt-4">No places found</Text>
            <Text className="text-secondaryFont text-center mt-2">
              Try searching for restaurants, hotels, or attractions
            </Text>
          </View>
        )}

        {/* Welcome Message */}
        {searchResults.length === 0 && !isLoading && searchQuery.length === 0 && (
          <View className="flex-1 justify-center items-center px-8">
            <Ionicons name="compass-outline" size={64} color={colors.accentFont} />
            <Text className="text-primaryFont text-xl font-semibold mt-4 text-center">
              Discover Amazing Places
            </Text>
            <Text className="text-secondaryFont text-center mt-2">
              Search for restaurants, hotels, attractions, and more. Save your favorite places for easy access.
            </Text>
          </View>
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
      </View>
    </SafeAreaView>
  )
}

export default DiscoverScreen