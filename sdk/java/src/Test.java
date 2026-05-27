import com.ownerpay.OwnerPay;
import java.nio.file.*;
import java.time.*;

/** Deterministic test for the Java SDK (same fixture as PHP/JS/Python). */
public class Test {
    public static void main(String[] args) throws Exception {
        String root = args.length > 0 ? args[0] : "../..";
        String url = root + "/licenses/example.jwt";
        String pem = new String(Files.readAllBytes(Paths.get(root + "/keys/public.pem")), "UTF-8");

        String[][] cases = {
            {"2026-03-05", "ACTIVE"}, {"2026-03-12", "BANNER"},
            {"2026-03-26", "LOCKED"}, {"2026-04-20", "SHUTDOWN"},
        };

        boolean all = true;
        for (String[] c : cases) {
            Path cache = Paths.get(System.getProperty("java.io.tmpdir"), "ownerpay_javatest.json");
            Files.deleteIfExists(cache);
            OwnerPay op = new OwnerPay(url, pem, cache);
            long now = LocalDate.parse(c[0]).atStartOfDay(ZoneOffset.UTC).toEpochSecond() + 43200;
            OwnerPay.State s = op.check(now);
            boolean ok = s.level.name().equals(c[1]);
            all &= ok;
            System.out.printf("%s  on %s => %-9s (expected %-9s) | %s%n",
                ok ? "PASS" : "FAIL", c[0], s.level, c[1], s.message);
        }
        System.out.println(all ? "\nALL PASS" : "\nFAILURES");
        System.exit(all ? 0 : 1);
    }
}
