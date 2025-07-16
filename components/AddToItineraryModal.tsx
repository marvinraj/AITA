import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  onAdd: (item: RecommendationItem, selectedDate: string, time: string) => void;
}

export const AddToItineraryModal: React.FC<AddToItineraryModalProps> = ({
  visible,
  item,
  tripDates,
  onClose,
  onAdd
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  const handleAdd = () => {
    if (!selectedDate) {
      Alert.alert('Please Select a Date', 'Choose which day you want to add this to your itinerary.');
      return;
    }

    if (!item) return;

    // Convert time to 24-hour format
    let hour = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour = selectedHour + 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour = 0;
    }
    
    const timeString = `${hour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;

    onAdd(item, selectedDate, timeString);
    
    // Reset form
    setSelectedDate('');
    setSelectedHour(9);
    setSelectedMinute(0);
    setSelectedPeriod('AM');
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
            <View className="mb-6">
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

            {/* Enhanced Time Picker */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-primaryFont font-semibold text-lg">🕐 Set Time</Text>
                <Text className="text-red-400 text-sm">*</Text>
              </View>
              
              <View className="bg-inputBG rounded-xl p-4 border border-border">
                <View className="flex-row items-center justify-center">
                  {/* Hour Picker */}
                  <View className="items-center">
                    <Text className="text-secondaryFont text-xs mb-2">Hour</Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => setSelectedHour(selectedHour > 1 ? selectedHour - 1 : 12)}
                        className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-accentFont font-semibold">−</Text>
                      </TouchableOpacity>
                      <Text className="text-primaryFont font-semibold text-xl mx-4 min-w-8 text-center">
                        {selectedHour}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedHour(selectedHour < 12 ? selectedHour + 1 : 1)}
                        className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-accentFont font-semibold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text className="text-primaryFont font-semibold text-xl mx-2">:</Text>
                  
                  {/* Minute Picker */}
                  <View className="items-center">
                    <Text className="text-secondaryFont text-xs mb-2">Min</Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => setSelectedMinute(selectedMinute >= 15 ? selectedMinute - 15 : 45)}
                        className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-accentFont font-semibold">−</Text>
                      </TouchableOpacity>
                      <Text className="text-primaryFont font-semibold text-xl mx-4 min-w-8 text-center">
                        {selectedMinute.toString().padStart(2, '0')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedMinute(selectedMinute <= 30 ? selectedMinute + 15 : 0)}
                        className="w-10 h-10 bg-accentFont/20 rounded-lg items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-accentFont font-semibold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* AM/PM Toggle */}
                  <View className="items-center ml-4">
                    <Text className="text-secondaryFont text-xs mb-2">Period</Text>
                    <View className="bg-primaryBG rounded-lg overflow-hidden border border-border">
                      <TouchableOpacity
                        onPress={() => setSelectedPeriod('AM')}
                        className={`px-3 py-2 ${selectedPeriod === 'AM' ? 'bg-accentFont' : 'bg-transparent'}`}
                        activeOpacity={0.7}
                      >
                        <Text className={`font-semibold text-sm ${selectedPeriod === 'AM' ? 'text-primaryBG' : 'text-primaryFont'}`}>
                          AM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setSelectedPeriod('PM')}
                        className={`px-3 py-2 ${selectedPeriod === 'PM' ? 'bg-accentFont' : 'bg-transparent'}`}
                        activeOpacity={0.7}
                      >
                        <Text className={`font-semibold text-sm ${selectedPeriod === 'PM' ? 'text-primaryBG' : 'text-primaryFont'}`}>
                          PM
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {/* Selected time preview */}
                <Text className="text-center text-secondaryFont text-sm mt-3">
                  Selected: {selectedHour}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                </Text>
              </View>
            </View>
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
