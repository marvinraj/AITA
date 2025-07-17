import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

const EditProfileScreen = () => {
    const router = useRouter();
    
    // State for profile data
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        username: '',
        fullName: '',
        website: '',
        avatarColor: 0 // Default to first gradient index
    });

    const [originalProfile, setOriginalProfile] = useState({
        username: '',
        fullName: '',
        website: '',
        avatarColor: 0
    });

    const avatarGradients = [
        ['#1a1a2e', '#8B5CF6'], // Dark blue to bright purple
        ['#2d1b69', '#F59E0B'], // Deep purple to bright yellow
        ['#0f3460', '#06B6D4'], // Navy to bright cyan
        ['#2c5530', '#10B981'], // Forest to bright green
        ['#4a1a2b', '#F97316'], // Deep maroon to bright orange
        ['#3a2f42', '#EC4899'], // Dark slate to bright pink
        ['#3d2914', '#84CC16'], // Dark brown to bright lime
        ['#2e3440', '#3B82F6'], // Dark gray to bright blue
        ['#16213e', '#EF4444'], // Midnight blue to bright red
        ['#11022e', '#A855F7'], // Deep purple-black to bright violet
        ['#16537e', '#14B8A6'], // Steel blue to bright teal
        ['#1a2f1d', '#F43F5E'], // Dark forest to bright rose
    ];

    // Helper function to find gradient index from hex color
    const getGradientIndexFromColor = (hexColor: string): number => {
        const index = avatarGradients.findIndex(gradient => gradient[0] === hexColor);
        return index >= 0 ? index : 0; // Default to first gradient if not found
    };

    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('No user found');
            }

            console.log('Current user:', user); // Debug log - show full user object
            console.log('User email:', user.email);
            console.log('User metadata:', user.user_metadata);

            // First, let's try to get the profile from the profiles table
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            console.log('Profile query result:', { data, error });

            // Always set some default values from the user object
            const defaultUsername = user.user_metadata?.username || 
                                  user.email?.split('@')[0] || 
                                  'user' + user.id.slice(-4); // Fallback with user ID

            if (error) {
                if (error.code === 'PGRST116') {
                    // No profile found - this is normal for new users
                    console.log('No profile found, using defaults');
                    const profileData = {
                        username: defaultUsername,
                        fullName: user.user_metadata?.full_name || '',
                        website: '',
                        avatarColor: user.user_metadata?.avatar_color ? 
                            getGradientIndexFromColor(user.user_metadata.avatar_color) : 0
                    };
                    setProfile(profileData);
                    setOriginalProfile(profileData);
                } else if (error.message.includes('relation "profiles" does not exist')) {
                    // Table doesn't exist
                    console.error('Profiles table does not exist!');
                    Alert.alert('Database Error', 'Profiles table not found. Using default values.');
                    const profileData = {
                        username: defaultUsername,
                        fullName: user.user_metadata?.full_name || '',
                        website: '',
                        avatarColor: 0
                    };
                    setProfile(profileData);
                    setOriginalProfile(profileData);
                } else {
                    throw error; // Other database errors
                }
            } else if (data) {
                // Profile found, use the data
                console.log('Profile found, loading data');
                const profileData = {
                    username: data.username || defaultUsername,
                    fullName: data.full_name || user.user_metadata?.full_name || '',
                    website: data.website || '',
                    avatarColor: data.avatar_color ? getGradientIndexFromColor(data.avatar_color) : 0
                };
                setProfile(profileData);
                setOriginalProfile(profileData);
            } else {
                // No data but no error (shouldn't happen with .single())
                console.log('No data returned, using defaults');
                const profileData = {
                    username: defaultUsername,
                    fullName: user.user_metadata?.full_name || '',
                    website: '',
                    avatarColor: 0
                };
                setProfile(profileData);
                setOriginalProfile(profileData);
            }

        } catch (error: any) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', `Failed to load profile: ${error.message || 'Unknown error'}`);
            
            // Even on error, try to set some basic info from auth user
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const profileData = {
                        username: user.email?.split('@')[0] || '',
                        fullName: user.user_metadata?.full_name || '',
                        website: '',
                        avatarColor: 0
                    };
                    setProfile(profileData);
                    setOriginalProfile(profileData);
                }
            } catch (authError) {
                console.error('Auth error:', authError);
            }
        } finally {
            setLoading(false);
        }
    };

    // Check if profile has changed
    const hasChanges = () => {
        return (
            profile.username !== originalProfile.username ||
            profile.fullName !== originalProfile.fullName ||
            profile.website !== originalProfile.website ||
            profile.avatarColor !== originalProfile.avatarColor
        );
    };

    const updateProfile = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) throw new Error('No user found');

            const gradientFirstColor = avatarGradients[profile.avatarColor][0];

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: profile.username,
                    full_name: profile.fullName,
                    website: profile.website,
                    avatar_color: gradientFirstColor, // Save as hex color to satisfy constraint
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            Alert.alert('Success', 'Profile updated successfully!');
            router.back();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const pickColor = () => {
        setShowColorPicker(true);
    };

    const selectColor = (gradientIndex: number) => {
        setProfile(prev => ({ ...prev, avatarColor: gradientIndex }));
        setShowColorPicker(false);
    };

    const renderProfileImage = () => (
        <View className="items-center mb-8">
            <TouchableOpacity onPress={pickColor} className="relative">
                <LinearGradient
                    colors={avatarGradients[profile.avatarColor] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text className="text-white text-2xl font-BellezaRegular drop-shadow-lg">
                        {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 
                         profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </LinearGradient>
                <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-primaryBG rounded-full items-center justify-center">
                    <MaterialIcons name="palette" size={16} color="white" />
                </View>
            </TouchableOpacity>
            <Text className="text-secondaryFont text-sm font-InterRegular mt-2">
                Tap to change color
            </Text>
        </View>
    );

    const renderColorPicker = () => {
        if (!showColorPicker) return null;
        
        return (
            <View className="absolute inset-0 bg-black/40 bg-opacity-50 justify-center items-center z-50">
                <View className="bg-secondaryBG rounded-2xl p-6 mx-8 w-80">
                    <Text className="text-primaryFont text-lg font-BellezaRegular text-center mb-6">
                        Choose Avatar Gradient
                    </Text>
                    
                    <View className="flex-row flex-wrap justify-center">
                        {avatarGradients.map((gradient, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => selectColor(index)}
                                className="m-2"
                            >
                                <LinearGradient
                                    colors={gradient as [string, string]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 24,
                                        borderWidth: 2,
                                        borderColor: profile.avatarColor === index ? '#fff' : '#E5E7EB'
                                    }}
                                >
                                    {profile.avatarColor === index && (
                                        <View className="flex-1 justify-center items-center">
                                            <MaterialIcons name="check" size={20} color="white" />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <TouchableOpacity
                        onPress={() => setShowColorPicker(false)}
                        className="mt-6 py-3 px-6 bg-gray-200 rounded-full self-center"
                    >
                        <Text className="text-gray-700 font-InterRegular">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderInputField = (
        label: string, 
        value: string, 
        onChangeText: (text: string) => void,
        placeholder: string,
        multiline?: boolean,
        maxLength?: number
    ) => (
        <View className="mb-6">
            <Text className="text-primaryFont text-sm font-InterRegular mb-2">
                {label}
            </Text>
            <TextInput
                className={`border border-border rounded-lg px-4 py-3 text-primaryFont font-InterRegular ${
                    multiline ? 'h-20' : 'h-12'
                }`}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                multiline={multiline}
                maxLength={maxLength}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
            {maxLength && (
                <Text className="text-secondaryFont text-xs font-InterRegular mt-1 text-right">
                    {value.length}/{maxLength}
                </Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 bg-primaryBG items-center justify-center">
                <Text className="text-primaryFont font-InterRegular">Loading profile...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-primaryBG">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-12 pb-6 border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                    <Entypo name="chevron-left" size={24} color="#828282" />
                    <Text className="text-secondaryFont font-InterRegular ml-1">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-primaryFont text-lg font-BellezaRegular">
                    Edit Profile
                </Text>
                {hasChanges() ? (
                    <TouchableOpacity 
                        onPress={updateProfile}
                        disabled={saving}
                        className={`px-4 py-2 rounded-full ${saving ? 'bg-gray-300' : 'bg-white text-black'}`}
                    >
                        <Text className={`font-InterRegular text-sm ${saving ? 'text-gray-500' : 'text-black'}`}>
                            {saving ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View className="w-16" />
                )}
            </View>

            {/* Content */}
            <ScrollView 
                className="flex-1 px-4"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 50 }}
                showsVerticalScrollIndicator={false}
            >
                {renderProfileImage()}

                {renderInputField(
                    'Username',
                    profile.username,
                    (text) => setProfile(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9._]/g, '') })),
                    'Enter your username',
                    false,
                    30
                )}

                {renderInputField(
                    'Full Name',
                    profile.fullName,
                    (text) => setProfile(prev => ({ ...prev, fullName: text })),
                    'Enter your full name',
                    false,
                    50
                )}

                {renderInputField(
                    'Website',
                    profile.website,
                    (text) => setProfile(prev => ({ ...prev, website: text })),
                    'https://yourwebsite.com'
                )}
            </ScrollView>

            {/* Color Picker Modal */}
            {renderColorPicker()}
        </View>
    );
};

export default EditProfileScreen;
