#!/usr/bin/env node
/**
 * OwnerPay key generator.
 *
 *   node tools/keygen.mjs [bits]
 *
 * Creates an RSA keypair used to sign (private) and verify (public) license tokens.
 *   keys/private.pem  -> stays secret. Load it into the dashboard. NEVER commit.
 *   keys/public.pem   -> embed in every SDK / delivered project. Safe to publish.
 *
 * The private key signs RS256 JWTs; the public key only verifies them, so shipping it
 * inside client source is harmless.
 */
import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const bits = Number(process.argv[2]) || 2048;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const keysDir = join(root, 'keys');

if (existsSync(join(keysDir, 'private.pem'))) {
  console.error('Refusing to overwrite existing keys/private.pem.');
  console.error('Delete it manually if you really want to rotate keys (this invalidates every issued license).');
  process.exit(1);
}

console.log(`Generating RSA-${bits} keypair...`);
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: bits,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

mkdirSync(keysDir, { recursive: true });
writeFileSync(join(keysDir, 'private.pem'), privateKey, { mode: 0o600 });
writeFileSync(join(keysDir, 'public.pem'), publicKey);

console.log('\nWrote:');
console.log('  keys/private.pem  (SECRET — load into dashboard, never commit)');
console.log('  keys/public.pem   (embed in SDKs / delivered apps)');
console.log('\nNext: cd dashboard && npm install && npm run dev');
