import React from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GooglePlace } from '../lib/services/googlePlacesService';

interface PlaceDetailModalProps {
  visible: boolean;
  place: GooglePlace | null;
  onClose: () => void;
  getPhotoUrl: (photoReference: string) => string;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ visible, place, onClose, getPhotoUrl }) => {
  if (!place) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="bg-secondaryBG rounded-xl p-6 w-80 max-h-[90%]">
          <ScrollView>
            {/* Images */}
            {place.photos && place.photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {place.photos.map((photo, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: getPhotoUrl(photo.photo_reference) }}
                    className="w-48 h-32 rounded-lg mr-2"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}
            {/* Name & Address */}
            <Text className="text-primaryFont font-UrbanistSemiBold text-lg mb-1">📍 {place.name}</Text>
            <Text className="text-secondaryFont text-sm mb-2">{place.formatted_address}</Text>
            {/* Rating & Type */}
            {place.rating && (
              <Text className="text-secondaryFont text-xs mb-2">⭐ {place.rating} • {place.types?.[0]?.replace(/_/g, ' ')}</Text>
            )}
            {/* Description (not available in GooglePlace) */}
          </ScrollView>
          <TouchableOpacity
            className="mt-4 py-2 px-4 bg-border rounded-lg"
            onPress={onClose}
          >
            <Text className="text-buttonPrimary text-center">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PlaceDetailModal;
