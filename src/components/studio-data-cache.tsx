'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

type Snapshot = {
  rows: Record<string, any>[];
  count: number;
  overview: Record<string, any>;
};
export type StudioCache = Map<string, Snapshot>;
const StudioCacheContext = createContext<StudioCache | null>(null);

/** Private, in-memory snapshots disappear when the Studio workspace is left. */
export function StudioDataCache({ children }: { children: ReactNode }) {
  const [cache] = useState<StudioCache>(() => new Map());
  return <StudioCacheContext.Provider value={cache}>{children}</StudioCacheContext.Provider>;
}
export function useStudioDataCache() {
  return useContext(StudioCacheContext);
}
