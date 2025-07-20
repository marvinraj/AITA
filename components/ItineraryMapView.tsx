import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '../constants/colors';
import { addLocationDataToTripItems, getDestinationCoordinates } from '../lib/locationUtils';
import { supabase } from '../lib/supabase';
import { ItineraryItem, Trip } from '../types/database';

interface ItineraryMapViewProps {
  trip: Trip;
  height: number;
}

export default function ItineraryMapView({ trip, height }: ItineraryMapViewProps) {
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (trip?.id) {
      fetchItineraryItems();
    }
  }, [trip?.id]);

  const handleFetchLocationData = async () => {
    setFetchingLocations(true);
    try {
      await addLocationDataToTripItems(trip.id);
      Alert.alert('Success', 'Location data has been added to your activities!');
      await fetchItineraryItems();
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
      
      if (firstDateItems.length > 0 && selectedDate === 'all') {
        setSelectedDate(firstDate);
        
        setTimeout(() => {
          if (mapRef.current) {
            const coordinates = firstDateItems.map(item => ({
              latitude: item.latitude!,
              longitude: item.longitude!,
            }));
            
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 20, right: 20, bottom: 20, left: 20 },
              animated: true,
            });
          }
        }, 500);
      }
    }
  }, [fetchingLocations, availableDates, itineraryItems]);

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
            edgePadding: { top: 20, right: 20, bottom: 20, left: 20 },
            animated: true,
          });
        }, 300);
      }
    } else {
      if (itineraryItems.length > 0 && mapRef.current) {
        setTimeout(() => {
          const coordinates = itineraryItems.map(item => ({
            latitude: item.latitude!,
            longitude: item.longitude!,
          }));
          
          mapRef.current!.fitToCoordinates(coordinates, {
            edgePadding: { top: 20, right: 20, bottom: 20, left: 20 },
            animated: true,
          });
        }, 300);
      }
    }
  };

  const fetchItineraryItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', trip.id)
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
      
      // Extract unique dates from all items
      const dates = [...new Set(data?.map((item: ItineraryItem) => 
        new Date(item.date).toDateString()
      ) || [])] as string[];
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching itinerary items:', error);
      setItineraryItems([]);
      setAvailableDates([]);
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
      if (trip?.destination) {
        const coords = getDestinationCoordinates(trip.destination);
        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
      }
      
      // Final fallback
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    } catch (error) {
      console.error('Error calculating initial region:', error);
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
      <View className="flex-1 justify-center items-center" style={{ height }}>
        <Text className="text-sm text-secondaryFont">Loading map...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ height }}>
      {/* Map */}
      <View className="flex-1 relative">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          showsUserLocation={Platform.OS === 'ios'}
          showsMyLocationButton={false}
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
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{"color": "#0e1626"}]
            }
          ]}
        >
          {/* Markers for activities */}
          {filteredItems
            .sort((a, b) => {
              if (a.time && b.time) {
                return a.time.localeCompare(b.time);
              }
              return a.item_order - b.item_order;
            })
            .map((item, index) => {
              const orderNumber = index + 1;
              
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
                      ? `${formatTime(item.time)} • ${item.description || ''}`
                      : `${item.description || ''}`
                  }
                >
                  <View className="w-6 h-6 rounded-full items-center justify-center border-2 shadow-lg" style={{ backgroundColor: colors.accentFont, borderColor: colors.primaryFont }}>
                    <Text className="font-bold text-xs" style={{ color: colors.primaryBG }}>
                      {orderNumber}
                    </Text>
                  </View>
                </Marker>
              );
            })}
        </MapView>

        {/* Floating Date Filter Button */}
        <View className="absolute top-4 right-4 z-10">
          <TouchableOpacity
            onPress={() => setShowDateDropdown(!showDateDropdown)}
            className="px-4 py-4 rounded-full justify-center items-center shadow-lg bg-primaryFont"
          >
            <Ionicons name="calendar" size={18} color={colors.primaryBG} />
          </TouchableOpacity>

          {/* Date Dropdown */}
          {showDateDropdown && (
            <View 
              className="absolute top-14 right-0 rounded-xl border shadow-lg min-w-32"
              style={{ 
                backgroundColor: colors.primaryBG,
                borderColor: colors.border,
                maxHeight: 300,
              }}
            >
              <ScrollView 
                style={{ maxHeight: 250 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <TouchableOpacity
                  onPress={() => {
                    handleDateSelection('all');
                    setShowDateDropdown(false);
                  }}
                  className="px-4 py-3 border-b"
                  style={{ 
                    backgroundColor: selectedDate === 'all' ? colors.accentFont + '20' : 'transparent',
                    borderBottomColor: colors.border
                  }}
                >
                  <Text 
                    className="text-sm font-InterBold"
                    style={{ 
                      color: selectedDate === 'all' ? colors.accentFont : colors.primaryFont 
                    }}
                  >
                    All Days
                  </Text>
                </TouchableOpacity>
                
                {availableDates.map((date, index) => (
                  <TouchableOpacity
                    key={date}
                    onPress={() => {
                      handleDateSelection(date);
                      setShowDateDropdown(false);
                    }}
                    className="px-4 py-3"
                    style={{ 
                      backgroundColor: selectedDate === date ? colors.accentFont + '20' : 'transparent',
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < availableDates.length - 1 ? 1 : 0
                    }}
                  >
                    <Text 
                      className="text-sm font-InterBold"
                      style={{ 
                        color: selectedDate === date ? colors.accentFont : colors.primaryFont 
                      }}
                    >
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* No Items Message */}
        {filteredItems.length === 0 && (
          <View className="absolute inset-0 justify-center items-center p-4">
            <View
              className="bg-secondaryBG p-4 rounded-2xl items-center border border-border"
              style={{ maxWidth: '90%' }}
            >
              <Ionicons name="location-outline" size={32} color={colors.secondaryFont} style={{ marginBottom: 8 }} />
              <Text className="text-sm font-InterBold mb-2 text-primaryFont text-center">
                No locations found
              </Text>
              <Text className="text-xs text-secondaryFont text-center mb-3">
                {selectedDate === 'all' 
                  ? 'Add location data to your itinerary items'
                  : `No activities with locations for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                }
              </Text>
              {selectedDate === 'all' && (
                <TouchableOpacity 
                  onPress={handleFetchLocationData}
                  disabled={fetchingLocations}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.accentFont }}
                >
                  <Text className="text-xs font-InterBold text-primaryBG">
                    {fetchingLocations ? 'Adding...' : 'Auto-Add Locations'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Activity Count */}
        {filteredItems.length > 0 && (
          <View className="absolute bottom-2 left-2 right-2">
            <View
              className="bg-primaryBG/90 p-2 rounded-lg items-center border border-border"
            >
              <Text className="text-xs font-InterBold text-primaryFont">
                {filteredItems.length} {filteredItems.length === 1 ? 'location' : 'locations'} shown
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
