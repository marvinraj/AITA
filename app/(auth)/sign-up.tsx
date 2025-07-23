import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const SignUp = () => {
  // useRouter hook from expo-router to navigate between screens
  const router = useRouter();

  // useState hooks to manage local state for email, password, and loading status
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // function to handle user sign up
  // uses Supabase's auth.signUp method to create a new user
  async function handleSignUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    // error handling
    if (error) {
      alert(error.message);
    } else if (!data.session) {
      alert('Please check your inbox for email verification!');
      router.replace('/(auth)/sign-in');
    } else {
      // New user successfully signed up - redirect to profile setup screen
      router.replace('/(auth)/profile-setup');
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
          accessibilityLabel="TRAVA Logo"
        />
        <Text className="text-2xl text-primaryFont text-center font-BellezaRegular">Welcome to TRAVA.</Text>
      </View>
      
      <View className="flex-1 items-center justify-center w-full">
        {/* form inputs for name, email, and password */}
        <View className="w-full mb-6" style={{maxWidth: 400}}>
          <Text className="text-primaryFont text-sm mb-2 font-InterRegular">Name</Text>
          <TextInput
            placeholder="Enter name"
            placeholderTextColor="#666"
            className="bg-inputBG focus:border-primaryFont rounded-full px-6 py-5 mb-5 text-primaryFont text-base font-InterRegular"
            value={name}
            onChangeText={setName}
          />
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
        {/* sign up button and navigation to sign in */}
        <TouchableOpacity
          className="bg-buttonPrimary w-full px-6 py-5 rounded-full shadow-lg active:opacity-80 mb-4 mt-4"
          style={{maxWidth: 400}}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text className="font-BellezaRegular text-base text-center">
            {loading ? 'Signing Up...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
        {/* link to sign in page */}
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity className="bg-transparent w-full px-6 py-4 rounded-full mb-2 flex-row justify-center items-center" style={{maxWidth: 400}}>
            <Text className="text-secondaryFont font-InterRegular text-base text-center">
              Already have an account?{' '}
              <Text className="underline text-primaryFont font-BellezaRegular text-lg">Log in</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  )
}

export default SignUp