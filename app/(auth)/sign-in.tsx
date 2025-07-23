import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const SignIn = () => {
  // useRouter hook from expo-router to navigate between screens
  const router = useRouter();

  // useState hooks to manage local state for email, password, and loading status
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // function to handle user sign in
  // uses Supabase's auth.signInWithPassword method to authenticate the user
  async function handleSignIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // error handling
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Check if user has completed profile setup
    if (data.user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
        }

        // If no profile or no full_name, redirect to profile setup
        if (!profile || !profile.full_name) {
          router.replace('/(auth)/profile-setup');
        } else {
          router.replace('/(root)/(tabs)');
        }
      } catch (err) {
        console.error('Error checking profile setup:', err);
        router.replace('/(root)/(tabs)'); // Fallback to main app
      }
    }
    setLoading(false);
  }

  return (
    <ScrollView className="flex-1 bg-primaryBG px-6" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
      {/* logo & app name */}
      <View className="items-center mt-10 mb-8">
        <Image
          source={require('../../assets/images/logo6.png')}
          className="w-20 h-20 mb-2"
          resizeMode="contain"
          accessibilityLabel="AITA Logo"
        />
        <Text className="text-2xl font-BellezaRegular text-primaryFont text-center">Welcome Back!</Text>
      </View>
      {/* form inputs for email and password */}
      <View className="flex-1 items-center justify-center w-full">
        <View className="w-full mb-6" style={{maxWidth: 400}}>
          <Text className="text-primaryFont text-sm mb-2 font-InterRegular">Email</Text>
          <TextInput
            placeholder="Enter email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-inputBG focus:border-primaryFont rounded-full px-6 py-5 mb-5 text-primaryFont text-base font-InterRegular"
            value={email}
            onChangeText={setEmail}
          />
          <Text className="text-primaryFont text-sm mb-2 font-InterRegular">Password</Text>
          <TextInput
            placeholder="Enter password"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-inputBG focus:border-primaryFont rounded-full px-6 py-5 mb-2 text-primaryFont text-base font-InterRegular"
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {/* sign in button and link to sign up */}
        <TouchableOpacity
          className="bg-buttonPrimary w-full px-6 py-5 rounded-full shadow-lg active:opacity-80 mb-4 mt-4"
          style={{maxWidth: 400}}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text className="font-BellezaRegular text-lg text-center">
            {loading ? 'Logging In...' : 'Log In'}
          </Text>
        </TouchableOpacity>
        {/* link to sign up page */}
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity className="bg-transparent w-full px-6 py-4 rounded-full mb-2 flex-row justify-center items-center" style={{maxWidth: 400}}>
            <Text className="text-secondaryFont font-InterRegular text-base text-center">
              Don't have an account?{' '}
              <Text className="underline text-primaryFont font-BellezaRegular text-lg">Sign up</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  )
}

export default SignIn