import { Text, View } from 'react-native';

interface LiveTripHeaderProps {
  tripName: string;
  date: string;
  weather: string;
  location: string;
}

export default function LiveTripHeader({ tripName, date, weather, location }: LiveTripHeaderProps) {
  return (
    <View className="my-3">
      <View className="rounded-2xl px-6 py-6 mb-4 flex-row items-center justify-between bg-primaryBG shadow-lg shadow-white/15">
        <View className="flex-1 justify-between">
            {/* trip name */}
            <Text className="text-5xl font-BellezaRegular mb-4 text-primaryFont">{tripName}</Text>
            {/* weather, location */}
            <View className="flex-row items-center mb-3">
                <View className="flex-row items-center mr-4 bg-transparent rounded-lg px-2 py-1 border-[0.5px] border-border">
                    <Text className="text-sm">☀️</Text>
                    <Text className="text-xs ml-1 font-InterRegular text-secondaryFont">{weather}</Text>
                </View>
                <View className="flex-row items-center bg-transparent rounded-lg px-2 py-1 border-[0.5px] border-border">
                    <Text className="text-sm">📍</Text>
                    <Text className="text-xs ml-1 font-InterRegular text-secondaryFont">{location}</Text>
                </View>
            </View>
            {/* date */}
            <View className="flex-row items-center">
                <Text className="text-sm">📅</Text>
                <Text className="text-xs ml-2 font-InterRegular tracking-wide text-secondaryFont">{date}</Text>
            </View>
        </View>
        {/* not sure yet -> maybe ai button? */}
        <View className="ml-6 flex-row items-center">
            <View className="w-24 h-16 rounded-2xl bg-primaryBG shadow-lg shadow-accentFont/20" />
        </View>
      </View>
    </View>
  );
}
