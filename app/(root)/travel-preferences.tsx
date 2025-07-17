import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Switch, Text, TouchableOpacity, View } from 'react-native';

const TravelPreferencesScreen = () => {
    const router = useRouter();
    
    // State for preferences
    const [currency, setCurrency] = useState('USD');
    const [units, setUnits] = useState('metric');
    const [language, setLanguage] = useState('English');
    const [autoLocation, setAutoLocation] = useState(true);

    const currencyOptions = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    ];

    const unitOptions = [
        { value: 'metric', label: 'Metric (km, °C)', description: 'Kilometers, Celsius' },
        { value: 'imperial', label: 'Imperial (mi, °F)', description: 'Miles, Fahrenheit' },
    ];

    const languageOptions = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
    ];

    const renderCurrencySection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Default Currency
            </Text>
            {currencyOptions.map((option) => (
                <TouchableOpacity
                    key={option.code}
                    className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border"
                    onPress={() => setCurrency(option.code)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular">
                            {option.symbol} {option.name}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {option.code}
                        </Text>
                    </View>
                    {currency === option.code && (
                        <Entypo name="check" size={20} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderUnitsSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Units
            </Text>
            {unitOptions.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border"
                    onPress={() => setUnits(option.value)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular">
                            {option.label}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {option.description}
                        </Text>
                    </View>
                    {units === option.value && (
                        <Entypo name="check" size={20} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderLanguageSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Language
            </Text>
            {languageOptions.map((option) => (
                <TouchableOpacity
                    key={option.code}
                    className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border"
                    onPress={() => setLanguage(option.name)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular">
                            {option.name}
                        </Text>
                    </View>
                    {language === option.name && (
                        <Entypo name="check" size={20} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderLocationSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Location Services
            </Text>
            <View className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border">
                <View className="flex-1">
                    <Text className="text-primaryFont text-base font-InterRegular mb-1">
                        Auto-detect location
                    </Text>
                    <Text className="text-secondaryFont text-xs font-InterRegular">
                        Automatically use your current location for recommendations
                    </Text>
                </View>
                <Switch
                    value={autoLocation}
                    onValueChange={setAutoLocation}
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={autoLocation ? '#ffffff' : '#f4f3f4'}
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
                    Travel Preferences
                </Text>
            </View>

            {/* Settings Content */}
            <FlatList
                data={['currency', 'units', 'language', 'location']}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                    switch (item) {
                        case 'currency':
                            return renderCurrencySection();
                        case 'units':
                            return renderUnitsSection();
                        case 'language':
                            return renderLanguageSection();
                        case 'location':
                            return renderLocationSection();
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

export default TravelPreferencesScreen;
