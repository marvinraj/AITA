import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { addLocationDataToTripItems, getDestinationCoordinates } from '../lib/locationUtils';
import { supabase } from '../lib/supabase';
import { ItineraryItem } from '../types/database';

export default function MapScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripInfo, setTripInfo] = useState<any>(null);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchTripAndItems();
  }, [tripId]);

  const handleFetchLocationData = async () => {
    setFetchingLocations(true);
    try {
      await addLocationDataToTripItems(tripId as string);
      Alert.alert('Success', 'Location data has been added to your activities!');
      // Refresh the data
      await fetchTripAndItems();
    } catch (error) {
      console.error('Error fetching location data:', error);
      Alert.alert('Error', 'Failed to fetch location data. Please try again.');
    } finally {
      setFetchingLocations(false);
    }
  };

  // Effect to handle auto-selection of first date after location data is fetched
  useEffect(() => {
    if (!fetchingLocations && availableDates.length > 0 && itineraryItems.length > 0) {
      const firstDate = availableDates[0];
      const firstDateItems = itineraryItems.filter(item => 
        new Date(item.date).toDateString() === firstDate
      );
      
      // Only auto-select if we have items with location data for the first date
      if (firstDateItems.length > 0 && selectedDate === 'all') {
        setSelectedDate(firstDate);
        
        // Animate to the first date's locations
        setTimeout(() => {
          if (mapRef.current) {
            const coordinates = firstDateItems.map(item => ({
              latitude: item.latitude!,
              longitude: item.longitude!,
            }));
            
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        }, 500);
      }
    }
  }, [fetchingLocations, availableDates, itineraryItems]);

  // Function to handle date selection and animate to that date's locations
  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    
    if (date !== 'all') {
      const dateItems = itineraryItems.filter(item => 
        new Date(item.date).toDateString() === date
      );
      
      if (dateItems.length > 0 && mapRef.current) {
        setTimeout(() => {
          const coordinates = dateItems.map(item => ({
            latitude: item.latitude!,
            longitude: item.longitude!,
          }));
          
          mapRef.current!.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }, 300);
      }
    } else {
      // For "all" view, fit to all items
      if (itineraryItems.length > 0 && mapRef.current) {
        setTimeout(() => {
          const coordinates = itineraryItems.map(item => ({
            latitude: item.latitude!,
            longitude: item.longitude!,
          }));
          
          mapRef.current!.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }, 300);
      }
    }
  };

  const fetchTripAndItems = async () => {
    try {
      setLoading(true);
      
      // Fetch trip info for fallback location
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) {
        console.error('Trip fetch error:', tripError);
        setTripInfo(null);
      } else {
        setTripInfo(tripData);
      }

      // Fetch itinerary items
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Items fetch error:', error);
        setItineraryItems([]);
        setAvailableDates([]);
        return;
      }

      
      
      // Filter items that have valid location data
      const itemsWithLocation = data?.filter(item => 
        item.latitude !== null && 
        item.longitude !== null &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number' &&
        !isNaN(item.latitude) &&
        !isNaN(item.longitude) &&
        item.latitude >= -90 && item.latitude <= 90 &&
        item.longitude >= -180 && item.longitude <= 180
      ) || [];
      
      
      
      setItineraryItems(itemsWithLocation);
      
      // Extract unique dates from all items (not just those with location)
      const dates = [...new Set(data?.map((item: ItineraryItem) => 
        new Date(item.date).toDateString()
      ) || [])] as string[];
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load trip data. Please try again.');
      setItineraryItems([]);
      setAvailableDates([]);
      setTripInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedDate === 'all' 
    ? itineraryItems 
    : itineraryItems.filter(item => 
        new Date(item.date).toDateString() === selectedDate
      );

  const initialRegion = (() => {
    try {
      if (itineraryItems.length > 0 && itineraryItems[0].latitude && itineraryItems[0].longitude) {
        const lat = itineraryItems[0].latitude;
        const lng = itineraryItems[0].longitude;
        
        // Validate coordinates
        if (typeof lat === 'number' && typeof lng === 'number' && 
            !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
        }
      }
      
      // Use trip destination as fallback
      if (tripInfo?.destination) {
        const coords = getDestinationCoordinates(tripInfo.destination);
        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
      }
      
      // Final fallback to San Francisco
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    } catch (error) {
      console.error('Error calculating initial region:', error);
      // Safe fallback
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
  })();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-lg font-UrbanistSemiBold">Loading map...</Text>
      </SafeAreaView>
    );
  }

  // Safety check for tripId
  if (!tripId) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-lg font-UrbanistSemiBold text-red-600">Invalid trip ID</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-500 px-4 py-2 rounded">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Wrap the main component in a try-catch
  try {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-lg text-blue-600 font-UrbanistSemiBold">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-lg font-UrbanistSemiBold text-gray-800">
              {tripInfo?.name || 'Trip Map'}
            </Text>
            {tripInfo?.destination && (
              <Text className="text-sm text-gray-500 font-UrbanistRegular">
                {tripInfo.destination}
              </Text>
            )}
          </View>
          <View style={{ width: 60 }} />
        </View>

      {/* Date Filter */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-sm font-UrbanistSemiBold mb-2 text-gray-700">Filter by Date:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => handleDateSelection('all')}
            className={`mr-2 px-3 py-1 rounded-full ${
              selectedDate === 'all' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text className={`text-sm font-UrbanistRegular ${
              selectedDate === 'all' ? 'text-white' : 'text-gray-700'
            }`}>
              All Days
            </Text>
          </TouchableOpacity>
          
          {availableDates.map(date => (
            <TouchableOpacity
              key={date}
              onPress={() => handleDateSelection(date)}
              className={`mr-2 px-3 py-1 rounded-full ${
                selectedDate === date ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-sm font-UrbanistRegular ${
                selectedDate === date ? 'text-white' : 'text-gray-700'
              }`}>
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={Platform.OS === 'ios'}
        showsMyLocationButton={Platform.OS === 'ios'}
      >
        {/* Markers for activities */}
        {filteredItems
          .sort((a, b) => a.item_order - b.item_order)
          .map((item, index) => {
            // Create a numbered marker for clear ordering
            const orderNumber = index + 1;
            
            return (
              <Marker
                key={item.id}
                coordinate={{
                  latitude: item.latitude!,
                  longitude: item.longitude!,
                }}
                title={`${orderNumber}. ${item.title}`}
                description={item.description ? 
                  `${item.description} • ${new Date(item.date).toLocaleDateString()}` : 
                  `${new Date(item.date).toLocaleDateString()}`
                }
              >
                <View className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-lg">
                  <Text className="text-white font-bold text-sm">
                    {orderNumber}
                  </Text>
                </View>
              </Marker>
            );
          })}
      </MapView>

      {/* No Items Message */}
      {filteredItems.length === 0 && (
        <View className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2">
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={{
              padding: 20,
              borderRadius: 12,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text className="text-lg font-UrbanistSemiBold text-gray-800 mb-2">
              No locations found
            </Text>
            <Text className="text-sm text-gray-600 font-UrbanistRegular text-center mb-4">
              {selectedDate === 'all' 
                ? 'Add location data to your itinerary items to see them pinned on the map'
                : `No activities with locations found for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
              }
            </Text>
            {selectedDate === 'all' && (
              <TouchableOpacity 
                onPress={handleFetchLocationData}
                disabled={fetchingLocations}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-UrbanistSemiBold">
                  {fetchingLocations ? 'Fetching Locations...' : 'Auto-Add Locations'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      )}

      {/* Activity Count */}
      <View className="absolute bottom-4 left-4 right-4">
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={{
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text className="text-white text-sm font-UrbanistSemiBold">
            {filteredItems.length} {filteredItems.length === 1 ? 'location' : 'locations'} shown
            {selectedDate !== 'all' && ` for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </Text>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
  } catch (error) {
    console.error('Map component error:', error);
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-lg font-UrbanistSemiBold text-red-600 mb-4">Map Error</Text>
        <Text className="text-sm text-gray-600 mb-4 text-center px-4">
          There was an error loading the map. Please try again.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-500 px-4 py-2 rounded">
          <Text className="text-white font-UrbanistSemiBold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}
