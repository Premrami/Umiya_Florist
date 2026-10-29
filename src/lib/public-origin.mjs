/** @param {string | undefined} [raw] @returns {string | undefined} */
/** Canonicals must never advertise localhost, a private network, or a guessed domain. */
export function publicSiteOrigin(raw = process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const url = new URL(raw ?? '');
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      host === 'localhost' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
    )
      return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}
