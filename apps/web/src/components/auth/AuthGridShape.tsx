/** Decorative grid pattern for auth brand panel (TailAdmin GridShape equivalent). */
export function AuthGridShape() {
  return (
    <>
      <div
        className="auth-grid-shape auth-grid-shape--top pointer-events-none absolute right-0 top-0 -z-10 h-64 w-full max-w-[280px] opacity-40 xl:max-w-[420px]"
        aria-hidden
      />
      <div
        className="auth-grid-shape auth-grid-shape--bottom pointer-events-none absolute bottom-0 left-0 -z-10 h-64 w-full max-w-[280px] rotate-180 opacity-40 xl:max-w-[420px]"
        aria-hidden
      />
    </>
  );
}
