import { Entypo } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FutureTripsTab from '../../../components/FutureTripsTab';
import SavedPlacesTab from '../../../components/SavedPlacesTab';
import { tripsService } from '../../../lib/services/tripsService';
import { supabase } from '../../../lib/supabase';


// tabs for the profile screen, allows switching between Travels and Saves
const TABS = ['Travels', 'Saves'];

const ProfileScreen = () => {
  // useRouter hook from expo-router to navigate between screens
  const router = useRouter();

  // useState hook to manage the active tab state
  const [activeTab, setActiveTab] = useState('Travels');

  // State for trips count (for display in profile header)
  const [tripsCount, setTripsCount] = useState(0);

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

  // State for profile data
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    avatar: null,
    avatarGradientIndex: 0,
  });

  // State for loading
  const [loading, setLoading] = useState(true);

  // Load profile data from Supabase
  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }

      // Try to get profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      // Set profile data with fallbacks
      const defaultUsername = user.user_metadata?.username || 
                            user.email?.split('@')[0] || 
                            'user';

      setProfileData({
        name: data?.full_name || user.user_metadata?.full_name || 'User',
        username: data?.username ? `@${data.username}` : `@${defaultUsername}`,
        avatar: data?.avatar_url || user.user_metadata?.avatar_url || null,
        avatarGradientIndex: data?.avatar_color ? getGradientIndexFromColor(data.avatar_color) : 0,
      });

    } catch (err) {
      console.error('Error loading profile data:', err);
      // Set fallback data if everything fails
      setProfileData({
        name: 'User',
        username: '@user',
        avatar: null,
        avatarGradientIndex: 0,
      });
    }
  };

  // Load trips count for profile header
  const loadTripsCount = async () => {
    try {
      const tripsData = await tripsService.getUserTrips();
      setTripsCount(tripsData.length);
    } catch (err) {
      console.error('Error loading trips count:', err);
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProfileData(), loadTripsCount()]);
    setLoading(false);
  };

  // Load data when component mounts and when it gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  // function to handle sign out
  // uses Supabase's auth.signOut method to log the user out
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }

  return (
    <View className="flex-1 bg-primaryBG">
      {/* header */}
      <View className="items-center pt-12 pb-6 bg-primaryBG">
        {/* avatar */}
        <LinearGradient
          colors={avatarGradients[profileData.avatarGradientIndex] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            marginBottom: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text className="text-white text-2xl font-BellezaRegular">
            {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </LinearGradient>
        {loading ? (
          <>
            <View className="w-32 h-8 bg-gray-300 rounded mb-2" />
            <View className="w-24 h-4 bg-gray-300 rounded" />
          </>
        ) : (
          <>
            <Text className="text-primaryFont text-3xl mb-1 font-BellezaRegular">{profileData.name}</Text>
            <Text className="text-secondaryFont text-sm font-InterRegular">{profileData.username}  •  {tripsCount} Travels</Text>
          </>
        )}
      </View>
      {/* travels & saves tabs */}
      <View className="flex-row items-end border-b border-border mb-2 ml-0 pl-4 mt-12">
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            className="mr-6 pb-1 relative"
            onPress={() => setActiveTab(tab)}
          >
            <Text className={activeTab === tab ? "text-accentFont font-InterBold text-base" : "text-secondaryFont font-InterRegular text-base"}>{tab}</Text>
            {activeTab === tab && (
              <View className="absolute left-0 right-0 -bottom-1 h-[2px] bg-accentFont rounded" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* tab content */}
      <View className="flex-1">
        {activeTab === 'Travels' ? (
          <FutureTripsTab />
        ) : (
          <SavedPlacesTab />
        )}
      </View>
      {/* 3-dots settings button */}
      <TouchableOpacity
        onPress={() => router.push('/settings')}
        className="absolute top-3 right-6 z-20"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Entypo name="dots-three-horizontal" size={21} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;