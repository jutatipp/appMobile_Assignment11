import { useEffect, useState } from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export function PlaceImage({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return (
    <View
      style={[
        {
          backgroundColor: '#DCE8D7',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {!uri || failed ? (
        <Ionicons name="image-outline" size={44} color={colors.primary} />
      ) : (
        <Image
          source={{ uri }}
          accessibilityLabel="ภาพประกอบบรรยากาศการท่องเที่ยว"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      )}
    </View>
  );
}
