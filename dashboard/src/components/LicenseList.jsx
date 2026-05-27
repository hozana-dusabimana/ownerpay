import { computeState } from '../lib/state';
import { buildClaims } from '../lib/store';

export default function LicenseList({ licenses, onCreate, onOpen }) {
  return (
    <>
      <div className="btn-row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Licenses</h2>
        <button onClick={onCreate}>+ New license</button>
      </div>

      {licenses.length === 0 ? (
        <div className="empty">
          No licenses yet.<br />Create one to protect a project you deliver.
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {licenses.map((lic) => {
            const state = computeState(buildClaims(lic));
            return (
              <div key={lic._key} className="list-item" onClick={() => onOpen(lic._key)}>
                <div className="grow">
                  <div><strong>{lic.project || '(untitled project)'}</strong></div>
                  <div className="sub">{lic.client || 'no client'} · {lic.milestones.length} milestone(s)</div>
                </div>
                <span className={`pill ${state.level}`}>{state.level}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
