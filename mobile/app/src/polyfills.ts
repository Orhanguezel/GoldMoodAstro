/** livekit-client web API varsayımları — RN'de yok; modül yüklenmeden önce tanımlanır. */
if (typeof (globalThis as Record<string, unknown>).DOMException === 'undefined') {
  (globalThis as Record<string, unknown>).DOMException = class PolyfillDOMException extends Error {
    override name: string;
    constructor(message = '', name = 'DOMException') {
      super(message);
      this.name = name;
    }
  };
}
