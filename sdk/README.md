# OwnerPay SDKs — integration guide

Every SDK does the same four things (see [`PROTOCOL.md`](../PROTOCOL.md)): **fetch** the
signed token from your GitHub license URL → **verify** it with your *public* key →
**compute** the graduated state → **enforce** (`active → banner → locked → shutdown`).

Two values are the same everywhere:

- `LICENSE_URL` — the raw/Pages URL of `<licenseId>.jwt` (shown in the dashboard).
- `PUBLIC_KEY` — the contents of `keys/public.pem`. Safe to ship inside delivered source.

Each SDK has a deterministic test you can run after `node tools/sign.mjs licenses/example.claims.json licenses/example.jwt`:

| Language | Test |
|---|---|
| PHP | `php sdk/php/test.php` |
| Node/JS | `node sdk/node/test.mjs` |
| Python | `python sdk/python/test_ownerpay.py` |
| Java | `cd sdk/java && javac -d out src/com/ownerpay/OwnerPay.java src/Test.java && java -cp out Test ../..` |
| Dart | `cd sdk/flutter && dart pub get && dart run bin/test.dart` |

---

## PHP

Copy `OwnerPay.php` + your `ownerpay_public.pem` into the project.

```php
require __DIR__ . '/OwnerPay.php';
$op = new OwnerPay([
    'licenseUrl' => 'https://raw.githubusercontent.com/you/ownerpay-licenses/main/licenses/acme-crm.jwt',
    'publicKey'  => file_get_contents(__DIR__ . '/ownerpay_public.pem'),
]);
$op->enforce();                       // auto: banner / feature-lock / shutdown
// Feature gating:
if ($op->isLocked()) { /* hide the export button, etc. */ }
```

## Node

```js
import { createOwnerPay } from './ownerpay.js';
const op = createOwnerPay({ licenseUrl: LICENSE_URL, publicKeyPem: PUBLIC_KEY });
const s = await op.check();
if (s.level === 'shutdown') { console.error(s.message); process.exit(1); }
```

## React (browser)

Copy `sdk/node/ownerpay.js` and `sdk/react/ownerpay-react.jsx` into the project.

```jsx
import { OwnerPayGate, useOwnerPay } from './ownerpay-react';

export default function Root() {
  return (
    <OwnerPayGate licenseUrl={LICENSE_URL} publicKeyPem={PUBLIC_KEY}>
      <App />
    </OwnerPayGate>
  );
}

// Feature gating inside the app:
function ExportButton() {
  const { level } = useOwnerPay({ licenseUrl: LICENSE_URL, publicKeyPem: PUBLIC_KEY });
  if (level === 'locked' || level === 'shutdown') return null;
  return <button>Export</button>;
}
```

## Python

```python
from ownerpay import OwnerPay
op = OwnerPay(license_url=LICENSE_URL, public_key_pem=PUBLIC_KEY)
state = op.check()
if op.is_shutdown():
    raise SystemExit(state["message"])
```

In Flask/Django, call `op.check()` in middleware and short-circuit on `shutdown`,
inject a banner on `banner`/`locked`.

## Java / Spring Boot

Copy `com/ownerpay/OwnerPay.java` into your sources (zero dependencies).

```java
@Component
public class LicenseInterceptor implements HandlerInterceptor {
  private final OwnerPay op = new OwnerPay(LICENSE_URL, PUBLIC_KEY);

  @Override public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object h) throws Exception {
    OwnerPay.State s = op.check();
    if (s.level == OwnerPay.Level.SHUTDOWN) { res.sendError(503, s.message); return false; }
    req.setAttribute("ownerpayLevel", s.level);  // banner/lock handled in your view layer
    return true;
  }
}
```

## Flutter / Dart

Add the package (path or git) and ship your public key as a string constant.

```dart
import 'package:ownerpay/ownerpay.dart';
import 'package:flutter/material.dart';

class OwnerPayGate extends StatefulWidget {
  final Widget child;
  const OwnerPayGate({super.key, required this.child});
  @override State<OwnerPayGate> createState() => _OwnerPayGateState();
}

class _OwnerPayGateState extends State<OwnerPayGate> {
  final _op = OwnerPay(licenseUrl: LICENSE_URL, publicKeyPem: PUBLIC_KEY);
  OwnerPayState? _s;

  @override void initState() { super.initState(); _op.check().then((s) => setState(() => _s = s)); }

  @override Widget build(BuildContext context) {
    final s = _s;
    if (s == null) return widget.child;                       // fail-open on first frame
    if (s.level == 'shutdown') {
      return MaterialApp(home: Scaffold(body: Center(child: Text(s.message))));
    }
    if (s.level == 'banner' || s.level == 'locked') {
      return Banner(message: s.message, location: BannerLocation.topStart, child: widget.child);
    }
    return widget.child;
  }
}
```

> **Mobile note:** a phone can stay offline for a long time, so enforcement on Flutter is
> softer than on a server. The `offlineGraceDays` escalation still degrades the app after
> a prolonged offline stretch, but for mobile lean harder on the contract clause.
