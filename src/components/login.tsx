'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Flower2, ArrowUpRight } from 'lucide-react';
export function Login({ configured }: { configured: boolean }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f)),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <Link href="/" className="wordmark">
        <Flower2 size={35} />
        <span>
          UMIYA<small>F L O R I S T</small>
        </span>
      </Link>
      <div className="login-card">
        <span className="eyebrow">THE STUDIO, BEHIND THE BLOOMS</span>
        <h1>Welcome back.</h1>
        <p>Your flowers. Your business. Everything in one place.</p>
        {!configured && (
          <div className="setup-notice">
            Owner access needs Supabase setup. Add your project credentials and apply the
            migrations. This screen has no preview login or authentication bypass.
          </div>
        )}
        <form ref={form} onSubmit={submit}>
          <label>
            Email
            <input type="email" name="email" required autoComplete="username" />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="current-password"
            />
          </label>
          <button className="button" disabled={!configured || busy}>
            {busy ? 'Signing in…' : 'Enter your studio'}
            <ArrowUpRight size={18} />
          </button>
          <button
            type="button"
            className="text-link"
            disabled={!configured || busy}
            onClick={async () => {
              const email = new FormData(form.current!).get('email');
              if (!email) {
                setError('Enter your email address first.');
                return;
              }
              setBusy(true);
              try {
                const res = await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'reset', email }),
                });
                const r = await res.json();
                setError(r.error ?? r.message);
              } catch {
                setError('Recovery is unavailable. Please try again.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Forgot your password?
          </button>
          <p role="status">{error}</p>
        </form>
        <Link className="text-link" href="/">
          Return to the flower studio
        </Link>
      </div>
      <small>Invitation-only access · Securely managed by Supabase</small>
    </main>
  );
}
