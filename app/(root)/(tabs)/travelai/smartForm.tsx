import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

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
    const handleSubmit = () => {
        // pass form data to chatAI screen (could use params, context, or global state)
        router.push({
        pathname: '/travelai/chatAI',
        params: {
            destination,
            startDate: range.start,
            endDate: range.end,
            companions,
            activities: activities.join(','),
        },
        });
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
        <ScrollView
            className="flex-1 bg-primaryBG px-6"
            contentContainerStyle={{ alignItems: 'center', paddingTop: 40, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
        >
            {/* close button */}
            <TouchableOpacity
                className="absolute top-6 right-1 z-20 bg-[#232325] border border-[#39393b] rounded-full w-10 h-10 items-center justify-center shadow-md"
                onPress={() => router.back()}
                accessibilityLabel="Close form"
                activeOpacity={0.8}
            >
                <Text className="text-2xl text-secondaryFont">✕</Text>
            </TouchableOpacity>
            {/* title */}
            <Text className="text-3xl font-BellezaRegular text-primaryFont mb-10 mt-2 tracking-wide">Trip Details</Text>
            {/* destination */}
            <View className="w-full mb-7">
                <Text className="text-primaryFont font-InterBold mb-2 w-full">Where do you want to go?</Text>
                <TextInput
                    className="bg-[#232325] text-primaryFont rounded-xl px-5 py-4 mb-1 w-full border border-[#39393b] text-base focus:border-accentFont"
                    placeholder="Enter destination"
                    placeholderTextColor="#888"
                    value={destination}
                    onChangeText={setDestination}
                />
            </View>
            {/* divider */}
            <View className="w-full h-[1px] bg-[#39393b] opacity-60 mb-7 rounded-full" />
            {/* dates */}
            <View className="w-full mb-7">
                <Text className="text-primaryFont font-InterBold mb-2 w-full">When do you want to go?</Text>
                <TouchableOpacity
                    className="flex-row items-center w-full bg-[#232325] border border-[#39393b] rounded-xl px-5 py-4 mb-1"
                    onPress={handleDateRangePress}
                    activeOpacity={0.8}
                >
                    <Text className="text-2xl mr-3">📅</Text>
                    <Text className={`text-primaryFont font-semibold text-lg ${range.start && range.end ? '' : 'opacity-60'}`}
                    >
                        {getDateRangeDisplay(range.start, range.end)}
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Calendar picker */}
            {showCalendar && (
                <View className="w-full mb-7 rounded-2xl overflow-hidden bg-[#232325] border border-[#39393b] shadow-lg">
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
                    <View className="flex-row justify-between px-4 py-2 border-t border-[#39393b] bg-[#232325]">
                        <TouchableOpacity onPress={() => { setRange({ start: '', end: '' }); }}>
                            <Text className="text-secondaryFont font-semibold">Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowCalendar(false)}>
                            <Text className="text-accentFont font-bold">Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            {/* divider */}
            <View className="w-full h-[1px] bg-[#39393b] opacity-60 mb-7 rounded-full" />
            {/* companions */}
            <View className="w-full mb-7">
                <Text className="text-primaryFont font-InterBold mb-2 w-full">Who's coming with you?</Text>
                <View className="flex-row flex-wrap gap-2">
                    {companionOptions.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        className={`px-5 py-2 rounded-full border ${companions === option.value ? 'bg-accentFont border-accentFont shadow-md' : 'bg-[#232325] border-[#39393b]'} `}
                        onPress={() => setCompanions(option.value)}
                        activeOpacity={0.85}
                    >
                        <Text className={`font-InterRegular ${companions === option.value ? 'text-primaryBG font-InterBold' : 'text-primaryFont'}`}>{option.label}</Text>
                    </TouchableOpacity>
                    ))}
                </View>
            </View>
            {/* divider */}
            <View className="w-full h-[1px] bg-[#39393b] opacity-60 mb-7 rounded-full" />
            {/* activities */}
            <View className="w-full mb-10">
                <Text className="text-primaryFont font-InterBold mb-2 w-full">How do you want to spend your time?</Text>
                <View className="flex-row flex-wrap gap-2">
                    {activityOptions.map((activity) => (
                    <TouchableOpacity
                        key={activity}
                        className={`px-5 py-2 rounded-full border ${activities.includes(activity) ? 'bg-accentFont border-accentFont shadow-md' : 'bg-[#232325] border-[#39393b]'} `}
                        onPress={() => toggleActivity(activity)}
                        activeOpacity={0.85}
                    >
                        <Text className={`font-InterRegular ${activities.includes(activity) ? 'text-primaryBG font-InterBold' : 'text-primaryFont'}`}>{activity}</Text>
                    </TouchableOpacity>
                    ))}
                </View>
            </View>
            {/* submit button */}
            <TouchableOpacity
                className={`px-8 py-4 rounded-xl w-full items-center shadow-md ${(!destination || !range.start || !range.end || activities.length === 0) ? 'bg-[#a78bfa] opacity-60' : 'bg-accentFont'}`}
                onPress={handleSubmit}
                activeOpacity={0.85}
            >
                <Text className="text-primaryFont font-InterBold text-lg">Continue</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default SmartForm;
