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
      transparent
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="bg-secondaryBG rounded-2xl p-6 w-full max-w-sm max-h-96 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-primaryFont text-2xl font-bold text-center">Select Trip</Text>
              <Text className="text-secondaryFont text-sm text-center mt-1">
                Choose which trip to view
              </Text>
            </View>
          </View>
          
          {/* Trip List */}
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
            style={{ maxHeight: 240 }}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Cancel Button */}
          <TouchableOpacity
            className="mt-4 py-3 px-6 bg-border/20 rounded-xl border border-border/30"
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text className="text-primaryFont text-center font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TripSelectModal;
