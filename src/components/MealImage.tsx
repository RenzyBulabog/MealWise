import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { colors } from '../theme';

type Size = 'small' | 'medium' | 'large';

/** TheMealDB serves resized images at /small, /medium, /large. Falls back to the original if that fails. */
export default function MealImage({
  uri,
  size = 'medium',
  style,
}: {
  uri: string;
  size?: Size;
  style?: StyleProp<ImageStyle>;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  const src = !uri ? undefined : failed ? uri : `${uri}/${size}`;
  return (
    <Image
      source={src ? { uri: src } : undefined}
      onError={() => setFailed(true)}
      resizeMode="cover"
      style={[{ backgroundColor: colors.pandanSoft }, style]}
    />
  );
}
