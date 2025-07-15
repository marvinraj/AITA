import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ItineraryTab from '../../../components/ItineraryTab';
import LiveTripHeader from '../../../components/LiveTripHeader';
import SavesTab from '../../../components/SavesTab';
import TravelHubTab from '../../../components/TravelHubTab';
import { Place, placesService } from '../../../lib/services/placesService';
import { tripsService } from '../../../lib/services/tripsService';
import { Trip } from '../../../types/database';

// tabs for trip details (same as LiveTripTab)
const TABS = [
  { key: 'Travel Hub', component: TravelHubTab },
  { key: 'Itinerary', component: ItineraryTab },
  { key: 'Saves', component: SavesTab },
  // { key: 'Budget', component: BudgetTab },
];

export default function TripDetailsPage() {
  const router = useRouter();
  const { tripId, activeTab: initialActiveTab, source } = useLocalSearchParams<{ 
    tripId: string; 
    activeTab?: string; 
    source?: string;
  }>();
  
  // state to manage active tab - use initial tab from params if provided
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'Travel Hub');
  // trip state
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    destination: '',
    status: 'planning' as 'planning' | 'active' | 'completed'
  });
  
  // Destination search state for edit modal
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<Place[]>([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [searchingDestinations, setSearchingDestinations] = useState(false);

  // Load specific trip on component mount
  useEffect(() => {
    if (tripId) {
      loadTrip();
    } else {
      setError('No trip ID provided');
      setLoading(false);
    }
  }, [tripId]);

  // Handle destination search for edit modal
  const handleDestinationSearch = async (query: string) => {
    setDestinationQuery(query);
    
    if (query.length < 2) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }

    setSearchingDestinations(true);
    try {
      const results = await placesService.searchPlaces(query);
      setDestinationSuggestions(results.slice(0, 8));
      setShowDestinationSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching destinations:', error);
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    } finally {
      setSearchingDestinations(false);
    }
  };

  // Handle destination selection for edit modal
  const handleDestinationSelect = (place: Place) => {
    setEditForm(prev => ({ ...prev, destination: place.name }));
    setDestinationQuery(place.name);
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
  };

  // Hide destination suggestions when tapping outside
  const handleHideDestinationSuggestions = () => {
    setShowDestinationSuggestions(false);
  };

  const loadTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!tripId) {
        throw new Error('Trip ID is required');
      }

      // Get the specific trip by ID
      const tripData = await tripsService.getTripById(tripId);
      
      if (!tripData) {
        setError('Trip not found');
        return;
      }

      setTrip(tripData);
      
      // Initialize edit form with trip data
      setEditForm({
        name: tripData.name || '',
        destination: tripData.destination || '',
        status: (tripData.status as 'planning' | 'active' | 'completed') || 'planning'
      });
      
      // Initialize destination query for search
      setDestinationQuery(tripData.destination || '');
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };
  
  // determine the active component based on the active tab
  const ActiveComponent = TABS.find(tab => tab.key === activeTab)?.component || TravelHubTab;

  // Handle back navigation
  const handleBack = () => {
    // If user came from manual creation, navigate to profile/travels
    if (source === 'manual_creation') {
      router.push('/(root)/(tabs)/profile');
      return;
    }
    
    // Try to go back in history first
    try {
      if (router.canGoBack && router.canGoBack()) {
        router.back();
      } else {
        // If there's no back history, navigate to the main trips page
        router.push('/(root)/(tabs)/profile');
      }
    } catch (error) {
      // If canGoBack doesn't exist or fails, just navigate to profile
      console.log('Back navigation fallback - going to profile');
      router.push('/(root)/(tabs)/profile');
    }
  };

  // Handle edit trip
  const handleEditTrip = () => {
    if (trip) {
      setDestinationQuery(trip.destination || '');
    }
    setShowEditModal(true);
  };

  // Handle save edited trip
  const handleSaveEdit = async () => {
    if (!trip || !editForm.name.trim() || !editForm.destination.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setEditLoading(true);
      
      const updatedTrip = await tripsService.updateTrip(trip.id, {
        name: editForm.name.trim(),
        destination: editForm.destination.trim(),
        status: editForm.status
      });

      setTrip(updatedTrip);
      setShowEditModal(false);
      Alert.alert('Success', 'Trip updated successfully!');
    } catch (err) {
      console.error('Error updating trip:', err);
      Alert.alert('Error', 'Failed to update trip. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete trip
  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDeleteTrip 
        }
      ]
    );
  };

  const confirmDeleteTrip = async () => {
    if (!trip) return;

    try {
      await tripsService.deleteTrip(trip.id);
      Alert.alert('Success', 'Trip deleted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error('Error deleting trip:', err);
      Alert.alert('Error', 'Failed to delete trip. Please try again.');
    }
  };

  // Handle chat button press
  const handleChatPress = () => {
    if (trip) {
      router.push(`/chatAI?tripId=${trip.id}`);
    }
  };

  // Handle map button press
  const handleMapPress = () => {
    if (trip) {
      // @ts-ignore - Router types not updated yet for new map route
      router.push(`/map?tripId=${trip.id}`);
    }
  };

  // Show loading state while trip is being loaded
  if (loading) {
    return (
      <View className="flex-1 bg-primaryBG justify-center items-center">
        <Text className="text-secondaryFont">Loading trip details...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !trip) {
    return (
      <View className="flex-1 bg-primaryBG justify-center items-center px-6">
        <Text className="text-xl font-UrbanistSemiBold text-primaryFont mb-2">Oops!</Text>
        <Text className="text-secondaryFont text-center mb-6">
          {error || 'Trip not found'}
        </Text>
        <TouchableOpacity
          className="bg-accentFont px-6 py-3 rounded-xl"
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Text className="text-primaryBG font-UrbanistSemiBold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primaryBG">
      {/* Back button and actions */}
      <View className="pt-12 px-4 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleBack}
            activeOpacity={0.8}
          >
            {/* <Text className="text-2xl mr-2 text-primaryFont">←</Text> */}
            <Image source={require('../../../assets/icons/back-arrow.png')} style={{ width: 22, height: 22 }} />
          </TouchableOpacity>
          
          {/* Trip actions */}
          <View className="flex-row items-center">
            <TouchableOpacity
              className="bg-secondaryBG border border-border rounded-xl px-3 py-2 mr-2"
              onPress={handleEditTrip}
              activeOpacity={0.8}
            >
              <Image source={require('../../../assets/icons/edit.png')} style={{ width: 22, height: 22 }} />
            </TouchableOpacity>
            {/* <TouchableOpacity
              className="bg-red-600/20 border border-red-600 rounded-lg px-3 py-2"
              onPress={handleDeleteTrip}
              activeOpacity={0.8}
            >
              <Text className="text-red-400 font-UrbanistSemiBold text-sm">🗑️ Delete</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </View>

      {/* main header component with white shadow */}
      <View style={{
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
        paddingHorizontal: 16
      }}>
        <LiveTripHeader trip={trip} />
      </View>

      {/* trip tabs (same as LiveTripTab) */}
      <View className="flex-row items-end border-border mb-2 mt-3 px-4">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <View key={tab.key} style={{ position: 'relative', marginRight: 24, paddingBottom: 4, alignItems: 'center' }}>
              <Text
                className={
                  isActive
                    ? 'text-[#f48080] font-UrbanistSemiBold text-base'
                    : 'text-secondaryFont font-UrbanistSemiBold text-base'
                }
                onPress={() => setActiveTab(tab.key)}
              >
                {tab.key}
              </Text>
              {isActive && (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: '#f48080', borderRadius: 2 }} />
              )}
            </View>
          );
        })}
      </View>

      {/* Active Tab Content */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <ActiveComponent trip={trip} onTripUpdate={setTrip} />
      </ScrollView>

      {/* Edit Trip Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-primaryBG">
          {/* Modal Header */}
          <View className="pt-12 px-4 pb-4 border-b border-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-UrbanistSemiBold text-primaryFont">Edit Trip</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.8}
              >
                <Text className="text-2xl text-secondaryFont">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit Form */}
          <ScrollView 
            className="flex-1 px-4 pt-8"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={handleHideDestinationSuggestions}
          >
            {/* Trip Name */}
            <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Trip Name</Text>
            <TextInput
              className="bg-secondaryBG text-primaryFont rounded-xl px-4 py-3 mb-8 border border-border"
              placeholder="Enter trip name"
              placeholderTextColor="#888"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
            />

            {/* Destination */}
            <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Destination</Text>
            <View className="mb-8">
              <TextInput
                className="bg-secondaryBG text-primaryFont rounded-xl px-4 py-3 border border-border"
                placeholder="Search for cities, countries, or attractions"
                placeholderTextColor="#888"
                value={destinationQuery}
                onChangeText={handleDestinationSearch}
                onFocus={() => {
                  if (destinationSuggestions.length > 0) {
                    setShowDestinationSuggestions(true);
                  }
                }}
              />
              
              {/* Destination Suggestions */}
              {showDestinationSuggestions && (
                <View className="bg-secondaryBG border border-border rounded-xl mt-2 max-h-64">
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {searchingDestinations ? (
                      <View className="px-4 py-3">
                        <Text className="text-secondaryFont text-sm">Searching destinations...</Text>
                      </View>
                    ) : destinationSuggestions.length > 0 ? (
                      destinationSuggestions.map((place) => (
                        <TouchableOpacity
                          key={place.id}
                          className="px-4 py-3 border-b border-border/30 last:border-b-0"
                          onPress={() => handleDestinationSelect(place)}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-start">
                            <View className="w-8 h-8 rounded-full bg-accentFont/20 items-center justify-center mr-3 mt-0.5">
                              <Text className="text-sm">🌍</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-primaryFont font-UrbanistSemiBold text-base">
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
                        <Text className="text-secondaryFont text-sm">No destinations found. Try searching for cities, countries, or attractions.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Trip Status */}
            <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Trip Status</Text>
            <View className="flex-row gap-2 mb-8">
              {(['planning', 'active', 'completed'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  className={`px-4 py-2 rounded-full border ${
                    editForm.status === status 
                      ? 'bg-accentFont border-accentFont' 
                      : 'bg-secondaryBG border-border'
                  }`}
                  onPress={() => setEditForm(prev => ({ ...prev, status }))}
                  activeOpacity={0.8}
                >
                  <Text className={`font-UrbanistSemiBold capitalize ${
                    editForm.status === status ? 'text-primaryBG' : 'text-primaryFont'
                  }`}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                className="flex-1 bg-secondaryBG border border-border rounded-xl py-3"
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.8}
              >
                <Text className="text-primaryFont font-UrbanistSemiBold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 ${
                  editLoading ? 'bg-accentFont/50' : 'bg-accentFont'
                }`}
                onPress={handleSaveEdit}
                disabled={editLoading}
                activeOpacity={0.8}
              >
                <Text className="text-primaryBG font-UrbanistSemiBold text-center">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
            <View className='mt-8'>
                <TouchableOpacity
                    className=" py-3"
                    onPress={handleDeleteTrip}
                    activeOpacity={0.8}
                >
                    <Text className="text-red-400 font-UrbanistSemiBold">🗑️ Delete trip</Text>
            </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Floating Action Buttons - Bottom Right */}
      <View style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Map button */}
        <TouchableOpacity onPress={handleMapPress}>
          <LinearGradient
            colors={['#4B70F5', '#1D267D', '#03346E', '#021526']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 6,
                justifyContent: 'center',
                alignItems: 'center',
            }}
          >
            <Ionicons name="map" size={21} color="white" />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* AI Chat button */}
        <TouchableOpacity onPress={handleChatPress}>
          <View style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#a01a1a', // reddish glow
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
              elevation: 15,
            }}>
              <LinearGradient
                colors={['#22092C', '#321E1E', '#a01a1a', '#09122C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
              >
                <Text className="text-sm text-white font-UrbanistSemiBold">AITA</Text>
              </LinearGradient>
            </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
