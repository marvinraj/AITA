import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '../constants/colors';
import { addLocationDataToTripItems, getDestinationCoordinates } from '../lib/locationUtils';
import { supabase } from '../lib/supabase';
import { animateToUserLocation } from '../lib/utils/userLocationUtils';
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
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: colors.primaryBG }}>
        <Text className="text-lg font-UrbanistSemiBold" style={{ color: colors.primaryFont }}>Loading map...</Text>
      </SafeAreaView>
    );
  }

  // Safety check for tripId
  if (!tripId) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: colors.primaryBG }}>
        <Text className="text-lg font-UrbanistSemiBold" style={{ color: colors.accentFont }}>Invalid trip ID</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-4 py-2 rounded" style={{ backgroundColor: colors.buttonPrimaryBG }}>
          <Text className="font-UrbanistSemiBold" style={{ color: colors.primaryFont }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Wrap the main component in a try-catch
  try {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.primaryBG }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4" style={{ backgroundColor: colors.primaryBG, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
            <Ionicons name="arrow-back" size={24} color={colors.primaryFont} />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-lg font-UrbanistSemiBold" style={{ color: colors.primaryFont }}>
              {tripInfo?.name || 'Trip Map'}
            </Text>
            {tripInfo?.destination && (
              <Text className="text-sm font-UrbanistRegular" style={{ color: colors.secondaryFont }}>
                {tripInfo.destination}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            onPress={() => animateToUserLocation(mapRef)}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.accentFont }}
          >
            <Ionicons name="locate" size={20} color={colors.primaryBG} />
          </TouchableOpacity>
        </View>

      {/* Date Filter */}
      <View className="p-4" style={{ backgroundColor: colors.secondaryBG, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text className="text-sm font-UrbanistSemiBold mb-3" style={{ color: colors.primaryFont }}>Filter by Date:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => handleDateSelection('all')}
            className={`mr-3 px-4 py-2 rounded-full ${
              selectedDate === 'all' ? '' : ''
            }`}
            style={{ 
              backgroundColor: selectedDate === 'all' ? colors.accentFont : colors.inputBG,
              borderWidth: selectedDate === 'all' ? 0 : 1,
              borderColor: colors.border
            }}
          >
            <Text className="text-sm font-UrbanistSemiBold" style={{ 
              color: selectedDate === 'all' ? colors.primaryBG : colors.primaryFont 
            }}>
              All Days
            </Text>
          </TouchableOpacity>
          
          {availableDates.map(date => (
            <TouchableOpacity
              key={date}
              onPress={() => handleDateSelection(date)}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedDate === date ? '' : ''
              }`}
              style={{ 
                backgroundColor: selectedDate === date ? colors.accentFont : colors.inputBG,
                borderWidth: selectedDate === date ? 0 : 1,
                borderColor: colors.border
              }}
            >
              <Text className="text-sm font-UrbanistSemiBold" style={{ 
                color: selectedDate === date ? colors.primaryBG : colors.primaryFont 
              }}>
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
        customMapStyle={[
          {
            "featureType": "all",
            "elementType": "geometry",
            "stylers": [{"color": "#1d2c4d"}]
          },
          {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#8ec3b9"}]
          },
          {
            "featureType": "all",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#1a3646"}]
          },
          {
            "featureType": "administrative.country",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#4b6878"}]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#64779e"}]
          },
          {
            "featureType": "administrative.province",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#4b6878"}]
          },
          {
            "featureType": "landscape.man_made",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#334e87"}]
          },
          {
            "featureType": "landscape.natural",
            "elementType": "geometry",
            "stylers": [{"color": "#023e58"}]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{"color": "#283d6a"}]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#6f9ba5"}]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#1d2c4d"}]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#023e58"}]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#3C7680"}]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{"color": "#304a7d"}]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#98a5be"}]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#1d2c4d"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{"color": "#2c6675"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#255763"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#b0d5ce"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#023e58"}]
          },
          {
            "featureType": "transit",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#98a5be"}]
          },
          {
            "featureType": "transit",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#1d2c4d"}]
          },
          {
            "featureType": "transit.line",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#283d6a"}]
          },
          {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [{"color": "#3a4762"}]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{"color": "#0e1626"}]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#4e6d70"}]
          }
        ]}
      >
        {/* Markers for activities */}
        {filteredItems
          .sort((a, b) => {
            // Sort by time within the same date
            if (a.time && b.time) {
              return a.time.localeCompare(b.time);
            }
            // Fallback to item_order if time is not available
            return a.item_order - b.item_order;
          })
          .map((item, index) => {
            // Create a numbered marker for clear ordering
            const orderNumber = index + 1;
            
            // Format time for display
            const formatTime = (time?: string) => {
              if (!time) return '';
              const [hours, minutes] = time.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour % 12 || 12;
              return `${displayHour}:${minutes} ${ampm}`;
            };
            
            return (
              <Marker
                key={item.id}
                coordinate={{
                  latitude: item.latitude!,
                  longitude: item.longitude!,
                }}
                title={`${orderNumber}. ${item.title}`}
                description={
                  item.time 
                    ? `${formatTime(item.time)} • ${item.description || ''} • ${new Date(item.date).toLocaleDateString()}`
                    : `${item.description || ''} • ${new Date(item.date).toLocaleDateString()}`
                }
              >
                <View className="w-8 h-8 rounded-full items-center justify-center border-2 shadow-lg" style={{ backgroundColor: colors.accentFont, borderColor: colors.primaryFont }}>
                  <Text className="font-bold text-sm" style={{ color: colors.primaryBG }}>
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
          <View
            style={{
              backgroundColor: colors.secondaryBG,
              padding: 24,
              borderRadius: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.primaryBG,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name="location-outline" size={48} color={colors.secondaryFont} style={{ marginBottom: 12 }} />
            <Text className="text-lg font-UrbanistSemiBold mb-2" style={{ color: colors.primaryFont }}>
              No locations found
            </Text>
            <Text className="text-sm font-UrbanistRegular text-center mb-4" style={{ color: colors.secondaryFont }}>
              {selectedDate === 'all' 
                ? 'Add location data to your itinerary items to see them pinned on the map'
                : `No activities with locations found for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
              }
            </Text>
            {selectedDate === 'all' && (
              <TouchableOpacity 
                onPress={handleFetchLocationData}
                disabled={fetchingLocations}
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: colors.accentFont }}
              >
                <Text className="font-UrbanistSemiBold" style={{ color: colors.primaryBG }}>
                  {fetchingLocations ? 'Fetching Locations...' : 'Auto-Add Locations'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Activity Count */}
      <View className="absolute bottom-4 left-4 right-4">
        <View
          style={{
            backgroundColor: `${colors.primaryBG}CC`,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text className="text-sm font-UrbanistSemiBold" style={{ color: colors.primaryFont }}>
            {filteredItems.length} {filteredItems.length === 1 ? 'location' : 'locations'} shown
            {selectedDate !== 'all' && ` for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
  } catch (error) {
    console.error('Map component error:', error);
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: colors.primaryBG }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.accentFont} style={{ marginBottom: 16 }} />
        <Text className="text-lg font-UrbanistSemiBold mb-4" style={{ color: colors.accentFont }}>Map Error</Text>
        <Text className="text-sm text-center px-4 mb-4" style={{ color: colors.secondaryFont }}>
          There was an error loading the map. Please try again.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="px-4 py-2 rounded" style={{ backgroundColor: colors.buttonPrimaryBG }}>
          <Text className="font-UrbanistSemiBold" style={{ color: colors.primaryFont }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}
