import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { ItineraryItem } from '../types/database';

export default function SimpleMapScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripInfo, setTripInfo] = useState<any>(null);

  useEffect(() => {
    fetchTripAndItems();
  }, [tripId]);

  const fetchTripAndItems = async () => {
    try {
      setLoading(true);
      
      // Fetch trip info
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (!tripError) {
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
        return;
      }

      console.log('All itinerary items:', data);
      
      // Filter items that have valid location data
      const itemsWithLocation = data?.filter(item => 
        item.latitude !== null && 
        item.longitude !== null &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number'
      ) || [];
      
      console.log('Items with valid location:', itemsWithLocation);
      
      setItineraryItems(itemsWithLocation);
      
      // Extract unique dates
      const dates = [...new Set(data?.map((item: ItineraryItem) => 
        new Date(item.date).toDateString()
      ) || [])] as string[];
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load trip data');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedDate === 'all' 
    ? itineraryItems 
    : itineraryItems.filter(item => 
        new Date(item.date).toDateString() === selectedDate
      );

  const openInMaps = (latitude: number, longitude: number, title: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Alert.alert(
      'Open in Maps',
      `Would you like to open ${title} in your default map app?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => {
          // This would need Linking.openURL(url) in a real app
          console.log('Opening:', url);
        }}
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-lg font-UrbanistSemiBold">Loading trip data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-lg text-blue-600 font-UrbanistSemiBold">← Back</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-lg font-UrbanistSemiBold text-gray-800">
            {tripInfo?.name || 'Trip Locations'}
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
            onPress={() => setSelectedDate('all')}
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
              onPress={() => setSelectedDate(date)}
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

      {/* Location List */}
      <ScrollView className="flex-1 p-4">
        {filteredItems.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-lg font-UrbanistSemiBold text-gray-800 mb-2">
              No locations found
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              Add location data to your itinerary items to see them here
            </Text>
          </View>
        ) : (
          filteredItems
            .sort((a, b) => a.item_order - b.item_order)
            .map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => openInMaps(item.latitude!, item.longitude!, item.title)}
                className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-UrbanistSemiBold text-gray-800">
                      {index + 1}. {item.title}
                    </Text>
                    {item.description && (
                      <Text className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </Text>
                    )}
                    <Text className="text-sm text-gray-500 mt-1">
                      {new Date(item.date).toLocaleDateString()} • {item.category}
                    </Text>
                    {item.location && (
                      <Text className="text-sm text-blue-600 mt-1">
                        📍 {item.location}
                      </Text>
                    )}
                  </View>
                  <View className="bg-blue-500 px-3 py-1 rounded">
                    <Text className="text-white text-sm font-UrbanistSemiBold">
                      View
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>

      {/* Item Count */}
      <View className="p-4 bg-gray-50 border-t border-gray-200">
        <Text className="text-center text-sm font-UrbanistSemiBold text-gray-600">
          {filteredItems.length} {filteredItems.length === 1 ? 'location' : 'locations'} shown
          {selectedDate !== 'all' && ` for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </Text>
      </View>
    </SafeAreaView>
  );
}
