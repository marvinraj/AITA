import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Switch, Text, TouchableOpacity, View } from 'react-native';

const AISettingsScreen = () => {
    const router = useRouter();
    
    // State for AI preferences
    const [responseStyle, setResponseStyle] = useState('balanced');
    const [autoSuggestions, setAutoSuggestions] = useState(true);
    const [contextAware, setContextAware] = useState(true);
    const [personalizedRecs, setPersonalizedRecs] = useState(true);
    const [chatHistory, setChatHistory] = useState(true);
    const [responseLength, setResponseLength] = useState(50);

    const responseStyleOptions = [
        { 
            value: 'concise', 
            label: 'Concise', 
            description: 'Short, direct answers',
            icon: 'flash'
        },
        { 
            value: 'balanced', 
            label: 'Balanced', 
            description: 'Good mix of detail and brevity',
            icon: 'adjust'
        },
        { 
            value: 'detailed', 
            label: 'Detailed', 
            description: 'Comprehensive, thorough responses',
            icon: 'text-document'
        },
        { 
            value: 'friendly', 
            label: 'Friendly', 
            description: 'Conversational and warm tone',
            icon: 'emoji-happy'
        },
    ];

    const aiFeatures = [
        {
            key: 'autoSuggestions',
            title: 'Auto-suggestions',
            description: 'Show suggested questions while typing',
            value: autoSuggestions,
            onChange: setAutoSuggestions,
        },
        {
            key: 'contextAware',
            title: 'Context awareness',
            description: 'AI remembers your current trip and preferences',
            value: contextAware,
            onChange: setContextAware,
        },
        {
            key: 'personalizedRecs',
            title: 'Personalized recommendations',
            description: 'AI learns from your travel patterns',
            value: personalizedRecs,
            onChange: setPersonalizedRecs,
        },
        {
            key: 'chatHistory',
            title: 'Save chat history',
            description: 'Keep conversation history for reference',
            value: chatHistory,
            onChange: setChatHistory,
        },
    ];

    const renderResponseStyleSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Response Style
            </Text>
            {responseStyleOptions.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border"
                    style={{
                        borderBottomWidth: 0.2,
                    }}
                    onPress={() => setResponseStyle(option.value)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular">
                            {option.label}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {option.description}
                        </Text>
                    </View>
                    {responseStyle === option.value && (
                        <Entypo name="check" size={20} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderFeaturesSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                AI Features
            </Text>
            {aiFeatures.map((feature, index) => (
                <View
                    key={feature.key}
                    className={`flex-row items-center px-4 py-4 bg-primaryBG ${
                        index < aiFeatures.length - 1 ? 'border-b border-border' : ''
                    }`}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular mb-1">
                            {feature.title}
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {feature.description}
                        </Text>
                    </View>
                    <Switch
                        value={feature.value}
                        onValueChange={feature.onChange}
                        trackColor={{ false: '#767577', true: '#10B981' }}
                        thumbColor={feature.value ? '#ffffff' : '#f4f3f4'}
                    />
                </View>
            ))}
        </View>
    );

    const renderResponseLengthSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Response Length Preference
            </Text>
            {['Short', 'Medium', 'Long'].map((length) => (
                <TouchableOpacity
                    key={length}
                    className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border"
                    onPress={() => setResponseLength(length === 'Short' ? 25 : length === 'Medium' ? 50 : 75)}
                >
                    <View className="flex-1">
                        <Text className="text-primaryFont text-base font-InterRegular">
                            {length} responses
                        </Text>
                        <Text className="text-secondaryFont text-xs font-InterRegular">
                            {length === 'Short' && 'Quick, concise answers'}
                            {length === 'Medium' && 'Balanced detail level'}
                            {length === 'Long' && 'Comprehensive, detailed responses'}
                        </Text>
                    </View>
                    {(
                        (length === 'Short' && responseLength < 35) ||
                        (length === 'Medium' && responseLength >= 35 && responseLength < 65) ||
                        (length === 'Long' && responseLength >= 65)
                    ) && (
                        <Entypo name="check" size={20} color="#10B981" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderDataSection = () => (
        <View className="mb-8">
            <Text className="text-secondaryFont text-sm font-InterRegular uppercase tracking-wider px-4 mb-3">
                Data & Privacy
            </Text>
            <TouchableOpacity className="flex-row items-center px-4 py-4 bg-primaryBG border-b border-border">
                <View className="flex-1">
                    <Text className="text-primaryFont text-base font-InterRegular mb-1">
                        Clear chat history
                    </Text>
                    <Text className="text-secondaryFont text-xs font-InterRegular">
                        Delete all saved conversations
                    </Text>
                </View>
                <Entypo name="chevron-right" size={22} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center px-4 py-4 bg-primaryBG">
                <View className="flex-1">
                    <Text className="text-primaryFont text-base font-InterRegular mb-1">
                        Reset AI preferences
                    </Text>
                    <Text className="text-secondaryFont text-xs font-InterRegular">
                        Return to default AI behavior
                    </Text>
                </View>
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
                    AI Assistant
                </Text>
            </View>

            {/* Settings Content */}
            <FlatList
                data={['style', 'features', 'length', 'data']}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                    switch (item) {
                        case 'style':
                            return renderResponseStyleSection();
                        case 'features':
                            return renderFeaturesSection();
                        case 'length':
                            return renderResponseLengthSection();
                        case 'data':
                            return renderDataSection();
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

export default AISettingsScreen;
