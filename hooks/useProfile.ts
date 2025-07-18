import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileData {
  name: string;
  username: string;
  avatar: string | null;
  avatarGradientIndex: number;
}

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

// helper function to find gradient index from hex color
const getGradientIndexFromColor = (hexColor: string): number => {
  const index = avatarGradients.findIndex(gradient => gradient[0] === hexColor);
  return index >= 0 ? index : 0; // Default to first gradient if not found
};

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    username: '',
    avatar: null,
    avatarGradientIndex: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        setLoading(false);
        return;
      }

      // try to get profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      // set profile data with fallbacks
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
      // set fallback data if everything fails
      setProfileData({
        name: 'User',
        username: '@user',
        avatar: null,
        avatarGradientIndex: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  return {
    profileData,
    loading,
    avatarGradients,
    refetch: loadProfileData,
  };
};
