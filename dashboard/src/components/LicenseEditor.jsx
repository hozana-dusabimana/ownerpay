import { useState } from 'react';
import { signJwt } from '../lib/jwt';
import { rawUrl } from '../lib/github';
import { buildClaims, filePath, newMilestone, slug, today } from '../lib/store';
import TimelinePreview from './TimelinePreview.jsx';

const POLICY_FIELDS = [
  ['graceDays', 'Grace days'],
  ['bannerDays', 'Banner days'],
  ['lockDays', 'Lock days'],
  ['checkIntervalHours', 'Check interval (h)'],
  ['offlineGraceDays', 'Offline grace days'],
];

export default function LicenseEditor({ license, settings, secrets, onChange, onDelete, onBack }) {
  const [msg, setMsg] = useState(null);
  const [token, setToken] = useState('');
  const [showClaims, setShowClaims] = useState(false);

  const claims = buildClaims(license);
  const update = (patch) => onChange({ ...license, ...patch });
  const setField = (k) => (e) => update({ [k]: e.target.value });

  function setProject(e) {
    const project = e.target.value;
    update({ project, id: license.id || slug(`${project}`) });
  }

  function setPolicy(k) {
    return (e) => update({ policy: { ...license.policy, [k]: e.target.value } });
  }

  // ---- milestones ----
  const setMilestone = (i, patch) =>
    update({ milestones: license.milestones.map((m, j) => (j === i ? { ...m, ...patch } : m)) });

  function addMilestone() {
    update({ milestones: [...license.milestones, newMilestone()] });
  }
  function removeMilestone(i) {
    update({ milestones: license.milestones.filter((_, j) => j !== i) });
  }
  function togglePaid(i, paid) {
    setMilestone(i, { paid, paidDate: paid ? (license.milestones[i].paidDate || today()) : '' });
  }

  // ---- signing / publishing ----
  async function signNow() {
    if (!secrets?.privateKey) throw new Error('Vault locked or no signing key. Unlock in Settings.');
    if (!license.id) throw new Error('Set a License ID first.');
    const t = await signJwt(buildClaims(license), secrets.privateKey);
    setToken(t);
    return t;
  }

  async function download() {
    try {
      const t = await signNow();
      const blob = new Blob([t], { type: 'application/jwt' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${license.id || 'license'}.jwt`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
  }

  const repoPath = filePath(settings, license);
  const predictedUrl = settings.owner && license.id
    ? rawUrl({ owner: settings.owner, repo: settings.repo, branch: settings.branch, path: repoPath })
    : '';
  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <>
      <div className="btn-row" style={{ justifyContent: 'space-between' }}>
        <button className="secondary" onClick={onBack}>← Back</button>
        <button className="danger" onClick={onDelete}>Delete</button>
      </div>

      <div className="card">
        <h2>Project & client</h2>
        <div className="row">
          <div><label>Project</label><input value={license.project} onChange={setProject} placeholder="Acme CRM" /></div>
          <div><label>Client</label><input value={license.client} onChange={setField('client')} placeholder="Acme Ltd" /></div>
        </div>
        <div className="row">
          <div><label>License ID (used in the file name & URL)</label>
            <input value={license.id} onChange={(e) => update({ id: slug(e.target.value) })} placeholder="acme-crm" /></div>
          <div><label>Status</label>
            <select value={license.status} onChange={setField('status')}>
              <option value="active">active (normal)</option>
              <option value="revoked">revoked (immediate shutdown)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Payment milestones</h2>
        <table>
          <thead><tr><th>Label</th><th>Amount</th><th>Cur.</th><th>Due</th><th>Paid</th><th>Paid date</th><th /></tr></thead>
          <tbody>
            {license.milestones.map((m, i) => (
              <tr key={i}>
                <td><input value={m.label} onChange={(e) => setMilestone(i, { label: e.target.value })} placeholder="Deposit" /></td>
                <td style={{ width: 90 }}><input type="number" value={m.amount} onChange={(e) => setMilestone(i, { amount: e.target.value })} /></td>
                <td style={{ width: 70 }}><input value={m.currency} onChange={(e) => setMilestone(i, { currency: e.target.value })} /></td>
                <td style={{ width: 150 }}><input type="date" value={m.dueDate} onChange={(e) => setMilestone(i, { dueDate: e.target.value })} /></td>
                <td><input type="checkbox" checked={m.paid} onChange={(e) => togglePaid(i, e.target.checked)} /></td>
                <td style={{ width: 150 }}><input type="date" value={m.paidDate || ''} disabled={!m.paid} onChange={(e) => setMilestone(i, { paidDate: e.target.value })} /></td>
                <td><button className="icon-btn" onClick={() => removeMilestone(i)}>✕</button></td>
              </tr>
            ))}
            {license.milestones.length === 0 && (
              <tr><td colSpan={7} className="muted">No milestones. Add e.g. Deposit / Midpoint / Final.</td></tr>
            )}
          </tbody>
        </table>
        <div className="btn-row"><button className="secondary" onClick={addMilestone}>+ Add milestone</button></div>
      </div>

      <div className="card">
        <h2>Enforcement policy (graduated)</h2>
        <div className="row">
          {POLICY_FIELDS.map(([k, label]) => (
            <div key={k}><label>{label}</label>
              <input type="number" value={license.policy[k]} onChange={setPolicy(k)} /></div>
          ))}
        </div>
        <h3>Preview</h3>
        <TimelinePreview claims={claims} />
      </div>

      <div className="card">
        <h2>Signed license</h2>
        <p className="muted">Sign and download the <span className="mono">.jwt</span>. Host it anywhere your SDK can
          reach over HTTPS (e.g. a public GitHub repo or GitHub Pages) and point the SDK at that URL. The dashboard
          only signs — it needs no GitHub access.</p>
        {predictedUrl && (
          <>
            <label>Suggested SDK license URL</label>
            <div className="mono">{predictedUrl}</div>
          </>
        )}
        <div className="btn-row">
          <button onClick={download} disabled={!license.id}>⬇ Download {license.id || 'license'}.jwt</button>
          <button className="secondary" onClick={async () => copy(await signNow())}>Copy token</button>
          <button className="secondary" onClick={() => copy(predictedUrl)} disabled={!predictedUrl}>Copy URL</button>
          <button className="secondary" onClick={() => setShowClaims((s) => !s)}>{showClaims ? 'Hide' : 'View'} claims</button>
        </div>
        {msg && <div className={`notice ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
        {showClaims && <pre className="mono" style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{JSON.stringify(claims, null, 2)}</pre>}
        {token && (
          <>
            <h3>Signed token</h3>
            <div className="mono">{token}</div>
          </>
        )}
      </div>
    </>
  );
}
