import { describe, expect, it } from 'vitest';

import { pickAdminRows } from './admin-response';

describe('pickAdminRows', () => {
  it('extracts disputes arrays from admin envelopes', () => {
    const rows = pickAdminRows({
      status: 'success',
      data: { disputes: [{ id: 'd1', status: 'OPEN' }] },
    });
    expect(rows).toEqual([{ id: 'd1', status: 'OPEN' }]);
  });
});
