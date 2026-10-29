'use client';
import { useEffect, useState } from 'react';
import type { ReadinessCheck } from '@/lib/readiness';
export function LaunchReadiness() {
  const [checks, setChecks] = useState<ReadinessCheck[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/readiness', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not check launch settings.');
        if (!controller.signal.aborted) setChecks(result.data?.checks ?? []);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Could not check launch settings.');
      });
    return () => controller.abort();
  }, []);
  return (
    <section className="panel launch-readiness" aria-label="Launch readiness">
      <h2>Before your website goes live</h2>
      <p>
        These checks identify missing settings. Provider delivery, privacy approval, backups and
        real-device testing still need your review.
      </p>
      {error && <p role="alert">{error}</p>}
      {!checks && !error && <p role="status">Checking launch settings…</p>}
      <ul>
        {checks?.map((check) => (
          <li key={check.id}>
            <strong>
              {check.ready ? 'Ready' : 'Action needed'} · {check.label}
            </strong>
            {!check.ready && <p>{check.nextAction}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
