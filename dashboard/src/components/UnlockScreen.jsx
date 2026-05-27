import { useState } from 'react';
import { openVault, destroyVault } from '../lib/vault';

/** Shown whenever a vault exists but secrets aren't loaded in memory. */
export default function UnlockScreen({ onUnlock }) {
  const [passphrase, setPassphrase] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function unlock(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const secrets = await openVault(passphrase);
      onUnlock(secrets, passphrase);
    } catch (e2) {
      setErr(e2.message);
      setPassphrase('');
    } finally {
      setBusy(false);
    }
  }

  function forget() {
    if (confirm('Remove the encrypted vault from this browser? You will need your private key and token again to recreate it. (Nothing on GitHub is affected.)')) {
      destroyVault();
      location.reload();
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '16vh auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 22 }}>🔒 OwnerPay</h1>
      <p className="muted">Enter your master passphrase to unlock your signing key and GitHub token.</p>
      <form onSubmit={unlock}>
        <input
          type="password" value={passphrase} autoFocus autoComplete="off"
          onChange={(e) => setPassphrase(e.target.value)} placeholder="Master passphrase"
          style={{ textAlign: 'center' }}
        />
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button type="submit" disabled={busy || !passphrase}>{busy ? 'Unlocking…' : 'Unlock'}</button>
        </div>
      </form>
      {err && <div className="notice err">{err}</div>}
      <p style={{ marginTop: 24 }}>
        <button className="icon-btn" onClick={forget}>Forgot passphrase? Reset vault</button>
      </p>
    </div>
  );
}
