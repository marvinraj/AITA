import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { tripsService } from '../../../../lib/services/tripsService';

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
    // state variable for destination
    const [destination, setDestination] = useState('');
    // state variable for companions
    const [companions, setCompanions] = useState('solo');
    // state variable for selected activities
    const [activities, setActivities] = useState<string[]>([]);
    // calendar modal state
    const [showCalendar, setShowCalendar] = useState(false);
    const [range, setRange] = useState<{start: string, end: string}>({ start: '', end: '' });
    // loading state for trip creation
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);

    // function to toggle activity selection
    const toggleActivity = (activity: string) => {
        setActivities((prev) =>
        prev.includes(activity)
            ? prev.filter((a) => a !== activity)
            : [...prev, activity]
        );
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

    // function to handle form submission
    const handleSubmit = async () => {
        try {
            setIsCreatingTrip(true);
            
            // Create trip in database
            const tripData = await tripsService.createTrip({
                name: `${destination} Trip`,
                destination: destination,
                start_date: range.start,
                end_date: range.end,
                companions: companions,
                activities: activities.join(','),
                status: 'planning'
            });

            // Navigate to chatAI with the trip ID and other params
            router.push({
                pathname: '/travelai/chatAI',
                params: {
                    tripId: tripData.id,
                    destination,
                    startDate: range.start,
                    endDate: range.end,
                    companions,
                    activities: activities.join(','),
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
        const marked: any = {};
        if (range.start) {
            marked[range.start] = { startingDay: true, color: '#7C3AED', textColor: '#fff' };
        }
        if (range.start && range.end) {
            let current = new Date(range.start);
            const end = new Date(range.end);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                if (dateStr !== range.start && dateStr !== range.end) {
                    marked[dateStr] = { color: '#a78bfa', textColor: '#fff' };
                }
                current.setDate(current.getDate() + 1);
            }
            marked[range.end] = { endingDay: true, color: '#7C3AED', textColor: '#fff' };
        }
        return marked;
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
            </View>

            <ScrollView 
                className="flex-1 px-4 pt-8"
                showsVerticalScrollIndicator={false}
            >
                {/* destination */}
                <Text className="text-primaryFont font-UrbanistSemiBold mb-2">Where do you want to go?</Text>
                <TextInput
                    className="bg-secondaryBG text-primaryFont rounded-xl px-4 py-3 mb-8 border border-border"
                    placeholder="Enter destination"
                    placeholderTextColor="#888"
                    value={destination}
                    onChangeText={setDestination}
                />
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
                    <View className="w-full mb-4 rounded-2xl overflow-hidden bg-secondaryBG border border-border shadow-lg">
                        <Calendar
                            markingType={'period'}
                            markedDates={getMarkedDates(range)}
                            onDayPress={handleDayPress}
                            minDate={new Date().toISOString().split('T')[0]}
                            theme={{
                                backgroundColor: '#232325',
                                calendarBackground: '#232325',
                                textSectionTitleColor: '#fff',
                                dayTextColor: '#fff',
                                todayTextColor: '#7C3AED',
                                selectedDayBackgroundColor: '#7C3AED',
                                selectedDayTextColor: '#fff',
                                monthTextColor: '#fff',
                                arrowColor: '#fff',
                                textDisabledColor: '#444',
                                textDayFontFamily: 'Inter-Regular',
                                textMonthFontFamily: 'Inter-Bold',
                                textDayHeaderFontFamily: 'Inter-Regular',
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14,
                            }}
                        />
                        <View className="flex-row justify-between px-4 py-2 border-t border-border bg-secondaryBG">
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
                        className={`px-4 py-2 rounded-full border ${companions === option.value ? 'bg-accentFont border-accentFont' : 'bg-secondaryBG border-border'}`}
                        onPress={() => setCompanions(option.value)}
                        activeOpacity={0.8}
                    >
                        <Text className={`font-UrbanistSemiBold ${companions === option.value ? 'text-primaryBG' : 'text-primaryFont'}`}>{option.label}</Text>
                    </TouchableOpacity>
                    ))}
                </View>
                {/* activities */}
                <Text className="text-primaryFont font-UrbanistSemiBold mb-2">How do you want to spend your time?</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                    {activityOptions.map((activity) => (
                    <TouchableOpacity
                        key={activity}
                        className={`px-4 py-2 rounded-full border ${activities.includes(activity) ? 'bg-accentFont border-accentFont' : 'bg-secondaryBG border-border'}`}
                        onPress={() => toggleActivity(activity)}
                        activeOpacity={0.8}
                    >
                        <Text className={`font-UrbanistSemiBold ${activities.includes(activity) ? 'text-primaryBG' : 'text-primaryFont'}`}>{activity}</Text>
                    </TouchableOpacity>
                    ))}
                </View>
                {/* submit button */}
                <TouchableOpacity
                    className={`px-8 py-3 rounded-xl w-full items-center mb-4 ${(!destination || !range.start || !range.end || activities.length === 0 || isCreatingTrip) ? 'bg-accentFont/50' : 'bg-accentFont'}`}
                    onPress={handleSubmit}
                    disabled={!destination || !range.start || !range.end || activities.length === 0 || isCreatingTrip}
                    activeOpacity={0.8}
                >
                    <Text className="text-primaryBG font-UrbanistSemiBold">
                        {isCreatingTrip ? 'Creating Trip...' : 'Continue'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default SmartForm;