import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
// ...existing code...
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
        <View className="rounded-2xl">
          {/* section title */}
          <Text className="text-primaryFont text-xl font-BellezaRegular mb-3">Essentials</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
            className="mb-2"
          >
            {[
              { id: 'flight', name: 'Flight', icon: 'airplane', color: colors.secondaryBG },
              { id: 'lodging', name: 'Lodging', icon: 'bed', color: colors.secondaryBG },
              { id: 'rental', name: 'Rental', icon: 'car', color: colors.secondaryBG },
              { id: 'food', name: 'Food', icon: 'fast-food', color: colors.secondaryBG },
              { id: 'attach', name: 'Attach', icon: 'attach', color: colors.secondaryBG },
              { id: 'cards', name: 'Cards', icon: 'card', color: colors.secondaryBG },
              { id: 'health', name: 'Health', icon: 'medkit', color: colors.secondaryBG },
              { id: 'passport', name: 'Passport', icon: 'document', color: colors.secondaryBG },
              { id: 'sim', name: 'SIM', icon: 'phone-portrait', color: colors.secondaryBG },
              { id: 'luggage', name: 'Luggage', icon: 'briefcase', color: colors.secondaryBG },
            ].map((item) => (
              <View key={item.id} className="items-center mr-2 rounded-3xl px-3 py-1 min-w-[60px]">
                <View className="w-14 h-14 rounded-full bg-[#ECDFCC]/60 items-center justify-center mb-2">
                  <Ionicons 
                    name={item.icon as keyof typeof Ionicons.glyphMap} 
                    size={18} 
                    color={item.color} 
                  />
                </View>
                <Text className="text-primaryFont/50 text-xs text-center font-medium">
                  {item.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* divider */}
        <View className="h-[1px] bg-divider/70 w-full mb-8 mt-4" />
      
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
