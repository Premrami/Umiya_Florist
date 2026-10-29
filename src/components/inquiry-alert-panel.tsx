'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
type Job = {
  id: string;
  inquiry_id: string;
  channel: 'whatsapp' | 'sms';
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
};
type Config = {
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  whatsappReady: boolean;
  smsReady: boolean;
  recipientConfigured: boolean;
};
const labels: Record<string, string> = {
  pending: 'Waiting',
  processing: 'Sending',
  disabled: 'Off',
  not_configured: 'Setup needed',
  provider_accepted: 'Accepted by provider',
  failed: 'Failed',
  uncertain: 'Check provider logs',
};
export function InquiryAlertPanel() {
  const [data, setData] = useState<{ config: Config; jobs: Job[] } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/inquiry-alerts');
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setData(result.data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load admin alerts');
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/inquiry-alerts', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!controller.signal.aborted) {
          setData(result.data);
          setError('');
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : 'Could not load admin alerts');
      });
    return () => controller.abort();
  }, []);
  const ready = (channel: string) =>
    channel === 'whatsapp' ? data?.config.whatsappReady : data?.config.smsReady;
  return (
    <section className="panel inquiry-alert-panel" aria-label="Admin inquiry alerts">
      <div className="panel-heading">
        <h2>Admin inquiry alerts</h2>
        <button className="admin-btn secondary" onClick={() => void load()}>
          Refresh alerts
        </button>
      </div>
      <p>
        Receive new inquiry details on your admin phone.{' '}
        <Link href="/admin/settings">Set the number and alert channels in Settings ↗</Link>
      </p>
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="toolbar">
            {(['whatsapp', 'sms'] as const).map((channel) => (
              <span className={'badge ' + (ready(channel) ? 'active' : 'draft')} key={channel}>
                {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}:{' '}
                {ready(channel) ? 'Configured · delivery not verified' : 'Setup needed / off'}
              </span>
            ))}
          </div>
          {!data.config.whatsappReady && !data.config.smsReady && (
            <p className="admin-info">
              No phone alerts are active yet. Configure Twilio and your admin phone, then enable
              each channel. Inquiries still save normally.
            </p>
          )}
          {!!data.jobs.length && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Inquiry reference</th>
                    <th>Channel</th>
                    <th>Alert status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.jobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.inquiry_id.slice(0, 8)}</td>
                      <td>{job.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</td>
                      <td>
                        <span
                          className={
                            'badge ' + (job.status === 'provider_accepted' ? 'active' : 'draft')
                          }
                        >
                          {labels[job.status] ?? job.status}
                        </span>
                        {job.last_error && (
                          <small className="alert-job-note">{job.last_error}</small>
                        )}
                      </td>
                      <td>
                        {['failed', 'not_configured', 'disabled'].includes(job.status) &&
                          job.attempts < 5 && (
                            <button
                              className="admin-btn secondary"
                              disabled={busy !== null || !ready(job.channel)}
                              onClick={async () => {
                                setBusy(job.id);
                                setError('');
                                try {
                                  const r = await fetch('/api/admin/inquiry-alerts', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: job.id }),
                                  });
                                  const result = await r.json();
                                  if (!r.ok) throw new Error(result.error);
                                  await load();
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : 'Retry failed');
                                } finally {
                                  setBusy(null);
                                }
                              }}
                            >
                              {busy === job.id ? 'Retrying…' : 'Retry alert'}
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="alert-job-note">
            Provider acceptance does not confirm delivery. Long messages are shortened; complete
            details remain in Inquiries. Uncertain attempts require checking Twilio logs before
            resending.
          </p>
        </>
      )}
    </section>
  );
}
