import { View } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeScreen = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View 
        style={{ 
          paddingTop: insets.top,
          flex: 1,
          backgroundColor: '#0d0d0d',
        }}
    >
        {children}
    </View>
  );
};

export default SafeScreen;
