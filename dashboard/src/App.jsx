import { useEffect, useState } from 'react';
import * as store from './lib/store';
import { vaultExists } from './lib/vault';
import Settings from './components/Settings.jsx';
import LicenseList from './components/LicenseList.jsx';
import LicenseEditor from './components/LicenseEditor.jsx';
import UnlockScreen from './components/UnlockScreen.jsx';

const IDLE_LOCK_MS = 15 * 60 * 1000; // auto-lock after 15 min of inactivity

export default function App() {
  const [settings, setSettings] = useState(store.loadSettings);
  const [licenses, setLicenses] = useState(store.loadLicenses);
  const [session, setSession] = useState(null);   // { secrets, passphrase } — memory only
  const [hasVault, setHasVault] = useState(vaultExists());
  const [view, setView] = useState('list');
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => store.saveSettings(settings), [settings]);
  useEffect(() => store.saveLicenses(licenses), [licenses]);

  // Auto-lock: clear in-memory secrets after inactivity.
  useEffect(() => {
    if (!session) return;
    let timer;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => setSession(null), IDLE_LOCK_MS); };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [session]);

  const locked = hasVault && !session;
  const secrets = session?.secrets || null;

  if (locked) {
    return <UnlockScreen onUnlock={(s, pass) => setSession({ secrets: s, passphrase: pass })} />;
  }

  function createLicense() {
    const lic = { ...store.newLicense(), _key: crypto.randomUUID() };
    setLicenses((xs) => [...xs, lic]);
    setEditingKey(lic._key);
    setView('editor');
  }
  const updateLicense = (u) => setLicenses((xs) => xs.map((l) => (l._key === u._key ? u : l)));
  function deleteLicense(key) {
    setLicenses((xs) => xs.filter((l) => l._key !== key));
    setView('list');
  }

  const editing = licenses.find((l) => l._key === editingKey) || null;
  const configured = secrets && settings.owner;

  return (
    <div>
      <div className="topbar">
        <h1>🔓 OwnerPay</h1>
        <button className={`tab ${view !== 'settings' ? 'active' : ''}`} onClick={() => setView('list')}>Licenses</button>
        <button className={`tab ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>Settings</button>
        <div className="spacer" />
        {!configured && view !== 'settings' && (
          <span className="muted">⚙️ Set up your key & passphrase in Settings first</span>
        )}
        {hasVault && session && (
          <button className="secondary" onClick={() => setSession(null)} title="Lock now">🔒 Lock</button>
        )}
      </div>

      <div className="container">
        {view === 'settings' && (
          <Settings
            settings={settings}
            onSave={setSettings}
            secrets={secrets}
            session={session}
            hasVault={hasVault}
            onSession={setSession}
            onVaultChange={setHasVault}
          />
        )}

        {view === 'list' && (
          <LicenseList
            licenses={licenses}
            onCreate={createLicense}
            onOpen={(key) => { setEditingKey(key); setView('editor'); }}
          />
        )}

        {view === 'editor' && editing && (
          <LicenseEditor
            license={editing}
            settings={settings}
            secrets={secrets}
            onChange={updateLicense}
            onDelete={() => deleteLicense(editing._key)}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </div>
  );
}
