import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
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
        avatarUrl: ''
    });

    const [originalProfile, setOriginalProfile] = useState({
        username: '',
        fullName: '',
        website: '',
        avatarUrl: ''
    });

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
                        avatarUrl: user.user_metadata?.avatar_url || ''
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
                        avatarUrl: ''
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
                    avatarUrl: data.avatar_url || user.user_metadata?.avatar_url || ''
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
                    avatarUrl: ''
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
                        avatarUrl: ''
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
            profile.avatarUrl !== originalProfile.avatarUrl
        );
    };

    const updateProfile = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) throw new Error('No user found');

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: profile.username,
                    full_name: profile.fullName,
                    website: profile.website,
                    avatar_url: profile.avatarUrl,
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

    const pickImage = async () => {
        try {
            Alert.alert(
                'Change Profile Photo',
                'Photo upload feature coming soon!',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Use Default', 
                        onPress: () => setProfile(prev => ({ ...prev, avatarUrl: '' }))
                    }
                ]
            );
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const renderProfileImage = () => (
        <View className="items-center mb-8">
            <TouchableOpacity onPress={pickImage} className="relative">
                <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? (
                        <Image 
                            source={{ uri: profile.avatarUrl }} 
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <MaterialIcons name="person" size={40} color="#9CA3AF" />
                    )}
                </View>
                <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                    <MaterialIcons name="camera-alt" size={16} color="white" />
                </View>
            </TouchableOpacity>
            <Text className="text-secondaryFont text-sm font-InterRegular mt-2">
                Tap to change photo
            </Text>
        </View>
    );

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
        </View>
    );
};

export default EditProfileScreen;
