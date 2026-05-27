import { useState } from 'react';
import { checkLogin, USERNAME } from '../lib/auth';

/** App-wide login gate. On success passes the password up (it also unlocks the key vault). */
export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState(USERNAME);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const ok = await checkLogin(username.trim(), password);
    setBusy(false);
    if (ok) onLogin(password);
    else { setErr('Wrong username or password.'); setPassword(''); }
  }

  return (
    <div style={{ maxWidth: 340, margin: '15vh auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 22 }}>🔐 OwnerPay</h1>
      <p className="muted">Log in to access the dashboard.</p>
      <form onSubmit={submit}>
        <label style={{ textAlign: 'left' }}>Username</label>
        <input value={username} autoComplete="username" onChange={(e) => setUsername(e.target.value)} />
        <label style={{ textAlign: 'left' }}>Password</label>
        <input type="password" value={password} autoFocus autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)} />
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button type="submit" disabled={busy || !password}>{busy ? 'Checking…' : 'Log in'}</button>
        </div>
      </form>
      {err && <div className="notice err">{err}</div>}
    </div>
  );
}
