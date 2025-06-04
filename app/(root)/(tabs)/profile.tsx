import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

const ProfileScreen = () => {
  const router = useRouter();

  // basic function to handle user sign out
  // uses Supabase's auth.signOut method to log the user out
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }

  return (
    <View>
      <Text>profile</Text>
      <TouchableOpacity
        onPress={handleSignOut}
        style={{ marginTop: 24, backgroundColor: '#5010FF', padding: 16, borderRadius: 999 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ProfileScreen