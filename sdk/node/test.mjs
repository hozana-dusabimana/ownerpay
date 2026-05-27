// Deterministic test for the isomorphic JS core (same fixture as the PHP test).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createOwnerPay } from './ownerpay.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const token = readFileSync(join(root, 'licenses', 'example.jwt'), 'utf8').trim();
const publicKeyPem = readFileSync(join(root, 'keys', 'public.pem'), 'utf8');

// Fake fetch that serves the local fixture with a realistic Date header.
const fakeFetch = async () => ({
  ok: true,
  text: async () => token,
  headers: { get: (h) => (h.toLowerCase() === 'date' ? new Date().toUTCString() : null) },
});

const cases = [
  ['2026-03-05', 'active'],
  ['2026-03-12', 'banner'],
  ['2026-03-26', 'locked'],
  ['2026-04-20', 'shutdown'],
];

let pass = true;
for (const [date, expected] of cases) {
  const op = createOwnerPay({ licenseUrl: 'https://x/test.jwt', publicKeyPem, fetch: fakeFetch });
  const now = Math.floor(Date.parse(`${date}T12:00:00Z`) / 1000);
  const s = await op.check(now);
  const ok = s.level === expected;
  pass = pass && ok;
  console.log(`${ok ? 'PASS' : 'FAIL'}  on ${date} => ${s.level.padEnd(9)} (expected ${expected.padEnd(9)}) | ${s.message}`);
}
console.log(pass ? '\nALL PASS' : '\nFAILURES');
process.exit(pass ? 0 : 1);
