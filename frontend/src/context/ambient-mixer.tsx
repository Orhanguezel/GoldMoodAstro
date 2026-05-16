'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAmbientMixer, type MixerState } from '@/lib/audio/useAmbientMixer';
import type { RelaxStem } from '@goldmood/shared-config/relax-music';

interface AmbientMixerContextType extends MixerState {
  togglePlay: () => Promise<void>;
  setStemGains: (newGains: Partial<Record<RelaxStem, number>>) => void;
  setMasterGain: (val: number) => void;
  loadSignPreset: (sign: string) => void;
}

const AmbientMixerContext = createContext<AmbientMixerContextType | undefined>(undefined);

export function AmbientMixerProvider({ children }: { children: ReactNode }) {
  const mixer = useAmbientMixer();

  return (
    <AmbientMixerContext.Provider value={mixer}>
      {children}
    </AmbientMixerContext.Provider>
  );
}

export function useAmbientMixerContext() {
  const context = useContext(AmbientMixerContext);
  if (context === undefined) {
    throw new Error('useAmbientMixerContext must be used within an AmbientMixerProvider');
  }
  return context;
}
