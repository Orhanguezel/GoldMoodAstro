'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RELAX_PRESETS, resolveRelaxSeedMix, type RelaxStem } from '@goldmood/shared-config/relax-music';

export interface MixerState {
  isPlaying: boolean;
  isLoading: boolean;
  masterGain: number;
  stemGains: Record<RelaxStem, number>;
  error: string | null;
}

export function useAmbientMixer() {
  const [state, setState] = useState<MixerState>({
    isPlaying: false,
    isLoading: false,
    masterGain: RELAX_PRESETS.defaults.master_gain,
    stemGains: RELAX_PRESETS.stems.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<RelaxStem, number>),
    error: null
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const stemNodesRef = useRef<Partial<Record<RelaxStem, { source: AudioBufferSourceNode; gain: GainNode }>>>({});
  const buffersRef = useRef<Partial<Record<RelaxStem, AudioBuffer>>>({});

  // Initialize AudioContext
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = state.masterGain;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    return ctx;
  }, [state.masterGain]);

  // Load a single stem
  const loadStem = useCallback(async (ctx: AudioContext, stem: RelaxStem): Promise<AudioBuffer> => {
    if (buffersRef.current[stem]) return buffersRef.current[stem]!;

    const response = await fetch(`/sounds/relax/${stem}.mp3`); // mp3 fallback used as primary here for simplicity, can add webm detection
    if (!response.ok) throw new Error(`Failed to load stem: ${stem}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    buffersRef.current[stem] = audioBuffer;
    return audioBuffer;
  }, []);

  // Play/Stop
  const togglePlay = useCallback(async () => {
    const ctx = initAudio();
    
    if (state.isPlaying) {
      // Stop all
      Object.values(stemNodesRef.current).forEach(node => {
        try { node?.source.stop(); } catch (e) {}
      });
      stemNodesRef.current = {};
      setState(prev => ({ ...prev, isPlaying: false }));
      if (ctx.state !== 'suspended') await ctx.suspend();
    } else {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        if (ctx.state === 'suspended') await ctx.resume();
        
        // Ensure all buffers are loaded
        await Promise.all(RELAX_PRESETS.stems.map(s => loadStem(ctx, s)));
        
        // Start all stems at their target gain (or 0)
        RELAX_PRESETS.stems.forEach(stem => {
          const buffer = buffersRef.current[stem];
          if (!buffer || !masterGainRef.current) return;

          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;

          const gainNode = ctx.createGain();
          gainNode.gain.value = state.stemGains[stem];
          
          source.connect(gainNode);
          gainNode.connect(masterGainRef.current);
          
          source.start(0);
          stemNodesRef.current[stem] = { source, gain: gainNode };
        });

        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      } catch (err: any) {
        console.error('Mixer error:', err);
        setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      }
    }
  }, [state.isPlaying, state.stemGains, initAudio, loadStem]);

  // Update stem gains with crossfade
  const setStemGains = useCallback((newGains: Partial<Record<RelaxStem, number>>) => {
    const ctx = audioCtxRef.current;
    if (!ctx) {
      setState(prev => ({ ...prev, stemGains: { ...prev.stemGains, ...newGains } }));
      return;
    }

    const fadeSeconds = RELAX_PRESETS.defaults.fade_ms / 1000;
    const now = ctx.currentTime;

    Object.entries(newGains).forEach(([s, val]) => {
      const stem = s as RelaxStem;
      const node = stemNodesRef.current[stem];
      if (node && typeof val === 'number') {
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.linearRampToValueAtTime(node.gain.gain.value, now);
        node.gain.gain.linearRampToValueAtTime(val, now + fadeSeconds);
      }
    });

    setState(prev => ({ ...prev, stemGains: { ...prev.stemGains, ...newGains } }));
  }, []);

  const setMasterGain = useCallback((val: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(val, audioCtxRef.current?.currentTime || 0, 0.1);
    }
    setState(prev => ({ ...prev, masterGain: val }));
  }, []);

  // Seed mix from sign
  const loadSignPreset = useCallback((sign: string) => {
    const seed = resolveRelaxSeedMix(sign);
    setStemGains(seed);
  }, [setStemGains]);

  return {
    ...state,
    togglePlay,
    setStemGains,
    setMasterGain,
    loadSignPreset
  };
}
