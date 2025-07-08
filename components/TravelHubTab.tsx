import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import { Trip } from '../types/database';
import NotesDropdown from './NotesDropdown';
import TravelChecklistDropdown from './TravelChecklistDropdown';

interface TravelHubTabProps {
  trip: Trip;
}

export default function TravelHubTab({ trip }: TravelHubTabProps) {
  return (
    <View className="flex-1 w-full pt-4">
      {/* Main container box */}
      <View className="flex-1 rounded-md">

        {/* Essentials Section */}
        <View className=" rounded-2xl">
          {/* section title */}
          <Text className="text-primaryFont text-xl font-BellezaRegular mb-3">Essentials</Text>
          {/* icons grid as horizontally scrollable mini cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row items-center">
              <View className="mr-2">
                <View className="bg-[#001d3d]/80 rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/plane.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Flight</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#374259]/50 rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/lodging.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Lodging</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#400406] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/rental.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Rental</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#5e503f] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/food.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Food</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#621708] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/attach.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Attach</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#3c1518] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/cards.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Cards</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#1e1b18] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/health.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Health</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#4b3d33] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/passport.png')} style={{ width: 22, height: 20, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Passport</Text>
                </View>
              </View>
              <View className="mr-2">
                <View className="bg-[#1a1f16] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/sim.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">SIM</Text>
                </View>
              </View>
              <View>
                <View className="bg-[#1b263b] rounded-xl p-3 shadow-sm items-center justify-center" style={{ width: 66, height: 65 }}>
                  <Image source={require('../assets/icons/luggage.png')} style={{ width: 22, height: 22, marginBottom: 4 }} contentFit="contain" />
                  <Text className="text-xs text-primaryFont font-UrbanistSemiBold">Luggage</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* divider */}
        <View className="h-[1px] bg-divider/70 w-full mb-8 mt-8" />
      
        {/* Notes Section */}
        <View className="rounded-2xl">
          <NotesDropdown tripId={trip.id} />
        </View>

        {/* divider */}
        <View className="h-[1px] bg-divider/70 w-full mb-8 mt-5" />

        {/* Travel Checklist Section */}
        <View className="rounded-2xl">
          <TravelChecklistDropdown tripId={trip.id} />
        </View>
        {/* <MemoryDropdown /> */}

        {/* Placeholder for rest of Travel Hub content */}
        {/* <View className="flex-1 items-center justify-center">
          <Text className="text-primaryFont text-lg">Travel Hub Content</Text>
        </View> */}
      </View>
    </View>
  );
}
