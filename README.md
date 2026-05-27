# OwnerPay

**Get paid for the software you deliver — without hosting a server.**

You build projects (React/Node, Python, Spring Boot, PHP, Flutter, …) and hand them over
as a zip or GitHub repo. After delivery, some clients stop paying — and once the full
source runs on their machine you have zero leverage. OwnerPay restores that leverage.

It embeds a tiny licensing client in the project you deliver. That client checks a
**signed license** you publish on **GitHub** (no server, no hosting bill) and enforces a
**graduated** policy when a payment milestone is overdue:

```
paid / grace  ──▶  payment-due banner  ──▶  feature lock  ──▶  shutdown
```

You flip a client from *paid* to *overdue* by committing a one-line change from the
dashboard. Mark the final milestone paid → the app returns to normal.

> **Track-only billing.** OwnerPay does not collect money. You get paid however you
> already do (bank, MoMo, etc.) and just mark milestones paid in the dashboard.

## How "GitHub only, no server" works

GitHub *is* the backend:

```
┌─ Dashboard (React) ──────┐   commit    ┌─ ownerpay-licenses repo ─┐  raw fetch  ┌─ SDK in delivered app ─┐
│ holds your signing key   │ ─────────▶  │ licenses/<id>.jwt        │ ──────────▶ │ verify → enforce       │
│ + GitHub token           │   (API)     │ served free via raw/Pages│             │ banner/lock/shutdown   │
└──────────────────────────┘             └──────────────────────────┘             └────────────────────────┘
```

## Repo layout

| Path           | What                                                                 |
|----------------|----------------------------------------------------------------------|
| `PROTOCOL.md`  | The spec every component implements. **Read this first.**            |
| `tools/`       | `keygen.mjs` — generate your RSA signing keypair.                    |
| `dashboard/`   | React (Vite) app — runs locally **and** deploys to GitHub Pages.    |
| `sdk/php/`     | Drop-in PHP client.                                                  |
| `sdk/node/`    | Node + browser-React client.                                        |
| `sdk/python/`  | Python client.                                                       |
| `sdk/java/`    | Spring Boot / Java client.                                          |
| `sdk/flutter/` | Flutter / Dart client.                                              |
| `licenses/`    | Example signed license store (in practice, its own GitHub repo).    |

## Quick start

1. `node tools/keygen.mjs` → creates `keys/private.pem` (keep secret) and
   `keys/public.pem` (ship in SDKs).
2. `cd dashboard && npm install && npm run dev` → open the dashboard, paste your private
   key + a GitHub token, add a client/project + milestones, click **Publish**.
3. Drop the matching SDK into the project you deliver, point it at your license URL, paste
   the public key. Done.

See `PROTOCOL.md §7` for the honest security boundary, and pair this with a contract
clause: *"source/IP license transfers only on full payment."*
