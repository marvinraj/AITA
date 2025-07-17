import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Switch, Text, TouchableOpacity, View } from 'react-native';

const AppearanceScreen = () => {
    const router = useRouter();
    
    // State for appearance preferences
    const [theme, setTheme] = useState('system');
    const [fontSize, setFontSize] = useState('medium');
    const [animations, setAnimations] = useState(true);
    const [hapticFeedback, setHapticFeedback] = useState(true);

    const themeOptions = [
        { value: 'light', label: 'Light', description: 'Always use light theme' },
        { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
        { value: 'system', label: 'System', description: 'Follow system settings' },
    ];

    const fontSizeOptions = [
        { value: 'small', label: 'Small', description: 'Compact text size' },
        { value: 'medium', label: 'Medium', description: 'Default text size' },
        { value: 'large', label: 'Large', description: 'Larger text for better readability' },
    ];

    const renderThemeSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Theme
            </Text>
            {themeOptions.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border"
                    onPress={() => setTheme(option.value)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular">
                            {option.label}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {option.description}
                        </Text>
                    </View>
                    {theme === option.value && (
                        <Entypo name="check" size={20} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderFontSizeSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Text Size
            </Text>
            {fontSizeOptions.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border"
                    onPress={() => setFontSize(option.value)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular">
                            {option.label}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {option.description}
                        </Text>
                    </View>
                    {fontSize === option.value && (
                        <Entypo name="check" size={20} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderInteractionSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Interaction
            </Text>
            
            <View className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border">
                <View className="flex-1">
                    <Text className="text-primaryFont text-base font-InterRegular mb-1">
                        Animations
                    </Text>
                    <Text className="text-secondaryFont text-xs font-InterRegular">
                        Enable smooth transitions and animations
                    </Text>
                </View>
                <Switch
                    value={animations}
                    onValueChange={setAnimations}
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={animations ? '#ffffff' : '#f4f3f4'}
                />
            </View>
            
            <View className="flex-row items-center px-4 py-4 bg-primaryBG">
                <View className="flex-1">
                    <Text className="text-primaryFont text-base font-InterRegular mb-1">
                        Haptic feedback
                    </Text>
                    <Text className="text-secondaryFont text-xs font-InterRegular">
                        Feel vibrations when interacting with the app
                    </Text>
                </View>
                <Switch
                    value={hapticFeedback}
                    onValueChange={setHapticFeedback}
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={hapticFeedback ? '#ffffff' : '#f4f3f4'}
                />
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
                    Appearance
                </Text>
            </View>

            {/* Settings Content */}
            <FlatList
                data={['theme', 'fontSize', 'interaction']}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                    switch (item) {
                        case 'theme':
                            return renderThemeSection();
                        case 'fontSize':
                            return renderFontSizeSection();
                        case 'interaction':
                            return renderInteractionSection();
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

export default AppearanceScreen;
