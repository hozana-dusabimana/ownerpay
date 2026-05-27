# OwnerPay License Protocol v1

This is the single source of truth that the dashboard and **every** SDK implement.
The whole system is "GitHub only" — there is no OwnerPay server. GitHub stores the
signed license and serves it for free; the dashboard signs it; the SDK verifies it.

```
Dashboard (React, your key)  --commit-->  GitHub repo  --raw fetch-->  SDK in delivered app
```

---

## 1. The license token

A license is a **signed JWT (JWS, alg = RS256)**. RS256 was chosen because every
target language (Node, PHP, Python, Java/Spring, Dart/Flutter, "and many more") has a
mature, well-audited JWT/RSA verifier, so each SDK is ~80 lines.

One token per *client-project*. It is published at a stable GitHub URL:

```
https://raw.githubusercontent.com/<owner>/<repo>/main/licenses/<licenseId>.jwt
```

(or the GitHub Pages equivalent `https://<owner>.github.io/<repo>/licenses/<licenseId>.jwt`).
The file contents are the raw JWT string.

### Claims

```jsonc
{
  "iss": "ownerpay",
  "sub": "<licenseId>",          // unique, e.g. "acme-crm-2026"
  "iat": 1748300000,             // issued-at (unix seconds)
  "project": "Acme CRM",
  "client": "Acme Ltd",
  "status": "active",            // "active" | "revoked"  (revoked = immediate shutdown, manual kill)
  "policy": {
    "graceDays": 7,              // free days after a due date passes unpaid
    "bannerDays": 14,            // then: show a payment-due banner for N days
    "lockDays": 14,              // then: feature-lock for N days
    // after that: shutdown
    "checkIntervalHours": 24,    // how often the SDK should re-fetch the token
    "offlineGraceDays": 14       // max days the SDK tolerates no network before escalating
  },
  "config": {                    // OPTIONAL signed app config — exposed by the SDK's config()
    "appTitle": "Acme CRM",      // for ENTANGLEMENT: have the app read values it genuinely
    "features": ["customers"],   // needs from here, so stubbing the check loses them and the
    "exportLimit": 5000          // app fails closed (see GUIDE.md). Faking it needs the key.
  },
  "milestones": [
    { "id": "deposit", "label": "Deposit", "amount": 200, "currency": "USD",
      "dueDate": "2026-01-01", "paid": true,  "paidDate": "2025-12-20" },
    { "id": "final",   "label": "Final",   "amount": 300, "currency": "USD",
      "dueDate": "2026-03-01", "paid": false }
  ],
  "exp": 1798300000              // optional hard backstop
}
```

---

## 2. Enforcement levels

The SDK reports a `level`; the host app decides the UX (the SDK ships sane defaults).

| level      | meaning                | default behaviour                                  |
|------------|------------------------|----------------------------------------------------|
| `active`   | paid / within grace    | nothing                                            |
| `banner`   | payment overdue        | show a non-dismissable "payment due" notice        |
| `locked`   | further overdue        | disable host-configured premium/key features       |
| `shutdown` | long overdue / revoked | block the app (block screen / refuse to start)     |

This is the **graduated** policy: `active → banner → locked → shutdown`.

---

## 3. State computation (every SDK MUST do this identically)

Inputs: verified `claims`, `trustedNow` (see §4), `cache` (last good result).

1. **Signature/parse failure** → if a valid cached token exists, use it; otherwise
   report `banner` (visible, but never brick a fresh legit deploy on a transient error).
2. `claims.status == "revoked"` → `shutdown`.
3. Pick the **earliest unpaid milestone** with `dueDate <= trustedNow` → call it the
   *overdue* milestone. If none → `active`.
4. `daysOverdue = floor((trustedNow - dueDate) / 1 day)`, then with `p = claims.policy`:
   - `daysOverdue <= p.graceDays`                                  → `active`
   - `<= p.graceDays + p.bannerDays`                               → `banner`
   - `<= p.graceDays + p.bannerDays + p.lockDays`                  → `locked`
   - else                                                          → `shutdown`
5. `exp` present and `trustedNow > exp` → `shutdown` (backstop).

The SDK returns: `{ level, daysOverdue, nextMilestone, message, checkedAt }`.

---

## 4. Trusted time (anti clock-rollback)

A client must not escape enforcement by setting the device clock back.

- **Primary source:** the HTTP `Date` response header returned by the GitHub fetch.
- Persist the highest trusted time ever seen (`lastTrustedTime`) in the cache.
- `trustedNow = max(Date header, lastTrustedTime, localClock)`. Using `max` means a
  rolled-back clock never *reduces* the perceived time.

---

## 5. Offline behaviour (anti block-the-domain)

A client must not escape by blocking `github.com` / `raw.githubusercontent.com`.

- On a successful fetch: cache the token + `trustedNow` + `fetchedAt` (local monotonic).
- When offline: keep using the cached token. Advance time as
  `trustedNow = lastTrustedTime + (localElapsedSinceFetch)`.
- If `offlineDuration > policy.offlineGraceDays`: **escalate one level** beyond the
  computed state (so prolonged blocking degrades the app instead of freezing it).

---

## 6. Keys

- **RSA-2048** (or larger). Generated by `tools/keygen.mjs`.
- **Private key**: stays in the dashboard (your browser `localStorage`) and/or your
  machine. **Never committed.** It signs tokens.
- **Public key**: embedded directly in each SDK and shipped inside the delivered source.
  It is public by design — it can only *verify*, not *issue*.

---

## 7. Security boundary (be honest with yourself)

Because the client receives full source, a skilled developer *can* delete the SDK call.
This protocol defeats the easy bypasses (forging a "paid" token, rolling the clock back,
blocking GitHub) and provides a tamper-evident, dated audit trail. The legal backstop —
a contract clause that **"source/IP license transfers only on full payment"** — is what
makes stripping the SDK a breach rather than a clever trick. Tech gives leverage; the
contract gives enforceability.
