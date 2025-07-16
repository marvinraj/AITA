import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Place, placesService } from '../lib/services/placesService';
import { tripsService } from '../lib/services/tripsService';
import { Trip } from '../types/database';

interface EditTripModalProps {
  visible: boolean;
  trip: Trip | null;
  onClose: () => void;
  onTripUpdate: (updatedTrip: Trip) => void;
  onTripDeleted?: () => void; // Optional callback for when trip is deleted
}

export default function EditTripModal({ visible, trip, onClose, onTripUpdate, onTripDeleted }: EditTripModalProps) {
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    destination: '',
    status: 'planning' as 'planning' | 'active' | 'completed'
  });
  
  // Destination search state
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<Place[]>([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [searchingDestinations, setSearchingDestinations] = useState(false);

  // Initialize form when trip or visibility changes
  useEffect(() => {
    if (visible && trip) {
      setEditForm({
        name: trip.name || '',
        destination: trip.destination || '',
        status: (trip.status as 'planning' | 'active' | 'completed') || 'planning'
      });
      setDestinationQuery(trip.destination || '');
    }
  }, [visible, trip]);

  // Handle destination search
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

  // Handle destination selection
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

      onTripUpdate(updatedTrip);
      onClose();
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
    if (!trip) return;

    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`,
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
      Alert.alert('Success', 'Trip deleted successfully');
      onClose();
      // Call the optional callback for trip deletion
      if (onTripDeleted) {
        onTripDeleted();
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      Alert.alert('Error', 'Failed to delete trip. Please try again.');
    }
  };

  // Handle close modal
  const handleClose = () => {
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-primaryBG">
        {/* Modal Header */}
        <View className="pt-12 px-4 pb-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-UrbanistSemiBold text-primaryFont">Edit Trip</Text>
            <TouchableOpacity
              onPress={handleClose}
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
              onPress={handleClose}
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

          {/* Delete Button */}
          <View className='mt-8'>
            <TouchableOpacity
              className="py-3"
              onPress={handleDeleteTrip}
              activeOpacity={0.8}
            >
              <Text className="text-red-400 font-UrbanistSemiBold">🗑️ Delete trip</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
