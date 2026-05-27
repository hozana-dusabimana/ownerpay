// In-browser RS256 JWT signing using the Web Crypto API — no dependencies.
// The private key never leaves the browser; we sign here and publish only the token.

function bytesToB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function strToB64url(str) {
  return bytesToB64url(new TextEncoder().encode(str));
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// PEM (PKCS#8) -> DER bytes
function pemToDer(pem) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  if (!body) throw new Error('Empty or malformed PEM private key.');
  return b64ToBytes(body);
}

let cachedPem = null;
let cachedKey = null;

async function importPrivateKey(privatePem) {
  if (cachedPem === privatePem && cachedKey) return cachedKey;
  let der;
  try {
    der = pemToDer(privatePem);
  } catch {
    throw new Error('Private key is not valid PEM.');
  }
  let key;
  try {
    key = await crypto.subtle.importKey(
      'pkcs8',
      der,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  } catch {
    throw new Error('Could not import private key. It must be an RSA PKCS#8 key (the keys/private.pem from keygen).');
  }
  cachedPem = privatePem;
  cachedKey = key;
  return key;
}

/** Sign claims into a compact RS256 JWT string. */
export async function signJwt(claims, privatePem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const signingInput = `${strToB64url(JSON.stringify(header))}.${strToB64url(JSON.stringify(claims))}`;
  const key = await importPrivateKey(privatePem);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${bytesToB64url(new Uint8Array(sig))}`;
}

/** Quick local sanity check that a private key is importable. */
export async function validatePrivateKey(privatePem) {
  try {
    await importPrivateKey(privatePem);
    return null;
  } catch (e) {
    return e.message;
  }
}
