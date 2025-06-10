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
    <View className='my-3'>
      <LinearGradient
        colors={['#23223a', '#35345a', '#4b4a7a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          paddingHorizontal: 24,
          paddingVertical: 24,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1.5,
          borderColor: '#35345a',
          shadowColor: '#23223a',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}>
        <View>
            {/* trip name */}
            <Text className="text-2xl font-InterBold mb-4 text-primaryFont">{tripName}</Text>
            {/* weather, location */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, backgroundColor: '#35345a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text className="text-sm" style={{color: '#a5b4fc'}}>☀️</Text>
                    <Text className="text-xs ml-1 font-InterRegular" style={{color: '#e0e7ff'}}>{weather}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#35345a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text className="text-sm" style={{color: '#6ee7b7'}}>📍</Text>
                    <Text className="text-xs ml-1 font-InterRegular" style={{color: '#e0e7ff'}}>{location}</Text>
                </View>
            </View>
            {/* date */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text className="text-sm" style={{color: '#a5b4fc'}}>📅</Text>
                <Text className="text-xs ml-2 font-InterRegular tracking-wide" style={{color: '#e0e7ff'}}>{date}</Text>
            </View>
        </View>
        {/* not sure yet -> maybe ai button? */}
        <View style={{ marginLeft: 24, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 70, height: 80, borderRadius: 24, backgroundColor: '#35345a', shadowColor: '#23223a', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            </View>
        </View>
      </LinearGradient>
    </View>
  );
}
