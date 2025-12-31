// Minimal global error handler to surface uncaught JS errors during development
// Wire this early in the app entry (e.g., app/index.tsx) so we can capture Hermes errors

export function installGlobalErrorHandler() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const report = (e: any) => {
    try {
      // Try to stringify safely
      const payload = {
        message: e?.message || String(e),
        stack: e?.stack || null,
        name: e?.name || 'Error',
      };
      // Use console.error so Metro / Sentry / other dev tools can pick it up
      console.error('UncaughtJSException', payload);
    } catch (err) {
      console.error('UncaughtJSException (failed to serialize)', e);
    }
  };

  // Global handler
  // @ts-ignore
  if (typeof global?.ErrorUtils?.setGlobalHandler === 'function') {
    // React Native older API
    // @ts-ignore
    global.ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
      report(error);
      // rethrow to preserve default behaviour
      throw error;
    });
  }

  // Fallback for modern environments
  // @ts-ignore
  if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
    try {
      // @ts-ignore
      globalThis.addEventListener('unhandledrejection', (ev: any) => {
        report(ev.reason || ev);
      });
    } catch (e) {
      // ignore
    }
  }
}
