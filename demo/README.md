# OwnerPay demo — "Acme CRM"

A stand-in for a project you delivered. It reads its license from the **live GitHub URL**
and enforces the graduated policy. The only OwnerPay code is 4 lines at the top of
[`index.php`](index.php); the rest is just the app.

## Run it

```bash
# from the repo root
php -S localhost:8000 -t demo
# open http://localhost:8000
```

The bundled demo license has the **Final payment** overdue, so you'll see a **payment-due
banner** and the *Premium: bulk export* feature **locked/visible-but-disabled** per the
timeline.

## See enforcement change live

1. Open the dashboard, find the `ownerpay-demo` license.
2. Tick **Final payment → Paid**, click **Publish**.
3. Reload the demo → banner gone, export re-enabled (within `checkIntervalHours`).
   Set **Status: revoked** instead and the whole app shows the shutdown screen.

## Local-only smoke test (before the repo is public)

`raw.githubusercontent.com` only serves the license once the repo is pushed **and public**.
To prove the flow offline, point the SDK at the local token:

```bash
OWNERPAY_LICENSE_URL=./licenses/demo.jwt php -S localhost:8000 -t demo
```
