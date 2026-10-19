import { createHmac, timingSafeEqual } from 'node:crypto';
export function validSignature(raw: string, signature: string, secret: string) {
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  return timingSafeEqual(
    Buffer.from(signature, 'hex'),
    createHmac('sha256', secret).update(raw).digest(),
  );
}
export async function razorpay(path: string, body?: unknown) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw new Error('Razorpay is not configured');
  const response = await fetch('https://api.razorpay.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString(
          'base64',
        ),
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Payment provider request failed');
  return response.json();
}
