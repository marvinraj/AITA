import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

// settings options data
// each option has a title, subtitle, route, and an optional status dot
const settingsOptions = [
  {
    title: 'Edit profile',
    subtitle: 'Photo, username, bio and more',
    route: '/(root)/edit-profile',
  },
  {
    title: 'Account',
    subtitle: 'Email, birthday, country',
    route: '/(root)/account',
    statusDot: true,
  },
  {
    title: 'Content filtering',
    subtitle: 'Control what you see on Cosmos',
    route: '/(root)/content-filtering',
  },
  {
    title: 'Push notifications',
    subtitle: 'Update push notifications',
    route: '/(root)/push-notifications',
  },
  {
    title: 'Password',
    subtitle: 'Update your password',
    route: '/(root)/password',
  },
  {
    title: 'Subscription',
    subtitle: 'Make changes to your subscription',
    route: '/(root)/subscription',
  },
  {
    title: 'Sharing extension',
    subtitle: 'Tutorial to enable quick-saving',
    route: '/(root)/sharing-extension',
  },
];

const SettingsScreen = () => {
    // useRouter hook from expo-router to navigate between screens
    const router = useRouter();

    return (
        <View className="flex-1 bg-primaryBG">
        {/* header */}
        <View className="flex-row items-center px-4 pt-12 pb-12">
            <TouchableOpacity onPress={() => router.back()} className="pr-4">
            <Entypo name="chevron-left" size={24} color="#828282" />
            </TouchableOpacity>
            <Text className="text-primaryFont text-2xl font-BellezaRegular flex-1 text-center -ml-8">Settings</Text>
        </View>
        {/* settings list */}
        <FlatList
            data={settingsOptions}
            keyExtractor={item => item.title}
            renderItem={({ item }) => (
            <TouchableOpacity
                className="flex-row items-center px-4 py-4 border-b border-border"
                onPress={() => {}} // sdd navigation later
            >
                <View className="flex-1">
                <Text className="text-primaryFont text-base font-InterRegular mb-1">{item.title}</Text>
                <Text className="text-secondaryFont text-xs font-InterRegular">{item.subtitle}</Text>
                </View>
                {item.statusDot && <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />}
                <Entypo name="chevron-right" size={22} color="#888" />
            </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        />
        {/* sign out button at bottom */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 bg-primaryBG">
            <TouchableOpacity
            onPress={async () => {
                await supabase.auth.signOut();
                router.replace('/(auth)/sign-in');
            }}
            className="bg-accentFont py-4 rounded-full items-center"
            >
            <Text className="text-primaryFont font-BellezaRegular text-lg">Sign Out</Text>
            </TouchableOpacity>
        </View>
        </View>
    );
};

export default SettingsScreen;
