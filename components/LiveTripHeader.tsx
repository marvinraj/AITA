import { LinearGradient } from 'expo-linear-gradient';
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
      <View className="rounded-2xl py-6 mb-4 flex-row items-center justify-between shadow-lg shadow-white/15">
        <View className="flex-1 justify-between">
            {/* date */}
            <View className="flex-row items-center">
                {/* <Text className="text-sm">📅</Text> */}
                <Text className="text-sm font-UrbanistSemiBold tracking-wide text-buttonSecondary mb-1">{date}</Text>
            </View>
            {/* trip name */}
            <Text className="text-5xl font-UrbanistSemiBold mb-4 text-primaryFont">{tripName}</Text>
            {/* weather, location */}
            <View className="flex-row items-center mb-3">
                <View className="flex-row items-center mr-2 bg-secondaryBG rounded-lg px-2 py-1 border-[0.5px] border-border">
                    <Text className="text-xs">☀️</Text>
                    <Text className="text-sm ml-1 font-UrbanistRegular text-primaryFont">{weather}</Text>
                </View>
                <View className="flex-row items-center bg-secondaryBG rounded-lg px-2 py-1 border-[0.5px] border-border">
                    <Text className="text-xs">📍</Text>
                    <Text className="text-sm ml-1 font-UrbanistRegular text-primaryFont">{location}</Text>
                </View>
            </View>
            
        </View>
        {/* not sure yet -> maybe ai button? */}
        <View className="flex-row items-center">
            <LinearGradient
                colors={['#ff6b6b', '#e53030', '#cc1e1e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: 70,
                    height: 80,
                    borderRadius: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            />
        </View>
      </View>
    </View>
  );
}
