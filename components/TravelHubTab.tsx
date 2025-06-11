import { Text, View } from 'react-native';

export default function TravelHubTab() {
  return (
    <View className="flex-1 w-full pt-4">
      {/* Essentials Section */}
      <View className="mb-8">
        {/* section title */}
        <Text className="text-primaryFont text-lg font-bold mb-3">Essentials</Text>
        {/* icons grid */}
        <View className="bg-[#23223a] rounded-2xl px-2 py-4 shadow-sm">
          {/* first row */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">✈️</Text>
              <Text className="text-xs text-primaryFont">Flight</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">🏨</Text>
              <Text className="text-xs text-primaryFont">Lodging</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">🚗</Text>
              <Text className="text-xs text-primaryFont">Rental</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">🍽️</Text>
              <Text className="text-xs text-primaryFont">Food</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">📎</Text>
              <Text className="text-xs text-primaryFont">Attach</Text>
            </View>
          </View>
          {/* second row */}
          <View className="flex-row justify-between items-center">
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">💳</Text>
              <Text className="text-xs text-primaryFont">Cards</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">🩺</Text>
              <Text className="text-xs text-primaryFont">Health</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">🛂</Text>
              <Text className="text-xs text-primaryFont">Passport</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">📱</Text>
              <Text className="text-xs text-primaryFont">SIM</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl mb-1">🧳</Text>
              <Text className="text-xs text-primaryFont">Luggage</Text>
            </View>
          </View>
        </View>
      </View>
      {/* Placeholder for rest of Travel Hub content */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-primaryFont text-lg">Travel Hub Content</Text>
      </View>
    </View>
  );
}
