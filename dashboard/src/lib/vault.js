// Passphrase-encrypted vault for the dashboard's secrets (signing key + GitHub token).
// Only ciphertext is ever written to localStorage. The plaintext secrets live in memory
// (React state) and are wiped on lock. Uses Web Crypto: PBKDF2(SHA-256) → AES-256-GCM.
// AES-GCM's auth tag means a wrong passphrase fails to decrypt (no "is this right?" oracle).

const VAULT_KEY = 'ownerpay.vault';
const DEFAULT_ITER = 210000;

function bufToB64(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function b64ToBuf(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function vaultExists() {
  return !!localStorage.getItem(VAULT_KEY);
}

/** Encrypt `secrets` (any JSON-serialisable object) under `passphrase` and persist it. */
export async function createVault(secrets, passphrase) {
  if (!passphrase || passphrase.length < 6) throw new Error('Choose a passphrase of at least 6 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, DEFAULT_ITER);
  const pt = new TextEncoder().encode(JSON.stringify(secrets));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt);
  localStorage.setItem(VAULT_KEY, JSON.stringify({
    v: 1, iter: DEFAULT_ITER, salt: bufToB64(salt), iv: bufToB64(iv), ct: bufToB64(ct),
  }));
}

/** Decrypt and return the secrets, or throw 'Wrong passphrase.' */
export async function openVault(passphrase) {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) throw new Error('No vault on this device.');
  const { iter = DEFAULT_ITER, salt, iv, ct } = JSON.parse(raw);
  const key = await deriveKey(passphrase, b64ToBuf(salt), iter);
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(iv) }, key, b64ToBuf(ct));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    throw new Error('Wrong passphrase.');
  }
}

export function destroyVault() {
  localStorage.removeItem(VAULT_KEY);
}
