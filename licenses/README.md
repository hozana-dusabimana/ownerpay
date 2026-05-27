# The license store

This folder is a stand-in for your **license store** — in real use it's its own GitHub
repo (e.g. `ownerpay-licenses`) that you commit signed licenses to and your deployed apps read.

## How it serves "for free, no server"

Each published license is a single file, `<licenseId>.jwt`, containing the signed token.
Deployed apps read it over plain HTTPS via one of:

- **raw.githubusercontent.com** (repo must be **public**):
  `https://raw.githubusercontent.com/<owner>/ownerpay-licenses/main/licenses/<id>.jwt`
- **GitHub Pages** (also free, nicer caching):
  `https://<owner>.github.io/ownerpay-licenses/licenses/<id>.jwt`

Both send permissive CORS headers, so even browser/React apps can fetch them cross-origin.

## Why a *public* repo is safe here

The file is only a **signed, read-only** status. A client can read it but cannot forge a
"paid" one (no private key) and cannot change it (no write access). The token contains the
client/project name and payment milestones — if that's sensitive, use GitHub Pages from a
repo whose source is private but whose Pages output is the only public surface, or obscure
the `licenseId`.

## Flipping a client's status

You never hand-edit the token — the dashboard signs it for you:

1. Open the license in the dashboard.
2. Toggle a milestone's **Paid** box (or set **Status: revoked** for an immediate kill).
3. **Download .jwt**, drop it at `licenses/<id>.jwt` in this repo, and commit/push it (the
   editor shows the exact `git` commands). Deployed apps pick it up on their next check
   (per `policy.checkIntervalHours`).

## Files here

- `example.claims.json` — sample input for `node tools/sign.mjs`.
- `example.jwt` — the signed token the SDK test-suites verify against.
