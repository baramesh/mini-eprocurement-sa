import crypto from 'node:crypto';

// Start every run from the delivered data (CNV-10): only the admin from seed-data.sql exists before this call.
export default async function globalSetup() {
  const base = process.env.BASE_URL ?? 'http://localhost:8080/api/v1/';
  const secret = process.env.TEST_JWT_SECRET ?? 'test-secret-test-secret-test-secret-0123';
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const head = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ email: 'admin@example.test', roles: ['ADMIN'], aud: 'eprocurement', exp: Math.floor(Date.now() / 1000) + 600 })}`;
  const token = `${head}.${crypto.createHmac('sha256', secret).update(head).digest('base64url')}`;
  const r = await fetch(new URL('../../__test/reset', base), { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`reset failed: ${r.status} ${await r.text()}`);
}
