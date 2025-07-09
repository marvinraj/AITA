import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatDateButton, generateDateRange } from '../lib/utils/dateUtils';

interface DatePickerProps {
  startDate: string; // ISO date string from trip
  endDate: string; // ISO date string from trip
  selectedDate?: string; // Currently selected date
  onDateSelect: (date: string) => void; // Callback when date is selected
  onEditPress?: () => void; // Callback for edit button
}

interface DateButton {
  date: string; // ISO date (YYYY-MM-DD)
  displayText: string; // "22 July"
  isSelected: boolean;
}

export default function DatePicker({ 
  startDate, 
  endDate, 
  selectedDate, 
  onDateSelect, 
  onEditPress 
}: DatePickerProps) {
  
  // Generate array of dates between start and end date
  const createDateButtons = (): DateButton[] => {
    const dateStrings = generateDateRange(startDate, endDate);
    
    return dateStrings.map(dateString => ({
      date: dateString,
      displayText: formatDateButton(dateString),
      isSelected: selectedDate === dateString
    }));
  };
  
  const dateButtons = createDateButtons();
  
  // If no dates available, show empty state
  if (dateButtons.length === 0) {
    return (
      <View className="px-4 py-3">
        <Text className="text-secondaryFont text-sm">No dates available</Text>
      </View>
    );
  }
  
  return (
    <View className="py-4 mb-3 bg-primaryBG">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ paddingVertical: 4 }}
        bounces={false}
        decelerationRate="fast"
      >
        <View className="flex-row items-center">
            {/* Edit button (pencil icon) */}
          {onEditPress && (
            <TouchableOpacity
              className="w-14 h-14 rounded-full border border-secondaryFont/30 items-center justify-center mr-2"
              onPress={onEditPress}
            >
              <Text className="text-secondaryFont text-xs">✏️</Text>
            </TouchableOpacity>
          )}
          {dateButtons.map((dateButton) => (
            <TouchableOpacity
              key={dateButton.date}
              onPress={() => onDateSelect(dateButton.date)}
              className={`
                rounded-full px-5 py-4 mr-2
                ${dateButton.isSelected 
                  ? 'bg-primaryFont' 
                  : 'bg-transparent border border-secondaryFont/30'
                }
              `}
              style={{
                minWidth: 80,
                alignItems: 'center'
              }}
            >
              <Text 
                className={`
                  text-sm font-UrbanistSemiBold
                  ${dateButton.isSelected 
                    ? 'text-primaryBG' 
                    : 'text-primaryFont'
                  }
                `}
              >
                {dateButton.displayText}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}