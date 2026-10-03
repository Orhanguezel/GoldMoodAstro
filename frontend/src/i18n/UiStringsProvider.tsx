'use client';

import React, { createContext, useContext } from 'react';
import type { UiStringsSnapshot } from './uiStringsResolve';

const UiStringsContext = createContext<UiStringsSnapshot | null>(null);

/** Layout'un SSR'da çektiği ui_* snapshot'ını istemci ağacına taşır. */
export function UiStringsProvider({
  snapshot,
  children,
}: {
  snapshot: UiStringsSnapshot | null;
  children: React.ReactNode;
}) {
  return <UiStringsContext.Provider value={snapshot}>{children}</UiStringsContext.Provider>;
}

export function useUiStringsSnapshot(): UiStringsSnapshot | null {
  return useContext(UiStringsContext);
}
