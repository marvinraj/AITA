import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import MemoryDropdown from './MemoryDropdown';
import NotesDropdown from './NotesDropdown';
import TravelChecklistDropdown from './TravelChecklistDropdown';

export default function TravelHubTab() {
  return (
    <View className="flex-1 w-full pt-4">
      {/* Essentials Section */}
      <View className="mb-6">
        {/* section title */}
        <Text className="text-primaryFont text-3xl font-BellezaRegular mb-3">Essentials</Text>
        {/* icons grid as horizontally scrollable mini cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row items-center">
            <View className="mr-3">
              <View className="bg-[#001d3d] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/plane.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Flight</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#374259] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/lodging.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Lodging</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#400406] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/rental.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Rental</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#5e503f] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/food.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Food</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#621708] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/attach.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Attach</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#3c1518] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/cards.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Cards</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#1e1b18] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/health.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Health</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#4b3d33] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/passport.png')} style={{ width: 36, height: 32, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Passport</Text>
              </View>
            </View>
            <View className="mr-3">
              <View className="bg-[#1a1f16] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/sim.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">SIM</Text>
              </View>
            </View>
            <View>
              <View className="bg-[#1b263b] rounded-2xl p-5 shadow-sm items-center">
                <Image source={require('../assets/icons/luggage.png')} style={{ width: 36, height: 36, marginBottom: 8 }} contentFit="contain" />
                <Text className="text-sm text-primaryFont">Luggage</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
      {/* divider */}
      <View className="h-[1px] bg-[#222] w-full mb-6" />

      {/* Dropdown Sections */}
      <NotesDropdown />
      <TravelChecklistDropdown />
      <MemoryDropdown />

      {/* Placeholder for rest of Travel Hub content */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-primaryFont text-lg">Travel Hub Content</Text>
      </View>
    </View>
  );
}
