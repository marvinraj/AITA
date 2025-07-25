import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Place, placesService } from '../../../../lib/services/placesService';
import { tripsService } from '../../../../lib/services/tripsService';

// define options for budget
const budgetOptions = [
  { label: 'Any budget', value: 'any', description: 'Open to all price ranges' },
  { label: '$ Budget traveler', value: 'budget', description: 'Keep costs low' },
  { label: '$$ Mid-range explorer', value: 'mid-range', description: 'Balance value and comfort' },
  { label: '$$$ Comfort seeker', value: 'comfort', description: 'Prioritize comfort and quality' },
  { label: '$$$$ Luxury experience', value: 'luxury', description: 'Premium experiences and amenities' },
];

const ManualTripCreation = () => {
  const router = useRouter();
  
  // Basic trip information state
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<Place[]>([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [searchingDestinations, setSearchingDestinations] = useState(false);
  const [budget, setBudget] = useState('any');
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [range, setRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  
  // Loading state
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  // Handle destination search
  const handleDestinationSearch = async (query: string) => {
    setDestinationQuery(query);
    
    if (query.length < 2) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }

    try {
      setSearchingDestinations(true);
      const suggestions = await placesService.searchPlaces(query);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
    } catch (error) {
      console.error('Error searching destinations:', error);
    } finally {
      setSearchingDestinations(false);
    }
  };

  // Handle destination selection
  const handleDestinationSelect = (place: Place) => {
    setDestination(place.name);
    setDestinationQuery(place.name);
    setShowDestinationSuggestions(false);
  };

  // Hide destination suggestions when scrolling
  const handleHideDestinationSuggestions = () => {
    setShowDestinationSuggestions(false);
  };

  // Handle date selection
  const handleDateSelect = (date: any) => {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: date.dateString, end: '' });
    } else if (range.start && !range.end) {
      if (date.dateString > range.start) {
        setRange({ ...range, end: date.dateString });
      } else {
        setRange({ start: date.dateString, end: '' });
      }
    }
  };

  // Handle date range press
  const handleDateRangePress = () => {
    setShowCalendar(!showCalendar);
  };

  // Handle trip creation
  const handleCreateTrip = async () => {
    // Validation
    if (!tripName.trim()) {
      Alert.alert('Error', 'Please enter a trip name');
      return;
    }

    if (!destination.trim()) {
      Alert.alert('Error', 'Please select a destination');
      return;
    }

    if (!range.start || !range.end) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    try {
      setIsCreatingTrip(true);
      
      // Create trip in database
      const tripData = await tripsService.createTrip({
        name: tripName,
        destination: destination,
        start_date: range.start,
        end_date: range.end,
        budget: budget,
        status: 'planning'
      });

      console.log('Trip created successfully:', tripData);

      // Show success message
      Alert.alert(
        'Trip Created Successfully!', 
        'You can now start building your itinerary by adding activities.',
        [{ text: 'OK', onPress: () => {} }]
      );

      // Navigate directly to the trip page for manual itinerary building
      // Using replace to prevent going back to the creation form
      const navigationPath = {
        pathname: '/(root)/trip/[tripId]' as any,
        params: { 
          tripId: tripData.id,
          activeTab: 'Itinerary', // Direct user to itinerary tab for manual building
          source: 'manual_creation' // Track where user came from
        }
      };
      
      console.log('Navigating to:', navigationPath);
      router.replace(navigationPath);
      
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get date range display
  const getDateRangeDisplay = (start: string, end: string) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const month = endDate.toLocaleString('default', { month: 'long' });
      return `${startDate.getDate()} → ${endDate.getDate()} ${month}`;
    }
    return 'Start date → End date';
  };

  // Helper for markedDates for react-native-calendars
  function getMarkedDates(range: { start: string, end: string }) {
    const markedDates: any = {};
    
    if (range.start && range.end) {
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        markedDates[dateString] = {
          color: '#007AFF',
          textColor: 'white',
          startingDay: dateString === range.start,
          endingDay: dateString === range.end,
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (range.start) {
      markedDates[range.start] = {
        color: '#007AFF',
        textColor: 'white',
        startingDay: true,
        endingDay: true,
      };
    }
    
    return markedDates;
  }

  // Calculate form progress
  const getFormProgress = () => {
    let progress = 0;
    if (tripName.trim()) progress += 33;
    if (destination.trim()) progress += 33;
    if (range.start && range.end) progress += 34;
    return progress;
  };

  return (
    <View className="flex-1 bg-primaryBG">
      {/* Header */}
      <View className="pt-12 px-4 pb-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-BellezaRegular text-primaryFont">Build Your Own Trip</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Close form"
            activeOpacity={0.8}
          >
            <Text className="text-2xl text-secondaryFont">✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Progress Indicator */}
        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-secondaryFont font-UrbanistSemiBold">
              Progress: {Math.round(getFormProgress())}%
            </Text>
            <Text className="text-xs text-secondaryFont/70">
              {Math.round(getFormProgress() / 33)} of 3 completed
            </Text>
          </View>
          <View className="w-full bg-secondaryBG rounded-full h-2">
            <View 
              className="bg-accentFont/70 h-2 rounded-full"
              style={{ width: `${getFormProgress()}%` }}
            />
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-8"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleHideDestinationSuggestions}
      >
        {/* Trip Name */}
        <Text className="text-primaryFont font-UrbanistSemiBold mb-2">What would you like to call your trip?</Text>
        <View className="mb-8">
          <TextInput
            className="bg-secondaryBG text-primaryFont rounded-xl px-4 py-3 border border-border"
            placeholder={destination ? `${destination} Trip` : "My Amazing Trip"}
            placeholderTextColor="#888"
            value={tripName}
            onChangeText={setTripName}
            maxLength={50}
          />
        </View>

        {/* Destination */}
        <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Where do you want to go?</Text>
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

        {/* Dates */}
        <Text className="text-primaryFont font-UrbanistSemiBold mb-2">When do you want to go?</Text>
        <TouchableOpacity
          className="flex-row items-center w-full bg-secondaryBG border border-border rounded-xl px-4 py-3 mb-8"
          onPress={handleDateRangePress}
          activeOpacity={0.8}
        >
          <Text className="text-2xl mr-3">📅</Text>
          <Text className={`text-primaryFont font-UrbanistSemiBold ${range.start && range.end ? '' : 'opacity-60'}`}>
            {getDateRangeDisplay(range.start, range.end)}
          </Text>
        </TouchableOpacity>

        {/* Calendar picker */}
        {showCalendar && (
          <View className="w-full mb-4">
            <Calendar
              current={range.start || new Date().toISOString().split('T')[0]}
              markingType={'period'}
              markedDates={getMarkedDates(range)}
              onDayPress={handleDateSelect}
              minDate={new Date().toISOString().split('T')[0]}
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
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={{
                borderRadius: 12,
              }}
            />
            <View className="flex-row justify-between px-4 py-3 mt-4">
              <TouchableOpacity onPress={() => { setRange({ start: '', end: '' }); }}>
                <Text className="text-secondaryFont font-UrbanistSemiBold">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Text className="text-accentFont font-UrbanistSemiBold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Budget */}
        <Text className="text-primaryFont font-UrbanistSemiBold mb-2">What's your budget style?</Text>
        <View className="mb-8">
          {budgetOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`p-4 rounded-xl border mb-3 ${budget === option.value ? 'bg-accentFont/20 border-accentFont/50' : 'bg-secondaryBG border-border'}`}
              onPress={() => setBudget(option.value)}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`font-UrbanistSemiBold text-base ${budget === option.value ? 'text-primaryFont' : 'text-primaryFont'}`}>
                    {option.label}
                  </Text>
                  <Text className="text-secondaryFont text-sm mt-1">
                    {option.description}
                  </Text>
                </View>
                <View className={`w-5 h-5 rounded-full border-2 ${budget === option.value ? 'border-accentFont bg-accentFont' : 'border-border'}`}>
                  {budget === option.value && (
                    <View className="w-3 h-3 bg-white rounded-full m-0.5" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          className={`px-8 py-3 rounded-xl w-full items-center mb-4 ${(!tripName.trim() || !destination.trim() || !range.start || !range.end || isCreatingTrip) ? 'bg-accentFont/30' : 'bg-accentFont/50'}`}
          onPress={handleCreateTrip}
          disabled={!tripName.trim() || !destination.trim() || !range.start || !range.end || isCreatingTrip}
          activeOpacity={0.8}
        >
          <Text className="text-primaryBG font-UrbanistSemiBold">
            {isCreatingTrip ? 'Creating Trip...' : 'Create Trip'}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <Text className="text-secondaryFont/70 text-sm text-center mb-8">
          After creating your trip, you'll be taken to your trip page where you can manually add activities and build your itinerary day by day.
        </Text>
      </ScrollView>
    </View>
  );
};

export default ManualTripCreation;
