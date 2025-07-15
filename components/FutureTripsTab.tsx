import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { tripsService } from '../lib/services/tripsService';
import { Trip } from '../types/database';

export default function FutureTripsTab() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Reload trips when component gains focus (when user returns from creating a trip)
  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [])
  );

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allTrips = await tripsService.getAllTrips();
      setTrips(allTrips);
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load your trips');
      Alert.alert('Error', 'Failed to load your trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get gradient colors for trip cards
  const getGradientColors = (index: number) => {
    const gradients = [
      ['#1a1a2e', '#16213e'],
      ['#2d1b69', '#11022e'],
      ['#0f3460', '#16537e'],
      ['#2c5530', '#1a2f1d'],
      ['#4a1a2b', '#2d0914'],
      ['#3a2f42', '#1f1a24'],
      ['#3d2914', '#2a1810'],
      ['#2e3440', '#2b2d42']
    ];
    return gradients[index % gradients.length];
  };

  // Get trip status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-800/40';
      case 'completed':
        return 'bg-blue-800/40';
      case 'planning':
      default:
        return 'bg-orange-800/40';
    }
  };

  // Navigate to trip details page
  const handleTripPress = (tripId: string) => {
    router.push({
      pathname: '/trip/[tripId]' as any,
      params: { tripId }
    });
  };

  // Navigate to create new trip (go to TravelAI index page first)
  const handleCreateTrip = () => {
    router.push('/travelai');
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-primaryBG px-4 pt-6">
      {/* Header
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-BellezaRegular text-primaryFont">My Travels</Text>
        <TouchableOpacity
          className=""
          onPress={handleCreateTrip}
          activeOpacity={0.8}
        >
         <Image
            source={require('../assets/icons/add.png')} 
            style={{ 
              width: 18, 
              height: 18, 
              tintColor: loading ? '#888' : 'white' 
            }}  
         />
        </TouchableOpacity>
      </View> */}

      {/* Error handling */}
      {error && (
        <View className="mb-4 bg-red-900/20 border border-red-600 rounded-lg p-3">
          <Text className="text-red-400 text-sm">{error}</Text>
        </View>
      )}

      {/* Loading state */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-secondaryFont">Loading your trips...</Text>
        </View>
      ) : trips.length === 0 ? (
        /* Empty state */
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-xl font-UrbanistSemiBold text-primaryFont mb-2">No trips yet</Text>
          <Text className="text-secondaryFont text-center mb-6">
            Start planning your next adventure by creating your first trip!
          </Text>
          <TouchableOpacity
            className="bg-accentFont px-6 py-3 rounded-xl"
            onPress={handleCreateTrip}
            activeOpacity={0.8}
          >
            <Text className="text-primaryBG font-UrbanistSemiBold">Create Your First Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Trips list */
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#f48080"
              colors={['#f48080']}
            />
          }
        >
          {trips.map((trip, index) => (
            <View key={trip.id}>
              <TouchableOpacity
                className="rounded-xl py-2 px-2 mb-2 shadow-sm"
                onPress={() => handleTripPress(trip.id)}
                activeOpacity={0.8}
              >
                <View className="flex-row">
                  {/* Gradient box on the left */}
                  <LinearGradient
                    colors={getGradientColors(index) as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 85,
                      height: 85,
                      borderRadius: 8,
                      marginRight: 16,
                      flexShrink: 0,
                    }}
                  />
                  
                  {/* Trip content */}
                  <View className="flex-1">
                    {/* Trip header */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-lg font-UrbanistSemiBold text-primaryFont mb-1">
                          {trip.name}
                        </Text>
                        <Text className="text-secondaryFont text-xs">
                          📍 {trip.destination || 'Destination not set'}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${getStatusColor(trip.status || 'planning')}`}>
                        <Text className="text-primaryFont/70 text-xs font-UrbanistRegular capitalize">
                          {trip.status || 'planning'}
                        </Text>
                      </View>
                    </View>

                    {/* Trip details */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className="text-secondaryFont text-xs">
                          📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </Text>
                      </View>
                    </View>

                    {/* Activities preview */}
                    {/* {trip.activities && (
                      <View className="mt-2 pt-2 border-t border-border/50">
                        <Text className="text-secondaryFont text-sm">
                          🎯 {trip.activities.split(',').slice(0, 3).join(', ')}
                          {trip.activities.split(',').length > 3 && '...'}
                        </Text>
                      </View>
                    )} */}
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Divider - only show if not the last item */}
              {index < trips.length - 1 && (
                <View className="h-[1px] bg-divider/70 mx-4 mb-3" />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
