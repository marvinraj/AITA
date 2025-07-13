import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { itineraryService } from '../lib/services/itineraryService';
import { tripsService } from '../lib/services/tripsService';
import { formatDayHeader, generateDateRange, getDayOfWeek } from '../lib/utils/dateUtils';
import { DailyItinerary, Trip } from '../types/database';
import DailyItinerarySection from './DailyItinerarySection';
import DatePicker from './DatePicker';

interface ItineraryTabProps {
  trip: Trip;
  onTripUpdate?: (updatedTrip: Trip) => void; // Callback for when trip is updated
}

export interface ItineraryTabRef {
  refreshItinerary: () => Promise<void>;
}

export default forwardRef<ItineraryTabRef, ItineraryTabProps>(function ItineraryTab({ trip, onTripUpdate }, ref) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [dailyItineraries, setDailyItineraries] = useState<DailyItinerary[]>([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  
  // Date editing modal state
  const [showDateEditModal, setShowDateEditModal] = useState(false);
  const [editingDateRange, setEditingDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  
  // Load itinerary data from database
  const loadItineraryData = async () => {
    if (!trip.start_date || !trip.end_date) return;
    
    setLoadingItinerary(true);
    try {
      // Load all itinerary items for this trip
      const items = await itineraryService.getItineraryByTrip(trip.id);
      
      // Generate daily itinerary structure
      const dateRange = generateDateRange(trip.start_date, trip.end_date);
      
      const dailies: DailyItinerary[] = dateRange.map(date => {
        // Filter items for this specific date
        const dateItems = items.filter((item: any) => item.date === date);
        
        return {
          date,
          dayOfWeek: getDayOfWeek(date),
          formattedDate: formatDayHeader(date),
          items: dateItems,
          isExpanded: expandedDays.has(date),
          itemCount: dateItems.length
        };
      });
      
      setDailyItineraries(dailies);
      console.log('ItineraryTab: Loaded itinerary data, total items:', items.length);
    } catch (error) {
      console.error('Error loading itinerary data:', error);
      // Fallback to empty structure
      const dateRange = generateDateRange(trip.start_date, trip.end_date);
      const dailies: DailyItinerary[] = dateRange.map(date => ({
        date,
        dayOfWeek: getDayOfWeek(date),
        formattedDate: formatDayHeader(date),
        items: [],
        isExpanded: expandedDays.has(date),
        itemCount: 0
      }));
      setDailyItineraries(dailies);
    } finally {
      setLoadingItinerary(false);
    }
  };

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshItinerary: loadItineraryData
  }), [trip.id, trip.start_date, trip.end_date, expandedDays]);

  // Load itinerary data when trip dates change
  useEffect(() => {
    loadItineraryData();
  }, [trip.start_date, trip.end_date]);
  
  // Handle date selection from horizontal picker
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    
    // Auto-expand the selected date's section
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        // If already expanded, collapse it
        newSet.delete(date);
      } else {
        // Expand the selected date
        newSet.add(date);
      }
      return newSet;
    });
    
    console.log('Selected date:', date);
  };
  
  // Handle day section toggle
  const handleDayToggle = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
    
    // Update selected date to match the toggled section
    if (!expandedDays.has(date)) {
      setSelectedDate(date);
    }
  };
  
  // Handle edit button press
  const handleEditPress = () => {
    console.log('Edit dates pressed');
    // Initialize the editing range with current trip dates
    setEditingDateRange({
      start: trip.start_date || '',
      end: trip.end_date || ''
    });
    setShowDateEditModal(true);
  };

  // Handle date selection in the edit modal
  const handleDateEditPress = (day: {dateString: string}) => {
    if (!editingDateRange.start || (editingDateRange.start && editingDateRange.end)) {
      setEditingDateRange({ start: day.dateString, end: '' });
    } else if (editingDateRange.start && !editingDateRange.end) {
      if (new Date(day.dateString) < new Date(editingDateRange.start)) {
        setEditingDateRange({ start: day.dateString, end: '' });
      } else {
        setEditingDateRange({ start: editingDateRange.start, end: day.dateString });
      }
    }
  };

  // Handle saving the edited dates
  const handleSaveDates = async () => {
    try {
      setIsUpdatingTrip(true);
      
      // Validate date range
      if (!editingDateRange.start || !editingDateRange.end) {
        Alert.alert('Error', 'Please select both start and end dates');
        return;
      }

      // Update trip in database
      const updatedTrip = await tripsService.updateTrip(trip.id, {
        start_date: editingDateRange.start,
        end_date: editingDateRange.end
      });

      // Call parent callback if provided
      if (onTripUpdate) {
        onTripUpdate(updatedTrip);
      }

      // Close modal
      setShowDateEditModal(false);
      
      Alert.alert('Success', 'Trip dates updated successfully');
      
    } catch (error) {
      console.error('Error updating trip dates:', error);
      Alert.alert('Error', 'Failed to update trip dates. Please try again.');
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  // Handle canceling date edit
  const handleCancelDateEdit = () => {
    setShowDateEditModal(false);
    setEditingDateRange({ start: '', end: '' });
  };

  // Get calendar marked dates for the edit modal
  const getCalendarMarkedDates = () => {
    const markedDates: any = {};
    
    if (editingDateRange.start && editingDateRange.end) {
      const startDate = new Date(editingDateRange.start);
      const endDate = new Date(editingDateRange.end);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        markedDates[dateString] = {
          color: '#007AFF',
          textColor: 'white',
          startingDay: dateString === editingDateRange.start,
          endingDay: dateString === editingDateRange.end,
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (editingDateRange.start) {
      markedDates[editingDateRange.start] = {
        color: '#007AFF',
        textColor: 'white',
        startingDay: true,
        endingDay: true,
      };
    }
    
    return markedDates;
  };
  
  // Handle activity added - refresh the itinerary data
  const handleActivityAdded = async () => {
    console.log('Activity added, refreshing itinerary data');
    await loadItineraryData();
  };

  return (
    <View className="flex-1 bg-primaryBG">
      {/* Date Picker */}
      {trip.start_date && trip.end_date ? (
        <DatePicker
          startDate={trip.start_date}
          endDate={trip.end_date}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onEditPress={handleEditPress}
        />
      ) : (
        <View className="px-4 py-3">
          <Text className="text-red-400 text-sm">
            Trip dates not set. Please edit trip to add dates.
          </Text>
        </View>
      )}
      
      {/* Daily Itinerary Sections */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {loadingItinerary ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#f48080" />
            <Text className="text-secondaryFont text-sm mt-2">Loading itinerary...</Text>
          </View>
        ) : (
          <>
            {dailyItineraries.map((daily) => (
              <DailyItinerarySection
                key={daily.date}
                date={daily.date}
                items={daily.items}
                isExpanded={expandedDays.has(daily.date)}
                onToggle={handleDayToggle}
                tripId={trip.id}
                onActivityAdded={handleActivityAdded}
              />
            ))}
            
            {/* Empty state */}
            {dailyItineraries.length === 0 && trip.start_date && trip.end_date && (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-secondaryFont text-lg mb-2">Ready to plan!</Text>
                <Text className="text-secondaryFont text-sm text-center">
                  Your trip dates are set.{'\n'}
                  Start adding activities to your itinerary.
                </Text>
              </View>
            )}
          </>
        )}
        
        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>

      {/* Date Edit Modal */}
      <Modal
        visible={showDateEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelDateEdit}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-primaryBG rounded-t-3xl p-6 max-h-4/5">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-primaryFont font-UrbanistSemiBold text-xl">
                Edit Trip Dates
              </Text>
              <TouchableOpacity
                onPress={handleCancelDateEdit}
                className="p-2"
              >
                <Text className="text-secondaryFont text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <Text className="text-secondaryFont text-sm mb-4 text-center">
              {!editingDateRange.start ? 'Select start date' : 
               !editingDateRange.end ? 'Select end date' : 
               'Date range selected'}
            </Text>

            {/* Date Range Display */}
            {(editingDateRange.start || editingDateRange.end) && (
              <View className="bg-secondaryBG/30 rounded-lg p-4 mb-4">
                <Text className="text-primaryFont font-UrbanistSemiBold text-center">
                  {editingDateRange.start && new Date(editingDateRange.start).toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'short', day: 'numeric' 
                  })}
                  {editingDateRange.start && editingDateRange.end && ' - '}
                  {editingDateRange.end && new Date(editingDateRange.end).toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'short', day: 'numeric' 
                  })}
                </Text>
              </View>
            )}

            {/* Calendar */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <Calendar
                current={editingDateRange.start || new Date().toISOString().split('T')[0]}
                markingType="period"
                markedDates={getCalendarMarkedDates()}
                onDayPress={handleDateEditPress}
                theme={{
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                  selectedDayBackgroundColor: '#007AFF',
                  selectedDayTextColor: '#FFFFFF',
                  todayTextColor: '#007AFF',
                  dayTextColor: '#333333',
                  textDisabledColor: '#CCCCCC',
                  arrowColor: '#007AFF',
                  monthTextColor: '#333333',
                  textDayFontFamily: 'Urbanist-Regular',
                  textMonthFontFamily: 'Urbanist-SemiBold',
                  textDayHeaderFontFamily: 'Urbanist-Regular',
                }}
                style={{
                  borderRadius: 12,
                }}
              />
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={handleCancelDateEdit}
                className="flex-1 py-3 bg-secondaryBG/50 rounded-lg"
                disabled={isUpdatingTrip}
              >
                <Text className="text-primaryFont text-center font-UrbanistSemiBold">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveDates}
                className={`flex-1 py-3 rounded-lg ${
                  editingDateRange.start && editingDateRange.end && !isUpdatingTrip
                    ? 'bg-accentFont'
                    : 'bg-secondaryBG/50'
                }`}
                disabled={!editingDateRange.start || !editingDateRange.end || isUpdatingTrip}
              >
                <Text className={`text-center font-UrbanistSemiBold ${
                  editingDateRange.start && editingDateRange.end && !isUpdatingTrip
                    ? 'text-primaryBG'
                    : 'text-secondaryFont'
                }`}>
                  {isUpdatingTrip ? 'Updating...' : 'Save Dates'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});
