import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  dispatch: vi.fn(),
  callbacks: [] as Array<() => Promise<void>>,
}));
vi.mock('../src/lib/supabase/server', () => ({ service: () => ({ rpc: mocks.rpc }) }));
vi.mock('../src/lib/inquiry-alerts', () => ({ dispatchInquiryAlerts: mocks.dispatch }));
vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => {
    mocks.callbacks.push(callback);
  },
}));
import { POST } from '../src/app/api/public/inquiries/route';
import { GET as cron } from '../src/app/api/cron/inquiry-alerts/route';
const payload = {
  idempotency_key: '66666666-6666-4666-8666-666666666666',
  name: 'Fixture',
  phone: '+12025550123',
  type: 'General',
  message: 'Development inquiry fixture',
  marketing_consent: false,
};
const request = () =>
  new Request('http://127.0.0.1:3000/api/public/inquiries', {
    method: 'POST',
    headers: {
      host: '127.0.0.1:3000',
      origin: 'http://127.0.0.1:3000',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.callbacks.length = 0;
  vi.stubEnv('INQUIRY_RATE_LIMIT_SALT', 'test-salt');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://127.0.0.1:3000');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe('saved inquiries and alert dispatch', () => {
  it('confirms the saved inquiry even when the background provider worker fails', async () => {
    mocks.rpc.mockResolvedValue({ data: payload.idempotency_key, error: null });
    mocks.dispatch.mockRejectedValue(new Error('provider unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.callbacks).toHaveLength(1);
    await expect(mocks.callbacks[0]()).resolves.toBeUndefined();
  });
  it('never dispatches alerts for a rejected inquiry', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Save failed' } });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.callbacks).toHaveLength(0);
  });
  it('keeps the worker closed without the exact configured bearer token', async () => {
    vi.stubEnv('CRON_SECRET', 's'.repeat(32));
    expect((await cron(new Request('http://localhost/api/cron/inquiry-alerts'))).status).toBe(401);
    expect(mocks.dispatch).not.toHaveBeenCalled();
    mocks.dispatch.mockResolvedValue(2);
    expect(
      (
        await cron(
          new Request('http://localhost/api/cron/inquiry-alerts', {
            headers: { Authorization: 'Bearer ' + 's'.repeat(32) },
          }),
        )
      ).status,
    ).toBe(200);
  });
});
