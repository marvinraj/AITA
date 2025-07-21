import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import InitialItineraryPreviewModal from '../../../../components/InitialItineraryPreviewModal';
import { itineraryService } from '../../../../lib/services/itineraryService';
import { Place, placesService } from '../../../../lib/services/placesService';
import { tripsService } from '../../../../lib/services/tripsService';
import { ItineraryItem, TripFormData } from '../../../../types/database';

// define options for companions and activities
const companionOptions = [
  { label: 'Solo', value: 'solo' },
  { label: 'Partner', value: 'partner' },
  { label: 'Friends', value: 'friends' },
  { label: 'Family', value: 'family' },
];

// define options for activities
const activityOptions = [
  'Adventure',
  'Relaxation',
  'Culture',
  'Food',
  'Nature',
  'Nightlife',
  'Shopping',
  'History',
  'Sports',
];

const SmartForm = () => {
    // useRouter hook to navigate between screens
    const router = useRouter();
    // state variable for trip name
    const [tripName, setTripName] = useState('');
    // state variable for destination
    const [destination, setDestination] = useState('');
    const [destinationQuery, setDestinationQuery] = useState('');
    const [destinationSuggestions, setDestinationSuggestions] = useState<Place[]>([]);
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
    const [searchingDestinations, setSearchingDestinations] = useState(false);
    // state variable for companions
    const [companions, setCompanions] = useState('solo');
    // state variable for selected activities
    const [activities, setActivities] = useState<string[]>([]);
    // calendar modal state
    const [showCalendar, setShowCalendar] = useState(false);
    const [range, setRange] = useState<{start: string, end: string}>({ start: '', end: '' });
    // activities modal state
    const [showActivitiesModal, setShowActivitiesModal] = useState(false);
    // loading state for trip creation
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    // state for initial itinerary preview modal
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [formData, setFormData] = useState<TripFormData>({
        tripName: '',
        destination: '',
        startDate: '',
        endDate: '',
        companions: '',
        activities: ''
    });

    // function to toggle activity selection
    const toggleActivity = (activity: string) => {
        setActivities((prev) =>
        prev.includes(activity)
            ? prev.filter((a) => a !== activity)
            : [...prev, activity]
        );
    };

    // Handle destination search
    const handleDestinationSearch = async (query: string) => {
        setDestinationQuery(query);
        
        if (query.length < 2) {
            setDestinationSuggestions([]);
            setShowDestinationSuggestions(false);
            // Clear destination if query is empty
            if (query.length === 0) {
                setDestination('');
            }
            return;
        }

        setSearchingDestinations(true);
        try {
            console.log('Searching for destinations with query:', query);
            const results = await placesService.searchPlaces(query);
            console.log('Search results received:', results.length, 'places');
            // For destinations, we want cities, countries, and tourist attractions
            // The placesService already filters appropriately, so we can use all results
            setDestinationSuggestions(results.slice(0, 8)); // Show more options for destinations
            setShowDestinationSuggestions(results.length > 0);
        } catch (error) {
            console.error('Error searching destinations:', error);
            console.log('Error type:', typeof error);
            console.log('Error message:', error instanceof Error ? error.message : String(error));
            // Still show suggestions from mock data on error
            setDestinationSuggestions([]);
            setShowDestinationSuggestions(false);
        } finally {
            setSearchingDestinations(false);
        }
    };

    // Handle destination selection
    const handleDestinationSelect = (place: Place) => {
        setDestination(place.name);
        setDestinationQuery(place.name);
        setShowDestinationSuggestions(false);
        setDestinationSuggestions([]);
    };

    // Hide suggestions when tapping outside
    const handleHideDestinationSuggestions = () => {
        setShowDestinationSuggestions(false);
    };

    // parse date to string
    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Date selection logic for a better UX
    const handleDateRangePress = () => {
        setShowCalendar(true);
    };

    const handleDayPress = (day: {dateString: string}) => {
        if (!range.start || (range.start && range.end)) {
            setRange({ start: day.dateString, end: '' });
        } else if (range.start && !range.end) {
            if (new Date(day.dateString) < new Date(range.start)) {
                setRange({ start: day.dateString, end: '' });
            } else {
                setRange({ start: range.start, end: day.dateString });
                setShowCalendar(false);
            }
        }
    };

    // function to handle first step submission (opens activities modal)
    const handleContinue = () => {
        if (!destination || !range.start || !range.end) {
            Alert.alert('Missing Information', 'Please fill in all required fields before continuing.');
            return;
        }
        setShowActivitiesModal(true);
    };

    // function to handle final form submission (from activities modal)
    const handleSubmit = async () => {
        // Prepare form data for the preview modal
        const tripFormData: TripFormData = {
            tripName: tripName || `${destination} Trip`,
            destination: destination,
            startDate: range.start,
            endDate: range.end,
            companions: companions,
            activities: activities.join(',')
        };
        
        setFormData(tripFormData);
        setShowActivitiesModal(false); // Close activities modal
        setShowPreviewModal(true); // Show preview modal
    };

    // Handle preview modal completion
    const handlePreviewComplete = async (keepActivities: boolean, itineraryItems?: ItineraryItem[]) => {
        try {
            setIsCreatingTrip(true);
            setShowPreviewModal(false);
            
            // Create trip in database
            const tripData = await tripsService.createTrip({
                name: formData.tripName,
                destination: formData.destination,
                start_date: formData.startDate,
                end_date: formData.endDate,
                companions: formData.companions,
                activities: formData.activities,
                status: 'planning'
            });

            // If user chose to keep activities, save them to database
            if (keepActivities && itineraryItems) {
                for (const item of itineraryItems) {
                    await itineraryService.createItineraryItem({
                        trip_id: tripData.id,
                        title: item.title,
                        description: item.description,
                        date: item.date,
                        time: item.time,
                        location: item.location,
                        category: item.category,
                        priority: item.priority,
                        item_order: item.item_order
                    });
                }
            }

            // Navigate to chatAI with the trip ID and other params
            router.replace({
                pathname: '/(root)/chatAI',
                params: {
                    tripId: tripData.id,
                    tripName: formData.tripName,
                    destination: formData.destination,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    companions: formData.companions,
                    activities: formData.activities,
                },
            });
        } catch (error) {
            console.error('Error creating trip:', error);
            Alert.alert(
                'Error', 
                'Failed to create your trip. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsCreatingTrip(false);
        }
    };

    // Handle preview modal cancel
    const handlePreviewCancel = () => {
        setShowPreviewModal(false);
        // User cancelled, don't create trip
    };

    // Calculate form completion progress (without activities)
    const getFormProgress = () => {
        let completed = 0;
        const total = 3; // destination, dates, companions (activities moved to modal)
        
        if (destination) completed++;
        if (range.start && range.end) completed++;
        if (companions) completed++; // companions always has a default value
        
        return (completed / total) * 100;
    };

    // helper to get month name from date string
    function getMonthName(dateStr: string) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('default', { month: 'long' });
    }
    // helper to get day from date string
    function getDay(dateStr: string) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.getDate();
    }
    // helper to get formatted range string
    function getDateRangeDisplay(start: string, end: string) {
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const month = endDate.toLocaleString('default', { month: 'long' });
            return `${startDate.getDate()} → ${endDate.getDate()} ${month}`;
        }
        return 'Start date → End date';
    }

    // helper for markedDates for react-native-calendars
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

    return (
        <View className="flex-1 bg-primaryBG">
            {/* Header */}
            <View className="pt-12 px-4 pb-4 border-b border-border">
                <View className="flex-row items-center justify-between">
                    <Text className="text-2xl font-BellezaRegular text-primaryFont">Trip Details</Text>
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
                            {Math.round(getFormProgress() / 33.33)} of 3 completed
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
                {/* trip name */}
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

                {/* destination */}
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
                {/* dates */}
                <Text className="text-primaryFont font-UrbanistSemiBold mb-2">When do you want to go?</Text>
                <TouchableOpacity
                    className="flex-row items-center w-full bg-secondaryBG border border-border rounded-xl px-4 py-3 mb-8"
                    onPress={handleDateRangePress}
                    activeOpacity={0.8}
                >
                    <Text className="text-2xl mr-3">📅</Text>
                    <Text className={`text-primaryFont font-UrbanistSemiBold ${range.start && range.end ? '' : 'opacity-60'}`}
                    >
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
                            onDayPress={handleDayPress}
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
                {/* companions */}
                <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Who's coming with you?</Text>
                <View className="flex-row flex-wrap gap-2 mb-8">
                    {companionOptions.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        className={`px-4 py-2 rounded-full border ${companions === option.value ? 'bg-accentFont/50 border-accentFont/50' : 'bg-secondaryBG border-border'}`}
                        onPress={() => setCompanions(option.value)}
                        activeOpacity={0.8}
                    >
                        <Text className={`font-UrbanistSemiBold ${companions === option.value ? 'text-primaryFont' : 'text-primaryFont'}`}>{option.label}</Text>
                    </TouchableOpacity>
                    ))}
                </View>

                {/* continue button */}
                <TouchableOpacity
                    className={`px-8 py-3 rounded-xl w-full items-center mb-4 ${(!destination || !range.start || !range.end) ? 'bg-accentFont/30' : 'bg-accentFont/50'}`}
                    onPress={handleContinue}
                    disabled={!destination || !range.start || !range.end}
                    activeOpacity={0.8}
                >
                    <Text className="text-primaryBG font-UrbanistSemiBold">
                        Continue
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Activities Selection Modal */}
            <Modal
                visible={showActivitiesModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowActivitiesModal(false)}
            >
                <View className="flex-1 bg-primaryBG">
                    {/* Modal Header */}
                    <View className="pt-12 px-4 pb-4 border-b border-border">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-2xl font-BellezaRegular text-primaryFont">What's your travel vibe?</Text>
                            <TouchableOpacity
                                onPress={() => setShowActivitiesModal(false)}
                                accessibilityLabel="Close activities modal"
                                activeOpacity={0.8}
                            >
                                <Text className="text-2xl text-secondaryFont">✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <Text className="text-secondaryFont mt-2 font-UrbanistRegular">
                            How do you want to spend your time in {destination}?
                        </Text>
                    </View>

                    <ScrollView className="flex-1 px-4 pt-8" showsVerticalScrollIndicator={false}>
                        {/* activities */}
                        <Text className="text-primaryFont font-UrbanistSemiBold mb-4 text-lg">Select one or more</Text>
                        <View className="flex-row flex-wrap gap-3 mb-8">
                            {activityOptions.map((activity) => (
                                <TouchableOpacity
                                    key={activity}
                                    className={`px-6 py-3 rounded-full border ${activities.includes(activity) ? 'bg-accentFont/50 border-accentFont/50' : 'bg-secondaryBG border-border'}`}
                                    onPress={() => toggleActivity(activity)}
                                    activeOpacity={0.8}
                                >
                                    <Text className={`font-UrbanistSemiBold ${activities.includes(activity) ? 'text-primaryFont' : 'text-primaryFont'}`}>
                                        {activity}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Selected activities count */}
                        {activities.length > 0 && (
                            <View className="bg-secondaryBG/50 rounded-xl p-4 mb-6">
                                <Text className="text-primaryFont font-UrbanistSemiBold mb-2">
                                    Selected Activities ({activities.length})
                                </Text>
                                <Text className="text-secondaryFont text-sm">
                                    {activities.join(', ')}
                                </Text>
                            </View>
                        )}

                        {/* Create Trip Button */}
                        <TouchableOpacity
                            className={`px-8 py-4 rounded-xl w-full items-center mb-8 ${(activities.length === 0 || isCreatingTrip) ? 'bg-accentFont/30' : 'bg-accentFont/70'}`}
                            onPress={handleSubmit}
                            disabled={activities.length === 0 || isCreatingTrip}
                            activeOpacity={0.8}
                        >
                            <Text className="text-primaryBG font-UrbanistSemiBold text-lg">
                                {isCreatingTrip ? 'Creating Your Trip...' : 'Create My Trip'}
                            </Text>
                        </TouchableOpacity>

                        {/* Skip Option
                        <TouchableOpacity
                            className="px-8 py-3 rounded-xl w-full items-center mb-4 border border-border"
                            onPress={handleSubmit}
                            disabled={isCreatingTrip}
                            activeOpacity={0.8}
                        >
                            <Text className="text-secondaryFont font-UrbanistRegular">
                                Skip for now
                            </Text>
                        </TouchableOpacity> */}
                    </ScrollView>
                </View>
            </Modal>

            {/* Initial Itinerary Preview Modal */}
            <InitialItineraryPreviewModal
                visible={showPreviewModal}
                tripData={formData}
                onComplete={handlePreviewComplete}
                onCancel={handlePreviewCancel}
            />
        </View>
    );
};

export default SmartForm;