// backend/scripts/smoke-test.ts
import { env } from '../src/core/env';

const BASE_URL = `http://localhost:${env.PORT}/api/v1`;

async function test(name: string, path: string, options: RequestInit = {}) {
  process.stdout.write(`🧪 Testing ${name} (${path})... `);
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const contentType = res.headers.get('content-type');
    if (res.ok) {
      console.log('✅ PASS');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return await res.text();
    } else {
      console.log(`❌ FAIL (HTTP ${res.status})`);
      const body = await res.text();
      console.error('   Response:', body.slice(0, 200));
      return null;
    }
  } catch (err: any) {
    console.log('💥 ERROR');
    console.error('   Message:', err.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting GoldMoodAstro Smoke Tests...');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // 1. Health Check
  await test('Health Check', '/health');

  // 2. Public Consultants
  await test('Consultant List', '/consultants');

  // 3. Login Attempt
  await test('Login (Invalid Credentials)', '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'wrong@example.com', password: 'wrongpassword' }),
  });

  // 4. Site Settings (Public)
  await test('App Locales', '/site_settings/app-locales');
  await test('Default Locale', '/site_settings/default-locale');

  console.log('\n🏁 Smoke tests completed.');
}

main();
