import { ScrollView, Text, View, Image } from "react-native";
import { icons } from '@/constants/icons'

export default function Index() {
  return (
    <View className="flex-1 bg-primaryBG">
      <ScrollView 
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ minHeight: '100%', paddingBottom: 10 }}
      >
        <View className="flex-row items-center mt-20 mb-5">
          <Image source={icons.logo} className="w-10 h-10"/>
          <Text className="text-primaryFont text-lg ml-2 font-bold">AITA.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
