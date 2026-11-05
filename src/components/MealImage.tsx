import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Size = 'small' | 'medium' | 'large';

/**
 * TheMealDB serves resized images at /small, /medium, /large (falls back to the original if that fails).
 * Meals without a photo (your own recipes) show their first letter instead.
 */
export default function MealImage({
  uri,
  name,
  size = 'medium',
  style,
}: {
  uri: string;
  name?: string;
  size?: Size;
  style?: StyleProp<ImageStyle>;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  if (!uri) {
    return (
      <View
        style={[
          { backgroundColor: colors.pandanSoft, alignItems: 'center', justifyContent: 'center' },
          style as unknown as StyleProp<ViewStyle>,
        ]}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.pandan }}>
          {(name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  const src = failed ? uri : `${uri}/${size}`;
  return (
    <Image
      source={{ uri: src }}
      onError={() => setFailed(true)}
      resizeMode="cover"
      style={[{ backgroundColor: colors.pandanSoft }, style]}
    />
  );
}
