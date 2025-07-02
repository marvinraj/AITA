import { Text, View } from 'react-native';
import { Trip } from '../types/database';

interface ItineraryTabProps {
  trip: Trip;
}

export default function ItineraryTab({ trip }: ItineraryTabProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-primaryFont text-lg">Itinerary for {trip.name}</Text>
    </View>
  );
}
