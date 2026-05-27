// Deterministic test for the Dart SDK core (same fixture as PHP/JS/Python/Java).
//   dart run bin/test.dart
import 'dart:io';
import 'package:ownerpay/ownerpay.dart';

Future<void> main() async {
  final root = '../..';
  final url = '$root/licenses/example.jwt';
  final pem = File('$root/keys/public.pem').readAsStringSync();

  final cases = [
    ['2026-03-05', 'active'],
    ['2026-03-12', 'banner'],
    ['2026-03-26', 'locked'],
    ['2026-04-20', 'shutdown'],
  ];

  var all = true;
  for (final c in cases) {
    final cache = '${Directory.systemTemp.path}/ownerpay_darttest.json';
    final f = File(cache);
    if (f.existsSync()) f.deleteSync();
    final op = OwnerPay(licenseUrl: url, publicKeyPem: pem, cacheFile: cache);
    final now = DateTime.parse('${c[0]}T12:00:00Z').millisecondsSinceEpoch ~/ 1000;
    final s = await op.check(nowOverride: now);
    final ok = s.level == c[1];
    all = all && ok;
    print('${ok ? "PASS" : "FAIL"}  on ${c[0]} => ${s.level.padRight(9)} (expected ${c[1].padRight(9)}) | ${s.message}');
  }
  print(all ? '\nALL PASS' : '\nFAILURES');
  exit(all ? 0 : 1);
}
