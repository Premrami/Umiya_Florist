'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export function Recovery() {
  const router = useRouter();
  const [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <main className="login-page">
      <div className="login-card">
        <span className="eyebrow">UMIYA STUDIO · SECURE ACCESS</span>
        <h1>A fresh start.</h1>
        <p>Set a strong password after opening your invitation or recovery email.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const f = new FormData(e.currentTarget);
            if (f.get('password') !== f.get('confirmation')) {
              setStatus('The passwords do not match.');
              setBusy(false);
              return;
            }
            try {
              const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', password: f.get('password') }),
              });
              const r = await res.json();
              if (!res.ok) throw new Error(r.error);
              router.replace('/admin/dashboard');
              router.refresh();
            } catch (e) {
              setStatus(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            New password
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <input
              name="confirmation"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <button className="button" disabled={busy}>
            Save password
          </button>
          <p role="status">{status}</p>
        </form>
        <Link href="/login">Back to sign in</Link>
      </div>
    </main>
  );
}
