import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Linking, Text, TouchableOpacity, View } from 'react-native';

const HelpScreen = () => {
    const router = useRouter();
    
    const helpSections = [
        {
            title: 'Getting Started',
            items: [
                {
                    title: 'How to create your first trip',
                    description: 'Step-by-step guide to planning your journey',
                    action: () => {/* Navigate to tutorial */}
                },
                {
                    title: 'Using the AI assistant',
                    description: 'Tips for getting the best travel recommendations',
                    action: () => {/* Navigate to AI guide */}
                },
                {
                    title: 'Setting up your profile',
                    description: 'Personalize your travel experience',
                    action: () => {/* Navigate to profile guide */}
                },
            ]
        },
        {
            title: 'Features',
            items: [
                {
                    title: 'Itinerary planning',
                    description: 'Create and manage detailed travel itineraries',
                    action: () => {/* Navigate to itinerary help */}
                },
                {
                    title: 'Budget tracking',
                    description: 'Monitor your travel expenses',
                    action: () => {/* Navigate to budget help */}
                },
                {
                    title: 'Offline features',
                    description: 'What works without internet connection',
                    action: () => {/* Navigate to offline help */}
                },
                {
                    title: 'Sharing trips',
                    description: 'Collaborate with travel companions',
                    action: () => {/* Navigate to sharing help */}
                },
            ]
        },
        {
            title: 'Support',
            items: [
                {
                    title: 'Contact support',
                    description: 'Get help from our support team',
                    action: () => Linking.openURL('mailto:support@trava.com'),
                    external: true
                },
                {
                    title: 'Report a bug',
                    description: 'Help us improve the app',
                    action: () => Linking.openURL('mailto:bugs@trava.com'),
                    external: true
                },
                {
                    title: 'Feature requests',
                    description: 'Suggest new features',
                    action: () => Linking.openURL('mailto:feedback@trava.com'),
                    external: true
                },
                {
                    title: 'Privacy policy',
                    description: 'How we handle your data',
                    action: () => Linking.openURL('https://trava.com/privacy'),
                    external: true
                },
                {
                    title: 'Terms of service',
                    description: 'Terms and conditions',
                    action: () => Linking.openURL('https://trava.com/terms'),
                    external: true
                },
            ]
        }
    ];

    const renderSection = (section: typeof helpSections[0]) => (
        <View key={section.title} className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                {section.title}
            </Text>
            {section.items.map((item, index) => (
                <TouchableOpacity
                    key={item.title}
                    className={`flex-row items-center px-4 py-4 bg-primaryBG ${
                        index < section.items.length - 1 ? 'border-b border-border' : ''
                    }`}
                    onPress={item.action}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular mb-1">
                            {item.title}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {item.description}
                        </Text>
                    </View>
                    <Entypo 
                        name={('external' in item && item.external) ? "export" : "chevron-right"} 
                        size={22} 
                        color="#888" 
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderAppInfo = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                App Information
            </Text>
            <View className="px-4 py-4 bg-primaryBG border-b border-border">
                <Text className="text-primaryFont text-base font-InterRegular mb-1">
                    Version
                </Text>
                <Text className="text-secondaryFont text-xs font-InterRegular">
                    1.0.0 (Build 1)
                </Text>
            </View>
            <View className="px-4 py-4 bg-primaryBG">
                <Text className="text-primaryFont text-base font-InterRegular mb-1">
                    Last updated
                </Text>
                <Text className="text-secondaryFont text-xs font-InterRegular">
                    December 2024
                </Text>
            </View>
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
                    Help & Support
                </Text>
            </View>

            {/* Help Content */}
            <FlatList
                data={[...helpSections, { title: 'app-info', items: [] }]}
                keyExtractor={(item) => item.title}
                renderItem={({ item }) => {
                    if (item.title === 'app-info') {
                        return renderAppInfo();
                    }
                    return renderSection(item);
                }}
                contentContainerStyle={{ paddingBottom: 50, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default HelpScreen;
