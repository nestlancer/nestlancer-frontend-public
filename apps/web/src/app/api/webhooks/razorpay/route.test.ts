import { describe, expect, it } from 'vitest';

import { GET, POST } from './route';

describe('razorpay webhook stub', () => {
  it('does not ACK success on POST', async () => {
    const res = await POST();
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.received).toBeUndefined();
    expect(body.error).toMatch(/gateway/i);
  });

  it('returns 404 on GET', async () => {
    const res = await GET();
    expect(res.status).toBe(404);
  });
});
