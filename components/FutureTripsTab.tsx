import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

  // Get trip status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600';
      case 'completed':
        return 'bg-blue-600';
      case 'planning':
      default:
        return 'bg-orange-600';
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
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-UrbanistSemiBold text-primaryFont">My Trips</Text>
        <TouchableOpacity
          className="bg-accentFont px-4 py-2 rounded-xl"
          onPress={handleCreateTrip}
          activeOpacity={0.8}
        >
          <Text className="text-primaryBG font-UrbanistSemiBold">+ New Trip</Text>
        </TouchableOpacity>
      </View>

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
          {trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              className="bg-secondaryBG border border-border rounded-xl p-4 mb-4 shadow-sm"
              onPress={() => handleTripPress(trip.id)}
              activeOpacity={0.8}
            >
              {/* Trip header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-UrbanistSemiBold text-primaryFont mb-1">
                    {trip.name}
                  </Text>
                  <Text className="text-secondaryFont">
                    📍 {trip.destination || 'Destination not set'}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${getStatusColor(trip.status || 'planning')}`}>
                  <Text className="text-white text-xs font-UrbanistSemiBold capitalize">
                    {trip.status || 'planning'}
                  </Text>
                </View>
              </View>

              {/* Trip details */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-secondaryFont text-sm mr-4">
                    📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </Text>
                </View>
                
                {trip.companions && (
                  <Text className="text-secondaryFont text-sm capitalize">
                    👥 {trip.companions}
                  </Text>
                )}
              </View>

              {/* Activities preview */}
              {trip.activities && (
                <View className="mt-2 pt-2 border-t border-border/50">
                  <Text className="text-secondaryFont text-sm">
                    🎯 {trip.activities.split(',').slice(0, 3).join(', ')}
                    {trip.activities.split(',').length > 3 && '...'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
