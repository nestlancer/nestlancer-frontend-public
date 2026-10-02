/**
 * Some microservices return `{ status: 'success', data: T }` and the gateway may
 * wrap again. After the Axios envelope interceptor strips the outer gateway
 * layer, `data` can still be a nested success envelope — peel up to a few levels.
 */
export function unwrapGatewayBody<T>(raw: unknown): T {
  let cur: unknown = raw;
  for (let i = 0; i < 4; i++) {
    if (
      cur &&
      typeof cur === 'object' &&
      'status' in cur &&
      (cur as { status: unknown }).status === 'success' &&
      'data' in cur &&
      (cur as { data: unknown }).data !== undefined
    ) {
      cur = (cur as { data: unknown }).data;
      continue;
    }
    break;
  }
  return cur as T;
}
