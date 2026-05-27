import { useState } from 'react';
import { computeState, thresholds } from '../lib/state';
import { today } from '../lib/store';

export default function TimelinePreview({ claims }) {
  const [date, setDate] = useState(today());
  const state = computeState(claims, new Date(`${date}T12:00:00Z`));
  const p = claims.policy || {};
  const t = thresholds(p);

  const grace = Number(p.graceDays) || 0;
  const banner = Number(p.bannerDays) || 0;
  const lock = Number(p.lockDays) || 0;
  const shutdownVis = Math.max(lock, 7); // visual width only
  const total = grace + banner + lock + shutdownVis || 1;
  const pct = (n) => `${(n / total) * 100}%`;

  return (
    <div>
      <div className="timeline">
        <div className="seg-active" style={{ width: pct(grace) }} title={`Grace: 0–${t.active}d`}>grace</div>
        <div className="seg-banner" style={{ width: pct(banner) }} title={`Banner: ${t.active + 1}–${t.banner}d`}>banner</div>
        <div className="seg-locked" style={{ width: pct(lock) }} title={`Locked: ${t.banner + 1}–${t.locked}d`}>lock</div>
        <div className="seg-shutdown" style={{ width: pct(shutdownVis) }} title={`Shutdown: >${t.locked}d`}>shutdown</div>
      </div>
      <div className="muted" style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
        <span>due date</span><span>{t.active}d</span><span>{t.banner}d</span><span>{t.locked}d overdue</span>
      </div>

      <div className="row" style={{ marginTop: 14, alignItems: 'flex-end' }}>
        <div style={{ maxWidth: 200 }}>
          <label>Preview state on date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <span className={`pill ${state.level}`}>{state.level}</span>
          <div className="muted" style={{ marginTop: 6 }}>{state.message}</div>
        </div>
      </div>
    </div>
  );
}
