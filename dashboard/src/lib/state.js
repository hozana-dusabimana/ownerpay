// Reference implementation of the OwnerPay state machine (PROTOCOL.md §3).
// The dashboard uses it for the live preview; every SDK mirrors this logic.

export const LEVELS = ['active', 'banner', 'locked', 'shutdown'];
const DAY = 86400; // seconds

const dueSec = (m) => Math.floor(new Date(`${m.dueDate}T00:00:00Z`).getTime() / 1000);

/**
 * @param claims  the license claims object
 * @param now     Date (defaults to real now; the preview lets you scrub this)
 * @returns { level, daysOverdue, nextMilestone, message, checkedAt }
 */
export function computeState(claims, now = new Date()) {
  const nowSec = Math.floor(now.getTime() / 1000);
  const checkedAt = new Date(nowSec * 1000).toISOString();

  if (claims.status === 'revoked') {
    return { level: 'shutdown', daysOverdue: null, nextMilestone: null, checkedAt,
      message: 'License revoked.' };
  }
  if (claims.exp && nowSec > claims.exp) {
    return { level: 'shutdown', daysOverdue: null, nextMilestone: null, checkedAt,
      message: 'License expired.' };
  }

  const overdue = (claims.milestones || [])
    .filter((m) => !m.paid && dueSec(m) <= nowSec)
    .sort((a, b) => dueSec(a) - dueSec(b))[0];

  if (!overdue) {
    return { level: 'active', daysOverdue: 0, nextMilestone: nextUnpaid(claims), checkedAt,
      message: 'All due milestones paid.' };
  }

  const daysOverdue = Math.floor((nowSec - dueSec(overdue)) / DAY);
  const p = claims.policy || {};
  const grace = num(p.graceDays, 7);
  const banner = num(p.bannerDays, 14);
  const lock = num(p.lockDays, 14);

  let level;
  if (daysOverdue <= grace) level = 'active';
  else if (daysOverdue <= grace + banner) level = 'banner';
  else if (daysOverdue <= grace + banner + lock) level = 'locked';
  else level = 'shutdown';

  return {
    level,
    daysOverdue,
    nextMilestone: overdue,
    checkedAt,
    message: messageFor(level, overdue, daysOverdue),
  };
}

function nextUnpaid(claims) {
  return (claims.milestones || [])
    .filter((m) => !m.paid)
    .sort((a, b) => dueSec(a) - dueSec(b))[0] || null;
}

function messageFor(level, m, days) {
  const what = `${m.label} (${m.amount} ${m.currency || ''})`.trim();
  switch (level) {
    case 'active': return `Within grace period for ${what}.`;
    case 'banner': return `Payment overdue: ${what} was due ${days} days ago.`;
    case 'locked': return `Features locked — ${what} is ${days} days overdue.`;
    case 'shutdown': return `Application disabled — ${what} is ${days} days overdue.`;
    default: return '';
  }
}

const num = (v, d) => (Number.isFinite(+v) ? +v : d);

/** Boundaries (in days-overdue) for rendering the timeline. */
export function thresholds(policy = {}) {
  const grace = num(policy.graceDays, 7);
  const banner = num(policy.bannerDays, 14);
  const lock = num(policy.lockDays, 14);
  return {
    active: grace,
    banner: grace + banner,
    locked: grace + banner + lock,
  };
}
