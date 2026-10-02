/**
 * OpenAPI documents the wire-format success envelope; the Axios envelope interceptor
 * returns only `data` at runtime. Use this type so generated clients match runtime.
 */
export type GatewayUnwrapped<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;
