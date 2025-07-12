import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { formatDayHeader, generateDateRange, getDayOfWeek } from '../lib/utils/dateUtils';
import { DailyItinerary, Trip } from '../types/database';
import DailyItinerarySection from './DailyItinerarySection';
import DatePicker from './DatePicker';

interface DynamicItineraryProps {
  trip: Trip | null;
  height: number; // Available height for the component
}

export default function DynamicItinerary({ trip, height }: DynamicItineraryProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [dailyItineraries, setDailyItineraries] = useState<DailyItinerary[]>([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);

  // Generate daily itinerary structure when trip dates are available
  useEffect(() => {
    if (trip?.start_date && trip?.end_date) {
      setLoadingItinerary(true);
      
      const dateRange = generateDateRange(trip.start_date, trip.end_date);
      
      const dailies: DailyItinerary[] = dateRange.map(date => ({
        date,
        dayOfWeek: getDayOfWeek(date),
        formattedDate: formatDayHeader(date),
        items: [], // Empty for now - will be populated later
        isExpanded: expandedDays.has(date),
        itemCount: 0
      }));
      
      setDailyItineraries(dailies);
      setLoadingItinerary(false);
    }
  }, [trip?.start_date, trip?.end_date, expandedDays]);

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

  // Handle activity added - placeholder for now
  const handleActivityAdded = async () => {
    console.log('Activity added, would refresh itinerary data');
    // TODO: Refresh itinerary data when activities are added
  };
  
  // Handle case where trip is not loaded yet
  if (!trip) {
    return (
      <View className="flex-1 items-center justify-center px-4" style={{ height }}>
        <Text className="text-secondaryFont text-sm">Loading trip...</Text>
      </View>
    );
  }

  // Handle case where trip dates are not set
  if (!trip.start_date || !trip.end_date) {
    return (
      <View className="flex-1 items-center justify-center px-4" style={{ height }}>
        <Text className="text-secondaryFont text-sm text-center">
          Trip dates not set.{'\n'}Set your dates to view itinerary.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primaryBG" style={{ height }}>
      {/* Date Picker - same as itinerary tab */}
      <DatePicker
        startDate={trip.start_date}
        endDate={trip.end_date}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        // No edit button in dynamic view
      />
      
      {/* Daily Itinerary Sections - same as itinerary tab */}
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
            {dailyItineraries.length === 0 && (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-secondaryFont text-lg mb-2">Ready to plan!</Text>
                <Text className="text-secondaryFont text-sm text-center">
                  Your trip dates are set.{'\n'}
                  Chat with AITA to start adding activities.
                </Text>
              </View>
            )}
          </>
        )}
        
        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
