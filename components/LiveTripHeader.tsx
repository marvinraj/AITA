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
    <View className="my-1">
      <LinearGradient
        colors={['#d44444', '#b81818', '#901616', '#701212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          paddingVertical: 24,
          paddingHorizontal: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 justify-between">
              {/* date */}
              <View className="flex-row items-center">
                  {/* <Text className="text-sm">📅</Text> */}
                  <Text className="text-sm font-UrbanistSemiBold tracking-wide text-white/80 mb-1">{date}</Text>
              </View>
              {/* trip name */}
              <Text className="text-4xl font-UrbanistSemiBold mb-4 text-white">{tripName}</Text>
              {/* weather, location */}
              <View className="flex-row items-center">
                  <View className="flex-row items-center mr-2 bg-white/10 rounded-lg px-2 py-1 border-[0.5px] border-white/20">
                      <Text className="text-xs">☀️</Text>
                      <Text className="text-sm ml-1 font-UrbanistRegular text-white">{weather}</Text>
                  </View>
                  <View className="flex-row items-center bg-white/10 rounded-lg px-2 py-1 border-[0.5px] border-white/20">
                      <Text className="text-xs">📍</Text>
                      <Text className="text-sm ml-1 font-UrbanistRegular text-white">{location}</Text>
                  </View>
              </View>
          </View>
          {/* not sure yet -> maybe ai button? */}
          <View className="flex-row items-center">
              <LinearGradient
                colors={['#e55555', '#cc1e1e', '#a01a1a', '#801515']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: 70,
                    height: 80,
                    borderRadius: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 6,
                }}
              />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
