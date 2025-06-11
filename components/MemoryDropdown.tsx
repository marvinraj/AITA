import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function MemoryDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <View className="mb-3 w-full">
      <TouchableOpacity onPress={() => setOpen(!open)} className="flex-row justify-between items-center px-4 py-3 rounded-2xl border border-[#35345a]">
        <Text className="text-primaryFont text-base font-InterBold">Memory</Text>
        <Text className="text-primaryFont text-xl">{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View className="px-4 py-3 rounded-b-2xl">
          {/* Memory content goes here */}
        </View>
      )}
    </View>
  );
}
