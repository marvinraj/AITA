import React from 'react';
import { Alert, Clipboard, Share, Text, TouchableOpacity, View } from 'react-native';

interface MessageActionsProps {
  message: string;
  onRegenerate?: () => void;
  onQuote?: () => void;
  isAssistantMessage?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onRegenerate,
  onQuote,
  isAssistantMessage = false
}) => {
  
  const handleCopy = async () => {
    try {
      Clipboard.setString(message);
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `AITA Travel Recommendation:\n\n${message}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View className="flex-row space-x-2 mt-2">
      <TouchableOpacity
        onPress={handleCopy}
        className="bg-inputBG rounded-lg px-3 py-1"
      >
        <Text className="text-xs text-secondaryFont">📋 Copy</Text>
      </TouchableOpacity>

      {isAssistantMessage && (
        <>
          <TouchableOpacity
            onPress={handleShare}
            className="bg-inputBG rounded-lg px-3 py-1"
          >
            <Text className="text-xs text-secondaryFont">📤 Share</Text>
          </TouchableOpacity>

          {onRegenerate && (
            <TouchableOpacity
              onPress={onRegenerate}
              className="bg-inputBG rounded-lg px-3 py-1"
            >
              <Text className="text-xs text-secondaryFont">🔄 Regenerate</Text>
            </TouchableOpacity>
          )}

          {onQuote && (
            <TouchableOpacity
              onPress={onQuote}
              className="bg-inputBG rounded-lg px-3 py-1"
            >
              <Text className="text-xs text-secondaryFont">💬 Quote</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};
