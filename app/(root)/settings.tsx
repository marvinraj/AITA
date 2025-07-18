import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { notificationService } from '../../lib/services/notificationService';
import { supabase } from '../../lib/supabase';

// settings options data organized by category
// each option has a title, subtitle, route, an optional status dot, and category for grouping
const settingsOptions = [
  // Profile & Account Section
  {
    title: 'Edit profile',
    subtitle: 'Photo, username, bio and more',
    route: '/(root)/edit-profile',
    category: 'profile',
  },
  {
    title: 'Account',
    subtitle: 'Email, birthday, country',
    route: '/(root)/account',
    statusDot: true,
    category: 'profile',
  },
  {
    title: 'Password',
    subtitle: 'Update your password',
    route: '/(root)/password',
    category: 'profile',
  },
  
  // Travel Preferences Section
  {
    title: 'Travel preferences',
    subtitle: 'Currency, units, home location',
    route: '/(root)/travel-preferences',
    category: 'travel',
  },
  {
    title: 'AI assistant',
    subtitle: 'Customize AI responses and features',
    route: '/(root)/ai-settings',
    category: 'travel',
  },
  {
    title: 'Map settings',
    subtitle: 'Default map style and offline data',
    route: '/(root)/map-settings',
    category: 'travel',
  },
  
  // Notifications & Privacy Section
  {
    title: 'Notifications',
    subtitle: 'Push notifications and travel alerts',
    route: '/(root)/notifications',
    category: 'notifications',
  },
  {
    title: 'Privacy & data',
    subtitle: 'Location sharing and data usage',
    route: '/(root)/privacy',
    category: 'notifications',
  },
  
  // Demo Notifications Section
  {
    title: 'Test Trip Reminder',
    subtitle: 'Send a demo trip reminder notification',
    route: 'demo_trip_reminder',
    category: 'demo',
  },
  {
    title: 'Test Location Alert',
    subtitle: 'Send a demo location-based notification',
    route: 'demo_location_alert',
    category: 'demo',
  },
  {
    title: 'Test Weather Alert',
    subtitle: 'Send a demo weather notification',
    route: 'demo_weather_alert',
    category: 'demo',
  },
  {
    title: 'Test Scheduled Reminder',
    subtitle: 'Test scheduling system (10 second delay)',
    route: 'demo_scheduled_reminder',
    category: 'demo',
  },
  {
    title: 'Test Filter Notifications',
    subtitle: 'Send multiple trip notifications to test filter',
    route: 'demo_filter_notifications',
    category: 'demo',
  },
  
  // App Settings Section
  {
    title: 'Appearance',
    subtitle: 'Theme, language and display',
    route: '/(root)/appearance',
    category: 'app',
  },
  {
    title: 'Subscription',
    subtitle: 'Manage your premium features',
    route: '/(root)/subscription',
    category: 'app',
  },
  {
    title: 'Help & support',
    subtitle: 'FAQs, contact support, tutorials',
    route: '/(root)/help',
    category: 'app',
  },
];

const SettingsScreen = () => {
    // useRouter hook from expo-router to navigate between screens
    const router = useRouter();

    // Demo notification functions
    const sendDemoTripReminder = async () => {
        try {
            await notificationService.sendImmediateNotification(
                '🛫 Trip Reminder: Paris Adventure',
                'Your trip to Paris starts tomorrow! Don\'t forget to check-in for your flight.',
                { 
                    type: 'trip_reminder', 
                    tripId: 'demo-trip-paris', 
                    tripName: 'Paris Adventure',
                    destination: 'Paris' 
                },
                'high'
            );
            Alert.alert('Demo Sent!', 'Check your notifications tab to see the trip reminder.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send demo notification. Make sure notifications are enabled.');
        }
    };

    const sendDemoLocationAlert = async () => {
        try {
            await notificationService.sendImmediateNotification(
                '📍 Welcome to Tokyo!',
                'You\'ve arrived at your destination. Check out nearby restaurants and attractions!',
                { 
                    type: 'location_arrival', 
                    tripId: 'demo-trip-tokyo',
                    tripName: 'Tokyo Adventure',
                    destination: 'Tokyo' 
                },
                'normal'
            );
            Alert.alert('Demo Sent!', 'Check your notifications tab to see the location alert.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send demo notification.');
        }
    };

    const sendDemoWeatherAlert = async () => {
        try {
            await notificationService.sendImmediateNotification(
                '🌧️ Weather Alert: Rain Expected',
                'Rain is forecasted for this afternoon. Consider indoor activities or bring an umbrella!',
                { 
                    type: 'weather_alert', 
                    tripId: 'demo-trip-london',
                    tripName: 'London Business Trip',
                    destination: 'Current Location' 
                },
                'normal'
            );
            Alert.alert('Demo Sent!', 'Check your notifications tab to see the weather alert.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send demo notification.');
        }
    };

    const sendDemoScheduledReminder = async () => {
        try {
            // Schedule a notification for 10 seconds from now to test timing
            const futureTime = Date.now() + (10 * 1000); // 10 seconds from now
            
            await notificationService.scheduleTripReminder({
                tripId: 'test-trip',
                type: 'departure',
                scheduledTime: futureTime,
                title: '🧪 Test Scheduled Notification',
                body: 'This notification was scheduled 10 seconds ago to test timing!',
                data: { test: true }
            });
            
            Alert.alert(
                'Scheduled!', 
                'A test notification will appear in 10 seconds. Keep the app open to see it work!'
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to schedule test notification.');
        }
    };

    const sendDemoFilterNotifications = async () => {
        try {
            // Send multiple notifications for different trips to test filtering
            await notificationService.sendImmediateNotification(
                '📦 Pack for Paris Trip',
                'Don\'t forget to pack your camera and comfortable shoes!',
                { 
                    type: 'trip_reminder', 
                    tripId: 'paris-trip-123',
                    tripName: 'Paris Adventure',
                    destination: 'Paris'
                },
                'high'
            );

            await notificationService.sendImmediateNotification(
                '✈️ Tokyo Flight Check-in',
                'Check-in for your Tokyo flight opens in 2 hours.',
                { 
                    type: 'trip_reminder', 
                    tripId: 'tokyo-trip-456',
                    tripName: 'Tokyo Business Trip',
                    destination: 'Tokyo'
                },
                'normal'
            );

            await notificationService.sendImmediateNotification(
                '🏖️ Bali Activity Reminder',
                'Your snorkeling tour starts in 1 hour at the beach!',
                { 
                    type: 'activity_suggestion', 
                    tripId: 'bali-trip-789',
                    tripName: 'Bali Vacation',
                    destination: 'Bali'
                },
                'normal'
            );

            Alert.alert(
                'Demo Notifications Sent!', 
                'Check your Activity tab and try the filter button to filter by trip!'
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to send demo notifications.');
        }
    };

    const clearAllNotifications = async () => {
        try {
            Alert.alert(
                'Clear All Notifications',
                'Are you sure you want to clear all notifications from the Activity page? This action cannot be undone.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Clear All',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await notificationService.clearAllNotifications();
                                Alert.alert(
                                    'Success',
                                    'All notifications have been cleared from the Activity page.'
                                );
                            } catch (error) {
                                Alert.alert('Error', 'Failed to clear notifications.');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to clear notifications.');
        }
    };

    // Handle setting item press
    const handleSettingPress = (route: string) => {
        switch (route) {
            case 'demo_trip_reminder':
                sendDemoTripReminder();
                break;
            case 'demo_location_alert':
                sendDemoLocationAlert();
                break;
            case 'demo_weather_alert':
                sendDemoWeatherAlert();
                break;
            case 'demo_scheduled_reminder':
                sendDemoScheduledReminder();
                break;
            case 'demo_filter_notifications':
                sendDemoFilterNotifications();
                break;
            default:
                router.push(route as any);
                break;
        }
    };

    // Group settings by category for better organization
    const groupedSettings = settingsOptions.reduce((acc, setting) => {
        if (!acc[setting.category]) {
            acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
    }, {} as Record<string, typeof settingsOptions>);

    const categoryTitles = {
        profile: 'Profile & Account',
        travel: 'Travel Settings',
        notifications: 'Notifications & Privacy',
        demo: 'Demo Notifications (Testing)',
        app: 'App Settings'
    };

    // Render category sections
    const renderCategorySection = (category: string, items: typeof settingsOptions) => (
        <View key={category} className="mb-8">
            <Text className="text-secondaryFont text-base font-UrbanistSemiBold uppercase tracking-wider px-4 mb-2">
                {categoryTitles[category as keyof typeof categoryTitles]}
            </Text>
            {items.map((item, index) => (
                <TouchableOpacity
                    key={item.title}
                    className={`flex-row items-center px-4 py-4 bg-primaryBG ${
                        index < items.length - 1 ? 'border-b border-border' : ''
                    }`}
                    style={{
                        borderBottomWidth: index < items.length - 1 ? 0.2 : 0
                    }}
                    onPress={() => handleSettingPress(item.route)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular mb-1">{item.title}</Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">{item.subtitle}</Text>
                    </View>
                    {item.statusDot && <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />}
                    <Entypo name="chevron-right" size={22} color="#888" />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View className="flex-1 bg-primaryBG">
            {/* header */}
            <View className="flex-row items-center px-4 pt-12 pb-6 border-b border-border mb-6">
                <TouchableOpacity onPress={() => router.back()} className="pr-4">
                    <Entypo name="chevron-left" size={24} color="#828282" />
                </TouchableOpacity>
                <Text className="text-primaryFont text-2xl font-BellezaRegular flex-1 text-center -ml-8">Settings</Text>
            </View>
            
            {/* settings list organized by categories */}
            <FlatList
                data={Object.keys(groupedSettings)}
                keyExtractor={category => category}
                renderItem={({ item: category }) => renderCategorySection(category, groupedSettings[category])}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
            />
            
            {/* sign out button at bottom */}
            <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 bg-primaryBG">
                <TouchableOpacity
                    onPress={async () => {
                        await supabase.auth.signOut();
                        router.replace('/(auth)/sign-in');
                    }}
                    className="bg-buttonPrimary py-4 rounded-full items-center"
                >
                    <Text className="text-primaryBG font-BellezaRegular text-lg">Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SettingsScreen;
