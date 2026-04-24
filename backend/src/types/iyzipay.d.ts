// Type stub for iyzipay (no official @types package)
declare module 'iyzipay' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class Iyzipay {
    constructor(config: Record<string, unknown>);
    checkoutFormInitialize: {
      create(request: Record<string, unknown>, callback: (err: unknown, result: unknown) => void): void;
    };
    checkoutForm: {
      retrieve(request: Record<string, unknown>, callback: (err: unknown, result: unknown) => void): void;
    };
    [key: string]: unknown;
  }
  export default Iyzipay;
}
