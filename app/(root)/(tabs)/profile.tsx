import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

const profileData = {
  name: 'Marvin Raj',
  username: '@marvwtf',
  travels: 12,
  avatar: null, // placeholder for avatar, can be replaced with an image URL or component
};

// simple profile screen component that displays user information, travels, and saves.
const travels = [
  { id: '1', title: 'Trip to Paris', date: 'May 23 - 29', saves: 10 },
  { id: '2', title: 'Melaka with the boys', date: 'May 23 - 29', saves: 10 },
  { id: '3', title: 'Trip to Paris', date: 'May 23 - 29', saves: 10 },
  { id: '4', title: 'Melaka with the boys', date: 'May 23 - 29', saves: 10 },
];

// saves is a copy of travels for now, can be replaced with actual save data
// later, data must be fetched from a database
const saves: typeof travels = [];

// tabs for the profile screen, allows switching between Travels and Saves
const TABS = ['Travels', 'Saves'];

const ProfileScreen = () => {
  // useRouter hook from expo-router to navigate between screens
  const router = useRouter();

  // useState hook to manage the active tab state
  const [activeTab, setActiveTab] = useState('Travels');

  // function to handle sign out
  // uses Supabase's auth.signOut method to log the user out
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }

  // function to render each card in the FlatList
  // displays the title, date, and saves for each travel or save item
  const renderCard = ({ item }: any) => (
    <View className="bg-transparent m-2 flex-1 max-w-[45%]">
      {/* Image Placeholder */}
      <View className="bg-secondaryFont rounded-2xl w-full aspect-square" />
      <Text className="text-primaryFont font-bold text-base font-InterRegular mt-2">{item.title}</Text>
      <Text className="text-secondaryFont text-xs mt-1 font-InterRegular">{item.date}  •  {item.saves} Saves</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-primaryBG">
      {/* header */}
      <View className="items-center pt-12 pb-6 bg-primaryBG">
        {/* avatar placeholder, for now -> will replace with actual image */}
        <View className="w-24 h-24 rounded-full bg-accentFont mb-4 justify-center items-center"></View>
        <Text className="text-primaryFont text-3xl mb-1 font-BellezaRegular">{profileData.name}</Text>
        <Text className="text-secondaryFont text-sm font-InterRegular">{profileData.username}  •  {profileData.travels} Travels</Text>
      </View>
      {/* travels & saves tabs */}
      <View className="flex-row items-end border-b border-[#222] mb-2 ml-0 pl-4 mt-12">
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            className="mr-6 pb-1 relative"
            onPress={() => setActiveTab(tab)}
          >
            <Text className={activeTab === tab ? "text-accentFont font-InterRegular text-base" : "text-secondaryFont font-InterRegular text-base"}>{tab}</Text>
            {activeTab === tab && (
              <View className="absolute left-0 right-0 -bottom-1 h-[2px] bg-accentFont rounded" />
            )}
          </TouchableOpacity>
        ))}
      </View>
      {/* grid of travels -> dummy data */}
      <FlatList
        data={activeTab === 'Travels' ? travels : saves}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        renderItem={renderCard}
        ListEmptyComponent={<Text className="text-secondaryFont text-center mt-8">No items yet.</Text>}
        showsVerticalScrollIndicator={false}
      />
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