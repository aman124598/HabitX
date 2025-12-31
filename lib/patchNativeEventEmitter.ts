// Minimal runtime patch to harden NativeEventEmitter against receiving undefined
// or malformed native modules which can cause Hermes to throw: "Value is undefined, expected an Object".
export function patchNativeEventEmitter(): void {
  try {
    // Use require so this runs at runtime only and doesn't affect static tooling
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RN = require('react-native');
    const Original = RN.NativeEventEmitter;
    if (!Original) return;

    function PatchedNativeEventEmitter(nativeModule: any) {
      try {
        // Defensive normalization: convert undefined -> null to satisfy RN invariant
        if (typeof nativeModule === 'undefined') {
          nativeModule = null;
        }
        // If someone passed a non-object, fallback to null
        if (nativeModule !== null && typeof nativeModule !== 'object') {
          nativeModule = null;
        }

        // If a native module object is present but missing expected methods,
        // provide no-op implementations so the emitter won't call undefined.
        if (nativeModule) {
          if (typeof nativeModule.addListener !== 'function') {
            nativeModule.addListener = () => {};
          }
          if (typeof nativeModule.removeListeners !== 'function') {
            nativeModule.removeListeners = () => {};
          }
        }

        // Construct the original emitter with the normalized nativeModule
        // eslint-disable-next-line new-cap
        return new Original(nativeModule);
      } catch (e) {
        // If anything goes wrong, fall back to constructing original emitter
        try {
          // eslint-disable-next-line new-cap
          return new Original(nativeModule);
        } catch (err) {
          return null;
        }
      }
    }

    // Preserve prototype so instanceof checks continue to work
    // @ts-ignore
    PatchedNativeEventEmitter.prototype = Original.prototype;

    RN.NativeEventEmitter = PatchedNativeEventEmitter;
  } catch (e) {
    // Best-effort patch; swallow errors to avoid making the app crash during init
  }
}
