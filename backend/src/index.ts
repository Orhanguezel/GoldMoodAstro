// src/index.ts
import { createApp } from './app';
import { env } from '@/core/env';

async function main() {
  const app: any = await createApp();

  // Only bind to localhost unless explicitly overridden
  const host = (process.env.HOST ?? '127.0.0.1') as string;

  await app.listen({ port: env.PORT, host });

  console.log(`API listening ${host}:${env.PORT}`);
}

main().catch((e) => {
  console.error('Server failed', e);
  process.exit(1);
});
