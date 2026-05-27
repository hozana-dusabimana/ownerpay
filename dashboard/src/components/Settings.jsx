import { useState } from 'react';
import { validatePrivateKey } from '../lib/jwt';
import { createVault, destroyVault } from '../lib/vault';

export default function Settings({ settings, onSave, secrets, session, hasVault, onSession, onVaultChange }) {
  const [net, setNet] = useState(settings);
  const [keyInput, setKeyInput] = useState(secrets?.privateKey || '');
  const [keyMsg, setKeyMsg] = useState(null);
  const [ghMsg, setGhMsg] = useState(null);

  const setN = (k) => (e) => setNet({ ...net, [k]: e.target.value });

  async function testKey() {
    const err = await validatePrivateKey(keyInput);
    setKeyMsg(err ? { ok: false, text: err } : { ok: true, text: 'Private key is valid (RSA PKCS#8).' });
  }

  async function saveKey() {
    setKeyMsg(null);
    const err = await validatePrivateKey(keyInput);
    if (err) return setKeyMsg({ ok: false, text: err });
    try {
      const s = { privateKey: keyInput };
      await createVault(s, session.passphrase);   // encrypted with your login password
      onVaultChange(true);
      onSession({ ...session, secrets: s });
      setKeyMsg({ ok: true, text: '🔑 Signing key saved (encrypted with your login password).' });
    } catch (e) { setKeyMsg({ ok: false, text: e.message }); }
  }

  function removeKey() {
    if (!confirm('Remove your encrypted signing key from this browser? Nothing on GitHub is affected.')) return;
    destroyVault();
    onVaultChange(false);
    onSession({ ...session, secrets: null });
    setKeyInput('');
    setKeyMsg({ ok: true, text: 'Key removed.' });
  }

  return (
    <>
      <div className="card">
        <h2>🔑 Signing key {secrets?.privateKey && <span className="pill active" style={{ marginLeft: 6 }}>loaded</span>}</h2>
        <p className="muted">Your <strong>private key</strong> is encrypted with your login password (AES-GCM) and stored
          as ciphertext only. Plaintext lives in memory and is cleared on logout / after 15 min idle. No GitHub token is
          stored — you commit signed licenses yourself with git.</p>

        <label>Private key (PEM)</label>
        <textarea value={keyInput} onChange={(e) => setKeyInput(e.target.value)} spellCheck={false} rows={6}
          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" />
        <div className="btn-row">
          <button onClick={saveKey} disabled={!keyInput}>Save key</button>
          <button className="secondary" onClick={testKey} disabled={!keyInput}>Validate</button>
          {hasVault && <button className="danger" onClick={removeKey}>Remove key</button>}
        </div>
        {keyMsg && <div className={`notice ${keyMsg.ok ? 'ok' : 'err'}`}>{keyMsg.text}</div>}
      </div>

      <div className="card">
        <h2>License store (repo coordinates)</h2>
        <p className="muted">Used only to build the SDK URL and the file path for the licenses you commit. The repo must
          be <strong>public</strong> (or served via GitHub Pages) so deployed apps can read it.</p>
        <div className="row">
          <div><label>Owner (user/org)</label><input value={net.owner} onChange={setN('owner')} placeholder="your-github-username" /></div>
          <div><label>Repo</label><input value={net.repo} onChange={setN('repo')} placeholder="ownerpay-licenses" /></div>
        </div>
        <div className="row">
          <div><label>Branch</label><input value={net.branch} onChange={setN('branch')} placeholder="main" /></div>
          <div><label>Path prefix</label><input value={net.pathPrefix} onChange={setN('pathPrefix')} placeholder="licenses" /></div>
        </div>
        <div className="btn-row">
          <button onClick={() => { onSave(net); setGhMsg({ ok: true, text: 'Saved.' }); }}>Save</button>
        </div>
        {ghMsg && <div className={`notice ${ghMsg.ok ? 'ok' : 'err'}`}>{ghMsg.text}</div>}
      </div>
    </>
  );
}
