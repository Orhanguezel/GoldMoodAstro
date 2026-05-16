import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/** Expo Go: no native bridge. For dev client with LiveKit, remove the metro alias. */
type VideoViewProps = {
  style?: StyleProp<ViewStyle>;
  videoTrack?: unknown;
  mirror?: boolean;
  objectFit?: 'cover' | 'contain';
};

export function VideoView({ style }: VideoViewProps) {
  return <View style={[{ backgroundColor: '#1a1a2e' }, style]} />;
}

export function registerGlobals() {}
