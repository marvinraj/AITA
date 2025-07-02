import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ItineraryTab from '../../../components/ItineraryTab';
import LiveTripHeader from '../../../components/LiveTripHeader';
import SavesTab from '../../../components/SavesTab';
import TravelHubTab from '../../../components/TravelHubTab';
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
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  
  // state to manage active tab
  const [activeTab, setActiveTab] = useState('Travel Hub');
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

  // Load specific trip on component mount
  useEffect(() => {
    if (tripId) {
      loadTrip();
    } else {
      setError('No trip ID provided');
      setLoading(false);
    }
  }, [tripId]);

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
    router.back();
  };

  // Handle edit trip
  const handleEditTrip = () => {
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
            <Text className="text-2xl mr-2">←</Text>
            <Text className="text-primaryFont font-UrbanistSemiBold">Back to My Trips</Text>
          </TouchableOpacity>
          
          {/* Trip actions */}
          <View className="flex-row items-center">
            <TouchableOpacity
              className="bg-secondaryBG border border-border rounded-lg px-3 py-2 mr-2"
              onPress={handleEditTrip}
              activeOpacity={0.8}
            >
              <Text className="text-primaryFont font-UrbanistSemiBold text-sm">✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-600/20 border border-red-600 rounded-lg px-3 py-2"
              onPress={handleDeleteTrip}
              activeOpacity={0.8}
            >
              <Text className="text-red-400 font-UrbanistSemiBold text-sm">🗑️ Delete</Text>
            </TouchableOpacity>
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
      <View className="flex-1 px-4">
        <ActiveComponent trip={trip} />
      </View>

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
              <Text className="text-xl font-UrbanistSemiBold text-primaryFont">Edit Trip</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.8}
              >
                <Text className="text-2xl text-secondaryFont">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit Form */}
          <ScrollView className="flex-1 px-4 pt-6">
            {/* Trip Name */}
            <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Trip Name</Text>
            <TextInput
              className="bg-secondaryBG text-primaryFont rounded-xl px-4 py-3 mb-4 border border-border"
              placeholder="Enter trip name"
              placeholderTextColor="#888"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
            />

            {/* Destination */}
            <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Destination</Text>
            <TextInput
              className="bg-secondaryBG text-primaryFont rounded-xl px-4 py-3 mb-4 border border-border"
              placeholder="Enter destination"
              placeholderTextColor="#888"
              value={editForm.destination}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, destination: text }))}
            />

            {/* Trip Status */}
            <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Trip Status</Text>
            <View className="flex-row gap-2 mb-6">
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
            <View className="flex-row gap-3 mb-8">
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
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
