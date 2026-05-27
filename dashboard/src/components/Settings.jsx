import { useState } from 'react';
import { validatePrivateKey } from '../lib/jwt';
import { checkAccess } from '../lib/github';
import { createVault, destroyVault } from '../lib/vault';

export default function Settings({ settings, onSave, secrets, session, hasVault, onSession, onVaultChange }) {
  const [net, setNet] = useState(settings);
  const [keyInput, setKeyInput] = useState(secrets?.privateKey || '');
  const [tokenInput, setTokenInput] = useState(secrets?.githubToken || '');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [keyMsg, setKeyMsg] = useState(null);
  const [ghMsg, setGhMsg] = useState(null);
  const [vaultMsg, setVaultMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const setN = (k) => (e) => setNet({ ...net, [k]: e.target.value });

  async function testKey() {
    const err = await validatePrivateKey(keyInput);
    setKeyMsg(err ? { ok: false, text: err } : { ok: true, text: 'Private key is valid (RSA PKCS#8).' });
  }

  async function testGitHub() {
    setBusy(true); setGhMsg(null);
    try {
      const info = await checkAccess({ token: tokenInput, owner: net.owner, repo: net.repo });
      setGhMsg({ ok: true, text: `Connected. Repo is ${info.private ? 'private' : 'public'}, default branch "${info.defaultBranch}".`
        + (info.private ? ' ⚠️ Private repos are NOT readable by deployed SDKs — use a public repo or GitHub Pages.' : '') });
    } catch (e) {
      setGhMsg({ ok: false, text: e.message });
    } finally { setBusy(false); }
  }

  async function createVaultNow() {
    setVaultMsg(null);
    if (pass !== pass2) return setVaultMsg({ ok: false, text: 'Passphrases do not match.' });
    const err = await validatePrivateKey(keyInput);
    if (err) return setVaultMsg({ ok: false, text: err });
    if (!tokenInput) return setVaultMsg({ ok: false, text: 'Enter your GitHub token.' });
    try {
      const s = { privateKey: keyInput, githubToken: tokenInput };
      await createVault(s, pass);
      onVaultChange(true);
      onSession({ secrets: s, passphrase: pass });
      setPass(''); setPass2('');
      setVaultMsg({ ok: true, text: '🔐 Vault created and unlocked. Auto-locks after 15 min idle.' });
    } catch (e) { setVaultMsg({ ok: false, text: e.message }); }
  }

  async function saveSecrets() {
    setVaultMsg(null);
    const err = await validatePrivateKey(keyInput);
    if (err) return setVaultMsg({ ok: false, text: err });
    try {
      const s = { privateKey: keyInput, githubToken: tokenInput };
      await createVault(s, session.passphrase);
      onSession({ secrets: s, passphrase: session.passphrase });
      setVaultMsg({ ok: true, text: 'Secrets updated and re-encrypted.' });
    } catch (e) { setVaultMsg({ ok: false, text: e.message }); }
  }

  async function changePassphrase() {
    setVaultMsg(null);
    if (newPass !== newPass2) return setVaultMsg({ ok: false, text: 'New passphrases do not match.' });
    try {
      await createVault(secrets, newPass);
      onSession({ secrets, passphrase: newPass });
      setNewPass(''); setNewPass2('');
      setVaultMsg({ ok: true, text: 'Passphrase changed.' });
    } catch (e) { setVaultMsg({ ok: false, text: e.message }); }
  }

  function removeVault() {
    if (!confirm('Remove the encrypted vault from this browser? Nothing on GitHub is affected.')) return;
    destroyVault(); onVaultChange(false); onSession(null);
  }

  return (
    <>
      <div className="card">
        <h2>🔐 Secrets vault {hasVault && <span className="pill active" style={{ marginLeft: 6 }}>unlocked</span>}</h2>
        <p className="muted">Your <strong>private key</strong> and <strong>GitHub token</strong> are encrypted with a
          master passphrase (PBKDF2 + AES-GCM) and stored as ciphertext only. Plaintext lives in memory and is wiped on
          lock / after 15 min idle. Nothing here is ever uploaded.</p>

        <label>Private key (PEM)</label>
        <textarea value={keyInput} onChange={(e) => setKeyInput(e.target.value)} spellCheck={false} rows={5}
          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" />
        <label>GitHub Personal Access Token <span className="muted">(fine-grained: Contents → Read & write, with an expiry)</span></label>
        <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="github_pat_..." autoComplete="off" />
        <div className="btn-row">
          <button className="secondary" onClick={testKey} disabled={!keyInput}>Validate key</button>
        </div>
        {keyMsg && <div className={`notice ${keyMsg.ok ? 'ok' : 'err'}`}>{keyMsg.text}</div>}

        {!hasVault ? (
          <>
            <h3>Create your master passphrase</h3>
            <div className="row">
              <div><label>Passphrase (min 6 chars)</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" /></div>
              <div><label>Confirm</label><input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" /></div>
            </div>
            <div className="btn-row"><button onClick={createVaultNow} disabled={!keyInput || !tokenInput || !pass}>🔐 Create encrypted vault</button></div>
            <p className="muted" style={{ fontSize: 12 }}>⚠️ There's no recovery — if you forget the passphrase you'll re-enter your key & token. (They're regenerable; GitHub data is untouched.)</p>
          </>
        ) : (
          <>
            <div className="btn-row">
              <button onClick={saveSecrets}>Save & re-encrypt</button>
              <button className="secondary" onClick={() => onSession(null)}>🔒 Lock now</button>
              <button className="danger" onClick={removeVault}>Remove vault</button>
            </div>
            <h3>Change passphrase</h3>
            <div className="row">
              <div><label>New passphrase</label><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" /></div>
              <div><label>Confirm</label><input type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} autoComplete="new-password" /></div>
            </div>
            <div className="btn-row"><button className="secondary" onClick={changePassphrase} disabled={!newPass}>Change passphrase</button></div>
          </>
        )}
        {vaultMsg && <div className={`notice ${vaultMsg.ok ? 'ok' : 'err'}`}>{vaultMsg.text}</div>}
      </div>

      <div className="card">
        <h2>GitHub (license store)</h2>
        <p className="muted">The repo must be <strong>public</strong> (or served via GitHub Pages) so deployed apps can read licenses.</p>
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
          <button className="secondary" onClick={testGitHub} disabled={busy || !tokenInput || !net.owner}>{busy ? 'Testing…' : 'Test access'}</button>
        </div>
        {ghMsg && <div className={`notice ${ghMsg.ok ? 'ok' : 'err'}`}>{ghMsg.text}</div>}
      </div>
    </>
  );
}
