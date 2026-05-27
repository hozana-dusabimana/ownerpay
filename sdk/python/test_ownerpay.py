"""Deterministic test for the Python SDK (same fixture as PHP/JS)."""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from ownerpay import OwnerPay  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

op = OwnerPay(
    license_url=os.path.join(ROOT, "licenses", "example.jwt"),
    public_key_pem=open(os.path.join(ROOT, "keys", "public.pem")).read(),
    cache_file=os.path.join(os.environ.get("TEMP", "/tmp"), "ownerpay_pytest.json"),
)

cases = [("2026-03-05", "active"), ("2026-03-12", "banner"),
         ("2026-03-26", "locked"), ("2026-04-20", "shutdown")]

ok_all = True
for date, expected in cases:
    if os.path.exists(op.cache_file):
        os.remove(op.cache_file)
    now = int(datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp()) + 43200
    s = op.check(now)
    ok = s["level"] == expected
    ok_all = ok_all and ok
    print(f"{'PASS' if ok else 'FAIL'}  on {date} => {s['level']:<9} (expected {expected:<9}) | {s['message']}")

print("\nALL PASS" if ok_all else "\nFAILURES")
sys.exit(0 if ok_all else 1)
