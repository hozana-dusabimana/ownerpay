// localStorage-backed persistence for settings and licenses, plus claims assembly.
// Everything lives in the browser; nothing is sent anywhere except GitHub on publish.

const SETTINGS_KEY = 'ownerpay.settings';
const LICENSES_KEY = 'ownerpay.licenses';

// NOTE: secrets (privateKey, githubToken) are NOT stored here — they live in the
// passphrase-encrypted vault (lib/vault.js) and only in memory. These are non-secret.
const DEFAULT_SETTINGS = {
  owner: '',
  repo: 'ownerpay-licenses',
  branch: 'main',
  pathPrefix: 'licenses',
};

export const DEFAULT_POLICY = {
  graceDays: 7,
  bannerDays: 14,
  lockDays: 14,
  checkIntervalHours: 24,
  offlineGraceDays: 14,
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSettings() {
  const stored = read(SETTINGS_KEY, {});
  // Migration: scrub any plaintext secrets left by an earlier version.
  if (stored.privateKey || stored.githubToken) {
    delete stored.privateKey;
    delete stored.githubToken;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored));
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}
export const saveSettings = (s) => {
  const { privateKey, githubToken, ...safe } = s; // never persist secrets here
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
};

export const loadLicenses = () => read(LICENSES_KEY, []);
export const saveLicenses = (list) => localStorage.setItem(LICENSES_KEY, JSON.stringify(list));

export function newLicense() {
  return {
    id: '',
    project: '',
    client: '',
    status: 'active',
    policy: { ...DEFAULT_POLICY },
    milestones: [],
    publishedUrl: '',
    createdAt: new Date().toISOString(),
  };
}

export function newMilestone(label = '') {
  return { id: slug(label || 'milestone'), label, amount: 0, currency: 'USD', dueDate: today(), paid: false, paidDate: '' };
}

/** Turn a license record into signed-token claims. */
export function buildClaims(license) {
  return {
    iss: 'ownerpay',
    sub: license.id,
    iat: Math.floor(Date.now() / 1000),
    project: license.project,
    client: license.client,
    status: license.status || 'active',
    policy: { ...DEFAULT_POLICY, ...license.policy },
    milestones: (license.milestones || []).map((m) => ({
      id: m.id,
      label: m.label,
      amount: Number(m.amount) || 0,
      currency: m.currency || 'USD',
      dueDate: m.dueDate,
      paid: !!m.paid,
      ...(m.paid && m.paidDate ? { paidDate: m.paidDate } : {}),
    })),
  };
}

export const filePath = (settings, license) => `${settings.pathPrefix}/${license.id}.jwt`;

export function slug(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
