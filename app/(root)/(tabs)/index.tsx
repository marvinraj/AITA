import { ScrollView, Text, View, Image } from "react-native";
import { icons } from '@/constants/icons'

export default function HomeScreen() {
  return (
      <ScrollView 
        className="flex-1 px-5 bg-primaryBG"
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ minHeight: '100%', paddingBottom: 10 }}
      >
        <View className="flex-row items-center mb-5">
          <Image source={icons.logo} className="w-10 h-10"/>
          <Text className="text-primaryFont text-lg ml-2 font-bold">AITA.</Text>
        </View>
      </ScrollView>
  );
}
