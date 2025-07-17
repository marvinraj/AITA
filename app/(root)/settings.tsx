import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
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
                    onPress={() => {
                        if (item.route) {
                            router.push(item.route as any);
                        }
                    }}
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
                    className="bg-accentFont py-4 rounded-full items-center"
                >
                    <Text className="text-primaryFont font-BellezaRegular text-lg">Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SettingsScreen;
