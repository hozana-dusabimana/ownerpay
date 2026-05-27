// Verifies the vault crypto round-trips and rejects a wrong passphrase.
// Node 22 exposes the same Web Crypto API (crypto.subtle) the browser uses.
//   node dashboard/src/lib/vault.test.mjs
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { createVault, openVault, vaultExists, destroyVault } = await import('./vault.js');

const secrets = { privateKey: '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----', githubToken: 'github_pat_123' };
let pass = true;
const check = (name, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); pass = pass && cond; };

await createVault(secrets, 'correct horse battery');
check('vault exists after create', vaultExists() === true);

const stored = JSON.parse(localStorage.getItem('ownerpay.vault'));
check('localStorage holds only ciphertext (no plaintext key)', !JSON.stringify(stored).includes('BEGIN PRIVATE KEY') && !JSON.stringify(stored).includes('github_pat_123'));

const got = await openVault('correct horse battery');
check('decrypts back to original secrets', JSON.stringify(got) === JSON.stringify(secrets));

let threw = false;
try { await openVault('wrong passphrase'); } catch (e) { threw = e.message === 'Wrong passphrase.'; }
check('wrong passphrase is rejected', threw);

destroyVault();
check('vault gone after destroy', vaultExists() === false);

console.log(pass ? '\nALL PASS' : '\nFAILURES');
process.exit(pass ? 0 : 1);
