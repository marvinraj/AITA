import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View, Switch, FlatList } from 'react-native';

const NotificationsScreen = () => {
    const router = useRouter();
    
    // State for notification preferences
    const [pushEnabled, setPushEnabled] = useState(true);
    const [tripReminders, setTripReminders] = useState(true);
    const [weatherAlerts, setWeatherAlerts] = useState(true);
    const [flightUpdates, setFlightUpdates] = useState(true);
    const [budgetAlerts, setBudgetAlerts] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    const notificationOptions = [
        {
            key: 'push',
            title: 'Push notifications',
            description: 'Enable all push notifications',
            value: pushEnabled,
            onChange: setPushEnabled,
            isMain: true,
        },
        {
            key: 'trip',
            title: 'Trip reminders',
            description: 'Reminders about upcoming trips and activities',
            value: tripReminders,
            onChange: setTripReminders,
            disabled: !pushEnabled,
        },
        {
            key: 'weather',
            title: 'Weather alerts',
            description: 'Important weather updates for your destinations',
            value: weatherAlerts,
            onChange: setWeatherAlerts,
            disabled: !pushEnabled,
        },
        {
            key: 'flight',
            title: 'Flight updates',
            description: 'Flight status changes and gate information',
            value: flightUpdates,
            onChange: setFlightUpdates,
            disabled: !pushEnabled,
        },
        {
            key: 'budget',
            title: 'Budget alerts',
            description: 'Notifications when you approach spending limits',
            value: budgetAlerts,
            onChange: setBudgetAlerts,
            disabled: !pushEnabled,
        },
        {
            key: 'ai',
            title: 'AI suggestions',
            description: 'Personalized travel recommendations and tips',
            value: aiSuggestions,
            onChange: setAiSuggestions,
            disabled: !pushEnabled,
        },
    ];

    const emailOptions = [
        {
            key: 'marketing',
            title: 'Marketing emails',
            description: 'Travel deals, features updates, and newsletters',
            value: marketingEmails,
            onChange: setMarketingEmails,
        },
    ];

    const renderNotificationSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Push Notifications
            </Text>
            {notificationOptions.map((option, index) => (
                <View
                    key={option.key}
                    className={`flex-row items-center px-4 py-4 bg-primaryBG ${
                        index < notificationOptions.length - 1 ? 'border-b border-border' : ''
                    } ${option.disabled ? 'opacity-50' : ''}`}
                >
                    <View className="flex-1">
                        <Text className={`text-base font-InterRegular mb-1 ${
                            option.isMain ? 'text-primaryFont font-semibold' : 'text-primaryFont'
                        }`}>
                            {option.title}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {option.description}
                        </Text>
                    </View>
                    <Switch
                        value={option.value}
                        onValueChange={option.onChange}
                        disabled={option.disabled}
                        trackColor={{ false: '#767577', true: '#10B981' }}
                        thumbColor={option.value ? '#ffffff' : '#f4f3f4'}
                    />
                </View>
            ))}
        </View>
    );

    const renderEmailSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Email Notifications
            </Text>
            {emailOptions.map((option, index) => (
                <View
                    key={option.key}
                    className={`flex-row items-center px-4 py-4 bg-primaryBG ${
                        index < emailOptions.length - 1 ? 'border-b border-border' : ''
                    }`}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular mb-1">
                            {option.title}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {option.description}
                        </Text>
                    </View>
                    <Switch
                        value={option.value}
                        onValueChange={option.onChange}
                        trackColor={{ false: '#767577', true: '#10B981' }}
                        thumbColor={option.value ? '#ffffff' : '#f4f3f4'}
                    />
                </View>
            ))}
        </View>
    );

    const renderQuietHoursSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Quiet Hours
            </Text>
            <TouchableOpacity className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border">
                <View className="flex-1">
                    <Text className="text-primaryFont text-base font-InterRegular mb-1">
                        Set quiet hours
                    </Text>
                    <Text className="text-secondaryFont text-xs font-InterRegular">
                        Disable notifications during specified hours
                    </Text>
                </View>
                <Text className="text-secondaryFont text-sm font-InterRegular mr-2">
                    10:00 PM - 8:00 AM
                </Text>
                <Entypo name="chevron-right" size={22} color="#888" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-primaryBG">
            {/* Header */}
            <View className="flex-row items-center px-4 pt-12 pb-6">
                <TouchableOpacity onPress={() => router.back()} className="pr-4">
                    <Entypo name="chevron-left" size={24} color="#828282" />
                </TouchableOpacity>
                <Text className="text-primaryFont text-2xl font-BellezaRegular flex-1 text-center -ml-8">
                    Notifications
                </Text>
            </View>

            {/* Settings Content */}
            <FlatList
                data={['notifications', 'email', 'quietHours']}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                    switch (item) {
                        case 'notifications':
                            return renderNotificationSection();
                        case 'email':
                            return renderEmailSection();
                        case 'quietHours':
                            return renderQuietHoursSection();
                        default:
                            return null;
                    }
                }}
                contentContainerStyle={{ paddingBottom: 50, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default NotificationsScreen;
