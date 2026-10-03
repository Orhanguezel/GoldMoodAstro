import { describe, expect, it } from 'bun:test';
import path from 'node:path';

const config = require('../metro.config.js');
const mobileRoot = path.resolve(import.meta.dir, '..');

describe('Metro React resolution', () => {
  it('uses the mobile React package for React and both JSX runtimes', () => {
    for (const moduleName of ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime']) {
      const resolved = config.resolver.resolveRequest(
        { resolveRequest: () => { throw new Error('unexpected fallback'); } },
        moduleName,
        'android',
      );
      expect(resolved.type).toBe('sourceFile');
      expect(resolved.filePath).toStartWith(path.join(mobileRoot, 'node_modules/react'));
    }
  });
});
