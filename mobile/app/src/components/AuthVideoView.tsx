import React, { useMemo } from 'react';
import { VideoView, useVideoPlayer } from 'expo-video';

type AuthVideoSource = {
  uri: string;
  headers?: Record<string, string>;
};

export function AuthVideoView({
  source,
  style,
  nativeControls = true,
  contentFit = 'contain',
}: {
  source: AuthVideoSource;
  style?: unknown;
  nativeControls?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
}) {
  const videoSource = useMemo(
    () => ({
      uri: source.uri,
      headers: source.headers,
    }),
    [source.headers, source.uri],
  );
  const player = useVideoPlayer(videoSource);

  return (
    <VideoView
      player={player}
      style={style as React.ComponentProps<typeof VideoView>['style']}
      nativeControls={nativeControls}
      contentFit={contentFit}
    />
  );
}
