#!/usr/bin/env node
/**
 * OwnerPay CLI signer — mint a license token without the dashboard.
 *
 *   node tools/sign.mjs <claims.json> [out.jwt]
 *
 * Produces the exact same RS256 JWT the dashboard would (base64url(header).payload.sig,
 * RSASSA-PKCS1-v1_5 + SHA-256). Useful for scripting and for testing the SDKs.
 *
 * <claims.json> may be a partial license; missing standard fields are filled in.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const privPath = join(root, 'keys', 'private.pem');

if (!existsSync(privPath)) {
  console.error('Missing keys/private.pem. Run: node tools/keygen.mjs');
  process.exit(1);
}
const claimsFile = process.argv[2];
if (!claimsFile) {
  console.error('Usage: node tools/sign.mjs <claims.json> [out.jwt]');
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const input = JSON.parse(readFileSync(claimsFile, 'utf8'));
const claims = {
  iss: 'ownerpay',
  iat: Math.floor(Date.now() / 1000),
  status: 'active',
  ...input,
};

const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const payload = b64url(JSON.stringify(claims));
const signingInput = `${header}.${payload}`;

const signer = createSign('RSA-SHA256');
signer.update(signingInput);
const sig = b64url(signer.sign(readFileSync(privPath)));
const token = `${signingInput}.${sig}`;

const out = process.argv[3];
if (out) {
  writeFileSync(out, token);
  console.error(`Wrote ${out}`);
} else {
  process.stdout.write(token + '\n');
}
