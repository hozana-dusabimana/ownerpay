<?php
// Deterministic SDK test: verify the graduated state machine at several dates.
// Final payment is due 2026-03-01 and unpaid; policy grace=7, banner=14, lock=14.
require __DIR__ . '/OwnerPay.php';

$op = new OwnerPay([
    'licenseUrl' => __DIR__ . '/../../licenses/example.jwt', // local fixture
    'publicKey'  => file_get_contents(__DIR__ . '/../../keys/public.pem'),
    'cacheFile'  => sys_get_temp_dir() . '/ownerpay_test.json',
]);

$cases = [
    ['2026-03-05', 'active'],   // 4 days overdue  (<=7)
    ['2026-03-12', 'banner'],   // 11 days         (8..21)
    ['2026-03-26', 'locked'],   // 25 days         (22..35)
    ['2026-04-20', 'shutdown'], // 50 days         (>35)
];

$pass = true;
foreach ($cases as [$date, $expected]) {
    @unlink(sys_get_temp_dir() . '/ownerpay_test.json');
    $now = strtotime("$date UTC");
    $s = $op->check($now);
    $ok = $s['level'] === $expected;
    $pass = $pass && $ok;
    printf("%s  on %s => %-9s (expected %-9s) | %s\n", $ok ? 'PASS' : 'FAIL', $date, $s['level'], $expected, $s['message']);
}
echo $pass ? "\nALL PASS\n" : "\nFAILURES\n";
exit($pass ? 0 : 1);
