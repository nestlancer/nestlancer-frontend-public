import { describe, expect, it } from 'vitest';

import { asPaginated, asArray, peelSuccessEnvelope } from './peel-success-envelope';

describe('peelSuccessEnvelope', () => {
  it('unwraps nested success envelope', () => {
    const raw = {
      status: 'success',
      data: { items: [{ id: '1' }], total: 1, page: 1, pageSize: 12, hasMore: false },
    };
    const inner = peelSuccessEnvelope(raw);
    expect(inner).toEqual({
      items: [{ id: '1' }],
      total: 1,
      page: 1,
      pageSize: 12,
      hasMore: false,
    });
  });

  it('asPaginated maps items + meta', () => {
    const paginated = asPaginated({
      items: [{ id: 'a' }],
      total: 1,
      page: 1,
      pageSize: 12,
      hasMore: false,
    });
    expect(paginated.items).toHaveLength(1);
    expect(paginated.total).toBe(1);
  });

  it('asArray returns empty for non-arrays', () => {
    expect(asArray({})).toEqual([]);
  });

  it('asArray accepts data/projects/results wrappers', () => {
    expect(asArray({ data: [{ id: '1' }] })).toEqual([{ id: '1' }]);
    expect(asArray({ projects: [{ id: '2' }] })).toEqual([{ id: '2' }]);
    expect(asArray({ results: [{ id: '3' }] })).toEqual([{ id: '3' }]);
  });
});
