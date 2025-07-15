import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface RecommendationItem {
  name: string;
  description: string;
  rating: number;
  priceLevel: string;
  location: string;
  highlights: string[];
  googleMapsQuery: string;
}

interface AddToItineraryModalProps {
  visible: boolean;
  item: RecommendationItem | null;
  tripDates: string[]; // Array of date strings in YYYY-MM-DD format
  onClose: () => void;
  onAdd: (item: RecommendationItem, selectedDate: string, time: string, notes?: string) => void;
}

export const AddToItineraryModal: React.FC<AddToItineraryModalProps> = ({
  visible,
  item,
  tripDates,
  onClose,
  onAdd
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleAdd = () => {
    if (!selectedDate) {
      Alert.alert('Please Select a Date', 'Choose which day you want to add this to your itinerary.');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Time Required', 'Please set a time for this activity.');
      return;
    }

    if (!item) return;

    onAdd(item, selectedDate, selectedTime, notes || undefined);
    
    // Reset form
    setSelectedDate('');
    setSelectedTime('');
    setNotes('');
    onClose();
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryFromItem = (item: RecommendationItem): string => {
    const description = item.description.toLowerCase();
    const name = item.name.toLowerCase();
    
    if (description.includes('restaurant') || description.includes('dining') || description.includes('food')) {
      return 'restaurant';
    }
    if (description.includes('cafe') || description.includes('coffee')) {
      return 'restaurant'; // Cafes can be categorized as restaurants
    }
    if (description.includes('museum') || description.includes('gallery') || description.includes('attraction')) {
      return 'attraction';
    }
    if (description.includes('shopping') || description.includes('market') || description.includes('store')) {
      return 'shopping';
    }
    if (description.includes('bar') || description.includes('club') || description.includes('nightlife')) {
      return 'nightlife';
    }
    if (description.includes('hotel') || description.includes('accommodation')) {
      return 'hotel';
    }
    
    return 'activity'; // Default category
  };

  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-primaryBG rounded-t-3xl p-6 max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-primaryFont font-bold text-xl">Add to Itinerary</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-secondaryFont text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Item info */}
          <View className="bg-secondaryBG rounded-xl p-4 mb-4">
            <Text className="text-primaryFont font-semibold text-lg mb-1">{item.name}</Text>
            <Text className="text-secondaryFont text-sm mb-2">📍 {item.location}</Text>
            <Text className="text-primaryFont text-sm">{item.description}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Date Selection */}
            <Text className="text-primaryFont font-semibold text-lg mb-3">📅 Choose a Day</Text>
            <View className="mb-4">
              {tripDates.map((date, index) => (
                <TouchableOpacity
                  key={date}
                  onPress={() => setSelectedDate(date)}
                  className={`p-3 rounded-xl mb-2 border ${
                    selectedDate === date 
                      ? 'bg-accentFont border-accentFont' 
                      : 'bg-inputBG border-border'
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className={`font-medium ${
                      selectedDate === date ? 'text-primaryBG' : 'text-primaryFont'
                    }`}>
                      Day {index + 1} - {formatDateDisplay(date)}
                    </Text>
                    {selectedDate === date && (
                      <Text className="text-primaryBG">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time Selection (Required) */}
            <Text className="text-primaryFont font-semibold text-lg mb-3">🕐 Time (Required)</Text>
            <TextInput
              className="bg-inputBG rounded-xl px-4 py-3 text-primaryFont mb-4"
              placeholder="e.g., 09:00, 14:30"
              placeholderTextColor="#828282"
              value={selectedTime}
              onChangeText={setSelectedTime}
            />

            {/* Notes (Optional) */}
            <Text className="text-primaryFont font-semibold text-lg mb-3">📝 Notes (Optional)</Text>
            <TextInput
              className="bg-inputBG rounded-xl px-4 py-3 text-primaryFont mb-6"
              placeholder="Add any special notes or reminders..."
              placeholderTextColor="#828282"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mt-4">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-secondaryBG rounded-xl py-3"
            >
              <Text className="text-secondaryFont text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleAdd}
              className="flex-1 bg-green-600 rounded-xl py-3"
            >
              <Text className="text-white text-center font-medium">Add to Trip 🎉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
