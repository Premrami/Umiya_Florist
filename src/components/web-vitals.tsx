'use client';
import { useReportWebVitals } from 'next/web-vitals';
const report: Parameters<typeof useReportWebVitals>[0] = (metric) => {
  if (!['LCP', 'INP', 'CLS'].includes(metric.name) || navigator.doNotTrack === '1') return;
  const path = location.pathname;
  if (!['/', '/privacy'].includes(path)) return;
  const body = JSON.stringify({
    name: metric.name,
    value: Math.round(metric.value * 10000) / 10000,
    rating: metric.rating,
    path,
  });
  if (!navigator.sendBeacon?.('/api/vitals', body))
    void fetch('/api/vitals', { method: 'POST', body, keepalive: true }).catch(() => {});
};
export function WebVitals() {
  useReportWebVitals(report);
  return null;
}
