/** Compare browser Origin with the configured canonical origin; development uses Host. Never trust forwarded headers from arbitrary clients. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const expected = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
      : process.env.NODE_ENV !== 'production'
        ? new URL(request.url).protocol + '//' + request.headers.get('host')
        : new URL(request.url).origin;
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}
