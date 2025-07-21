import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Trip } from '../types/database';

interface TripSelectModalProps {
  visible: boolean;
  trips: Trip[];
  currentTripId?: string; // Optional: to highlight the current trip
  onSelect: (trip: Trip) => void;
  onCancel: () => void;
}

const TripSelectModal: React.FC<TripSelectModalProps> = ({ visible, trips, currentTripId, onSelect, onCancel }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-secondaryBG">
        {/* Handle Bar */}
        <View className="items-center pt-4 pb-2">
          <View className="w-12 h-1 bg-border/40 rounded-full" />
        </View>

        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-primaryFont text-2xl font-BellezaRegular text-center">Select a Live Trip</Text>
          {/* <Text className="text-secondaryFont text-xs text-center mt-1">
            Select a trip to go live
          </Text> */}
        </View>
        
        {/* Trip List */}
        <View className="flex-1 px-6">
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isCurrentTrip = currentTripId === item.id;
              return (
                <TouchableOpacity
                  className={`p-4 mb-3 rounded-2xl ${
                    isCurrentTrip 
                      ? 'bg-accentFont/15 border-2 border-accentFont/40' 
                      : 'bg-primaryBG/30 border border-border/30'
                  } shadow-sm`}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-1">
                        <Text className={`text-lg font-semibold ${
                          isCurrentTrip ? 'text-accentFont' : 'text-primaryFont'
                        }`}>
                          {item.name}
                        </Text>
                        {isCurrentTrip && (
                          <View className="ml-2 bg-accentFont/20 px-2 py-0.5 rounded-full">
                            <Text className="text-accentFont text-xs font-medium">Active</Text>
                          </View>
                        )}
                      </View>
                      
                      {item.destination && (
                        <View className="flex-row items-center">
                          <Ionicons name="location" size={14} color="#9CA3AF" />
                          <Text className="text-secondaryFont text-sm ml-1">{item.destination}</Text>
                        </View>
                      )}
                      
                      {item.start_date && item.end_date && (
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="calendar" size={14} color="#9CA3AF" />
                          <Text className="text-secondaryFont text-xs ml-1">
                            {new Date(item.start_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })} - {new Date(item.end_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      isCurrentTrip 
                        ? 'bg-accentFont border-accentFont' 
                        : 'border-border/40'
                    }`}>
                      {isCurrentTrip && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
        
        {/* Cancel Button */}
        <View className="px-6 pb-6 pt-4">
          <TouchableOpacity
            className="py-4 px-6 bg-border/20 rounded-2xl border border-border/30"
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text className="text-primaryFont text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TripSelectModal;
