import { useEffect, useState } from 'react';
import * as store from './lib/store';
import Settings from './components/Settings.jsx';
import LicenseList from './components/LicenseList.jsx';
import LicenseEditor from './components/LicenseEditor.jsx';

export default function App() {
  const [settings, setSettings] = useState(store.loadSettings);
  const [licenses, setLicenses] = useState(store.loadLicenses);
  const [view, setView] = useState('list'); // 'list' | 'editor' | 'settings'
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => store.saveSettings(settings), [settings]);
  useEffect(() => store.saveLicenses(licenses), [licenses]);

  const editing = licenses.find((l) => l._key === editingKey) || null;

  function createLicense() {
    const lic = { ...store.newLicense(), _key: crypto.randomUUID() };
    setLicenses((xs) => [...xs, lic]);
    setEditingKey(lic._key);
    setView('editor');
  }

  function updateLicense(updated) {
    setLicenses((xs) => xs.map((l) => (l._key === updated._key ? updated : l)));
  }

  function deleteLicense(key) {
    setLicenses((xs) => xs.filter((l) => l._key !== key));
    setView('list');
  }

  const configured = settings.privateKey && settings.githubToken && settings.owner;

  return (
    <div>
      <div className="topbar">
        <h1>🔐 OwnerPay</h1>
        <button className={`tab ${view !== 'settings' ? 'active' : ''}`}
          onClick={() => setView('list')}>Licenses</button>
        <button className={`tab ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}>Settings</button>
        <div className="spacer" />
        {!configured && view !== 'settings' && (
          <span className="muted">⚙️ Configure your key & GitHub in Settings first</span>
        )}
      </div>

      <div className="container">
        {view === 'settings' && <Settings settings={settings} onSave={setSettings} />}

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
            onChange={updateLicense}
            onDelete={() => deleteLicense(editing._key)}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </div>
  );
}
