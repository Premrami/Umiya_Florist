import { StudioDataCache } from '@/components/studio-data-cache';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioDataCache>{children}</StudioDataCache>;
}
