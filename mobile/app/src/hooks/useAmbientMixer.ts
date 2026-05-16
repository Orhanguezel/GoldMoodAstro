import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { getMasterGain, resolveSeedMix } from '@/lib/relax/resolveMix';
import { loadPersistedMix, savePersistedMix } from '@/lib/relax/storage';
import { getStemAsset, hasRelaxStemAssets } from '@/lib/relax/stemAssets';
import { RELAX_STEM_IDS } from '@/lib/relax/resolveMix';
import type { MixGains, StemId, ZodiacSignKey } from '@/lib/relax/types';

export function useAmbientMixer(sign: ZodiacSignKey) {
  const [gains, setGains] = useState<MixGains>(() => resolveSeedMix(sign));
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const soundsRef = useRef<Map<StemId, Audio.Sound>>(new Map());
  const stemsAvailable = hasRelaxStemAssets();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadPersistedMix(sign);
      if (cancelled) return;
      setGains(saved ?? resolveSeedMix(sign));
    })();
    return () => {
      cancelled = true;
    };
  }, [sign]);

  const unloadAll = useCallback(async () => {
    for (const sound of soundsRef.current.values()) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        /* ignore */
      }
    }
    soundsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      unloadAll();
    };
  }, [unloadAll]);

  const applyVolumes = useCallback(async () => {
    const master = getMasterGain();
    for (const stem of RELAX_STEM_IDS) {
      const sound = soundsRef.current.get(stem);
      if (!sound) continue;
      const gain = (gains[stem] ?? 0) * master;
      try {
        await sound.setVolumeAsync(gain);
      } catch {
        /* ignore */
      }
    }
  }, [gains]);

  useEffect(() => {
    if (playing) {
      applyVolumes();
    }
  }, [gains, playing, applyVolumes]);

  const setStemGain = useCallback(
    (stem: StemId, value: number) => {
      const next = { ...gains, [stem]: Math.min(1, Math.max(0, value)) };
      setGains(next);
      savePersistedMix(sign, next).catch(() => {});
    },
    [gains, sign],
  );

  const resetToSeed = useCallback(() => {
    const seed = resolveSeedMix(sign);
    setGains(seed);
    savePersistedMix(sign, seed).catch(() => {});
  }, [sign]);

  const start = useCallback(async () => {
    if (!stemsAvailable) return;
    setBusy(true);
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      await unloadAll();

      const master = getMasterGain();
      for (const stem of RELAX_STEM_IDS) {
        const asset = getStemAsset(stem);
        const gain = (gains[stem] ?? 0) * master;
        if (!asset || gain < 0.02) continue;
        const { sound } = await Audio.Sound.createAsync(asset, {
          isLooping: true,
          volume: gain,
          shouldPlay: true,
        });
        soundsRef.current.set(stem, sound);
      }

      if (soundsRef.current.size === 0) {
        setPlaying(false);
        return;
      }
      setPlaying(true);
    } catch (e) {
      console.error('AmbientMixer start:', e);
      await unloadAll();
      setPlaying(false);
    } finally {
      setBusy(false);
    }
  }, [gains, stemsAvailable, unloadAll]);

  const stop = useCallback(async () => {
    setBusy(true);
    try {
      await unloadAll();
    } finally {
      setPlaying(false);
      setBusy(false);
    }
  }, [unloadAll]);

  const toggle = useCallback(async () => {
    if (playing) await stop();
    else await start();
  }, [playing, start, stop]);

  return {
    gains,
    setStemGain,
    resetToSeed,
    playing,
    busy,
    toggle,
    start,
    stop,
    stemsAvailable,
    stemIds: RELAX_STEM_IDS,
  };
}
