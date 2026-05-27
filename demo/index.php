<?php
/**
 * Demo "Acme CRM" — a stand-in for a project you delivered to a client.
 * The only OwnerPay code is the 4 lines below; everything else is the app.
 */
require __DIR__ . '/../sdk/php/OwnerPay.php';
$cfg = require __DIR__ . '/config.php';
$op = new OwnerPay($cfg);
$state = $op->check();                 // { level, daysOverdue, message, ... }

// Hard stop on shutdown — the app refuses to run.
if ($state['level'] === 'shutdown') {
    http_response_code(503);
    echo $op->bannerHtml($state); // (reuse styling)
    exit("\n<div style='font:18px system-ui;text-align:center;margin-top:20vh;color:#e74c3c'>"
        . "Acme CRM is unavailable.<br><small style='color:#888'>" . htmlspecialchars($state['message']) . "</small></div>");
}

$locked = in_array($state['level'], ['locked', 'shutdown'], true);
$pill = ['active' => '#2ecc71', 'banner' => '#f1c40f', 'locked' => '#e67e22', 'shutdown' => '#e74c3c'][$state['level']];
?>
<!doctype html>
<html><head><meta charset="utf-8"><title>Acme CRM</title>
<style>
body{font:15px system-ui;margin:0;background:#f4f6fb;color:#222}
header{background:#1e2230;color:#fff;padding:14px 24px;display:flex;align-items:center;gap:14px}
.wrap{max-width:760px;margin:30px auto;padding:0 20px}
.card{background:#fff;border:1px solid #e3e7ef;border-radius:10px;padding:20px;margin-bottom:16px}
.pill{padding:3px 10px;border-radius:99px;color:#222;font-weight:700;font-size:12px;text-transform:uppercase;background:<?=$pill?>}
button{padding:9px 14px;border:0;border-radius:7px;background:#4f8cff;color:#fff;cursor:pointer}
button:disabled{background:#c7ccd6;cursor:not-allowed}
.banner{background:#f1c40f;color:#222;padding:10px 16px;text-align:center;font-weight:600}
small{color:#888}
</style></head><body>

<?php if ($state['level'] === 'banner' || $state['level'] === 'locked'): ?>
  <div class="banner">⚠️ <?= htmlspecialchars($state['message']) ?></div>
<?php endif; ?>

<header><strong>Acme CRM</strong> <span class="pill"><?= $state['level'] ?></span>
  <span style="margin-left:auto;font-size:12px;opacity:.7">OwnerPay demo</span></header>

<div class="wrap">
  <div class="card">
    <h2>Customers</h2>
    <p>Showing 1,248 customers. (This core feature always works.)</p>
    <button>View customers</button>
  </div>

  <div class="card">
    <h2>Premium: bulk export <?= $locked ? '🔒' : '' ?></h2>
    <?php if ($locked): ?>
      <p><small>This feature is locked because payment is overdue. Settle the invoice to restore it.</small></p>
      <button disabled>Export all data</button>
    <?php else: ?>
      <p>Export your full database to CSV.</p>
      <button>Export all data</button>
    <?php endif; ?>
  </div>

  <div class="card">
    <h3>OwnerPay status (debug)</h3>
    <pre style="white-space:pre-wrap;background:#f7f8fb;padding:12px;border-radius:6px"><?= htmlspecialchars(json_encode($state, JSON_PRETTY_PRINT)) ?></pre>
    <small>License: <?= htmlspecialchars($cfg['licenseUrl']) ?></small>
  </div>
</div>
</body></html>
