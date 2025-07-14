import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

interface Trip {
  id: string;
  name: string;
  destination?: string;
}

interface TripSelectModalProps {
  visible: boolean;
  trips: Trip[];
  onSelect: (trip: Trip) => void;
  onCancel: () => void;
}

const TripSelectModal: React.FC<TripSelectModalProps> = ({ visible, trips, onSelect, onCancel }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="bg-white rounded-xl p-6 w-80 max-h-96">
          <Text className="text-primaryFont text-lg font-semibold mb-4 text-center">Select a Trip</Text>
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-3 px-4 mb-2 bg-inputBG rounded-lg"
                onPress={() => onSelect(item)}
              >
                <Text className="text-primaryFont text-base">{item.name}</Text>
                {item.destination && (
                  <Text className="text-secondaryFont text-xs">{item.destination}</Text>
                )}
              </TouchableOpacity>
            )}
            style={{ maxHeight: 220 }}
          />
          <TouchableOpacity
            className="mt-4 py-2 px-4 bg-border rounded-lg"
            onPress={onCancel}
          >
            <Text className="text-secondaryFont text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TripSelectModal;
