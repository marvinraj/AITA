import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ImageBackground, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { DestinationImage, imageService } from '../lib/services/imageService';
import { savedPlacesService } from '../lib/services/savedPlacesService';
import { tripsService } from '../lib/services/tripsService';
import { Trip } from '../types/database';

export default function FutureTripsTab() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tripImages, setTripImages] = useState<Map<string, DestinationImage>>(new Map());
  const [tripSaves, setTripSaves] = useState<Map<string, number>>(new Map());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'planning' | 'active' | 'completed'>('all');

  // Reload trips when component gains focus (when user returns from creating a trip)
  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [])
  );

  // Apply filter to trips
  const applyFilter = (tripsToFilter: Trip[], filter: 'all' | 'planning' | 'active' | 'completed') => {
    let filtered = tripsToFilter;
    
    if (filter !== 'all') {
      filtered = tripsToFilter.filter(trip => (trip.status || 'planning') === filter);
    }
    
    setFilteredTrips(filtered);
  };

  // Handle filter selection
  const handleFilterSelect = (filter: 'all' | 'planning' | 'active' | 'completed') => {
    setSelectedFilter(filter);
    applyFilter(trips, filter);
    setShowFilterModal(false);
  };

  // Get filter button text
  const getFilterButtonText = () => {
    switch (selectedFilter) {
      case 'all':
        return 'All';
      case 'planning':
        return 'Planning';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      default:
        return 'All';
    }
  };

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allTrips = await tripsService.getAllTrips();
      setTrips(allTrips);
      applyFilter(allTrips, selectedFilter);
      
      // Load destination images for all trips
      loadTripImages(allTrips);
      
      // Load saves count for all trips
      loadTripSaves(allTrips);
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load your trips');
      Alert.alert('Error', 'Failed to load your trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load destination images for trips
  const loadTripImages = async (trips: Trip[]) => {
    const imageMap = new Map<string, DestinationImage>();
    
    // Load images for trips that have destinations
    const imagePromises = trips
      .filter(trip => trip.destination)
      .map(async (trip) => {
        try {
          const image = await imageService.getDestinationImage(trip.destination!);
          imageMap.set(trip.id, image);
        } catch (error) {
          console.error(`Error loading image for ${trip.destination}:`, error);
        }
      });

    await Promise.all(imagePromises);
    setTripImages(imageMap);
  };

  // Load saves count for trips
  const loadTripSaves = async (trips: Trip[]) => {
    const savesMap = new Map<string, number>();
    
    // Load saves count for each trip
    const savesPromises = trips.map(async (trip) => {
      try {
        const response = await savedPlacesService.getSavedPlacesForTrip(trip.id);
        const count = response.data ? response.data.length : 0;
        savesMap.set(trip.id, count);
      } catch (error) {
        console.error(`Error loading saves count for trip ${trip.id}:`, error);
        savesMap.set(trip.id, 0);
      }
    });

    await Promise.all(savesPromises);
    setTripSaves(savesMap);
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
      {/* Header with Stats and Filter Button */}
      <View className="flex-row items-center justify-between mb-6">
        {/* Stats Section */}
        <View className="flex-row items-center gap-2">
          <View className="">
            <View className="flex-row items-center mb-1">
              <Ionicons name="airplane" size={18} color="#10b981" style={{ marginRight: 8 }} />
              <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                {trips.length}
              </Text>
            </View>
            <Text className="text-secondaryFont text-xs text-center">
              Total Trips
            </Text>
          </View>
          
          {/* Divider */}
          <View className="w-px h-8 bg-border mx-2" />
          
          <View className="">
            <View className="flex-row items-center mb-1">
              <Ionicons name="checkmark-circle" size={18} color="#3b82f6" style={{ marginRight: 8 }} />
              <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                {trips.filter(trip => trip.status === 'completed').length}
              </Text>
            </View>
            <Text className="text-secondaryFont text-xs text-center">
              Completed
            </Text>
          </View>
          
          {/* Divider */}
          <View className="w-px h-8 bg-border mx-2" />
          
          <View className="">
            <View className="flex-row items-center mb-1">
              <Ionicons name="calendar" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                {trips.filter(trip => (trip.status || 'planning') === 'planning').length}
              </Text>
            </View>
            <Text className="text-secondaryFont text-xs text-center">
              Planning
            </Text>
          </View>
        </View>
        
        {/* Filter Button */}
        <TouchableOpacity
          className="flex-row items-center bg-secondaryBG border border-border rounded-lg px-3 py-2"
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="filter" size={16} color="white" style={{ marginRight: 6 }} />
          <Text className="text-primaryFont text-sm font-UrbanistRegular">{getFilterButtonText()}</Text>
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
      ) : filteredTrips.length === 0 ? (
        /* Empty state */
        <View className="flex-1 items-center justify-center px-8">
          {selectedFilter === 'all' ? (
            <>
              {/* GIF Animation */}
              <View className="items-center mb-6">
                <Image
                  source={require('../assets/images/map3.gif')}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 16,
                  }}
                  resizeMode="cover"
                />
              </View>
              
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
            </>
          ) : (
            <>
              <Text className="text-xl font-UrbanistSemiBold text-primaryFont mb-2">No {selectedFilter} trips</Text>
              <Text className="text-secondaryFont text-center mb-6">
                No trips found with status: {selectedFilter}
              </Text>
            </>
          )}
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
          {filteredTrips.map((trip, index) => (
            <View key={trip.id}>
              <TouchableOpacity
                className="rounded-xl py-2 px-2 mb-2 shadow-sm"
                onPress={() => handleTripPress(trip.id)}
                activeOpacity={0.8}
              >
                <View className="flex-row">
                  {/* Destination image on the left */}
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      marginRight: 16,
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {tripImages.has(trip.id) ? (
                      <ImageBackground
                        source={{ uri: tripImages.get(trip.id)!.url }}
                        style={{
                          width: '100%',
                          height: '100%',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        imageStyle={{
                          borderRadius: 8,
                        }}
                      >
                        {/* Dark overlay for better contrast */}
                        <View 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: 8,
                          }}
                        />
                      </ImageBackground>
                    ) : (
                      /* Fallback gradient while image loads */
                      <LinearGradient
                        colors={getGradientColors(index) as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 8,
                        }}
                      />
                    )}
                  </View>
                  
                  {/* Trip content */}
                  <View className="flex-1">
                    {/* Trip header */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-lg font-UrbanistSemiBold text-primaryFont mb-1">
                          {trip.name}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="location-outline" size={12} color="#828282" style={{ marginRight: 4 }} />
                          <Text className="text-secondaryFont text-xs">
                            {trip.destination || 'Destination not set'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Trip details */}
                    <View className="space-y-1">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={12} color="#828282" style={{ marginRight: 4 }} />
                        <Text className="text-secondaryFont text-xs">
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </Text>
                      </View>
                      
                      {/* Saves count */}
                      <View className="flex-row items-center mt-3">
                        <Ionicons name="bookmark-outline" size={12} color="#828282" style={{ marginRight: 4 }} />
                        <Text className="text-secondaryFont text-xs font-UrbanistSemiBold">
                          {tripSaves.get(trip.id) || 0} Saves
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Divider - only show if not the last item */}
              {index < filteredTrips.length - 1 && (
                <View className="h-[1px] bg-divider/70 mx-4 mb-3" />
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <TouchableOpacity activeOpacity={1}>
              <View className="bg-secondaryBG border border-border rounded-xl p-6 w-64">
                <Text className="text-xl font-UrbanistSemiBold text-primaryFont mb-4 text-center">
                  Filter Trips
                </Text>
                
                {/* Filter Options */}
                {[
                  { key: 'all', label: 'All Trips', count: trips.length },
                  { key: 'planning', label: 'Planning', count: trips.filter(t => (t.status || 'planning') === 'planning').length },
                  { key: 'active', label: 'Active', count: trips.filter(t => t.status === 'active').length },
                  { key: 'completed', label: 'Completed', count: trips.filter(t => t.status === 'completed').length }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                      selectedFilter === option.key ? 'bg-accentFont/20 border border-accentFont/40' : 'bg-primaryBG/50'
                    }`}
                    onPress={() => handleFilterSelect(option.key as any)}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        selectedFilter === option.key ? 'bg-accentFont border-accentFont' : 'border-secondaryFont'
                      }`}>
                        {selectedFilter === option.key && (
                          <View className="w-2 h-2 bg-white rounded-full m-0.5" />
                        )}
                      </View>
                      <Text className="text-primaryFont font-UrbanistRegular">{option.label}</Text>
                    </View>
                    <View className="bg-primaryBG/70 px-2 py-1 rounded-full">
                      <Text className="text-secondaryFont text-xs">{option.count}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  className="bg-primaryBG border border-border rounded-lg p-3 mt-2"
                  onPress={() => setShowFilterModal(false)}
                  activeOpacity={0.8}
                >
                  <Text className="text-secondaryFont text-center font-UrbanistRegular">Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
