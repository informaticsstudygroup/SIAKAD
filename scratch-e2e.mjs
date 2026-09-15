import { chromium } from "playwright";

const shotDir = "C:\\Users\\Daniel\\AppData\\Local\\Temp\\claude\\d--coding-nie-ISG-file-SIM-ISG-2026\\acd1f1b1-762d-4210-97da-cf34c567c110\\scratchpad";
const base = "http://localhost:3001";
const results = [];
const suffix = Date.now().toString().slice(-6);

function log(name, pass, extra) {
  results.push({ name, pass, extra });
  console.log(`${pass ? "PASS" : "FAIL"} - ${name}${extra ? " :: " + extra : ""}`);
}

const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => log("console error", false, String(e)));

  // 1. Registration flow
  await page.goto(`${base}/register`, { waitUntil: "networkidle" });
  await page.fill("#name", "Peserta E2E " + suffix);
  await page.fill("#studentId", "99" + suffix);
  await page.fill("#email", `e2e${suffix}@isg.dev`);
  await page.fill("#phone", "08123456789");
  await page.fill("#studyProgram", "Informatika");
  await page.click('button:has-text("Lanjut")'); // step1 -> step2
  await page.fill("#password", "PesertaE2E123!");
  await page.fill("#confirmPassword", "PesertaE2E123!");
  await page.click('button:has-text("Lanjut")'); // step2 -> step3
  await page.check('input[name="agreement"]');
  await page.click('button:has-text("Daftar Sekarang")');
  await page.waitForURL(/\/register\/status\//, { timeout: 15000 });
  const regUrl = page.url();
  const registrationNumber = regUrl.split("/").pop();
  log("Registration redirects to status page", regUrl.includes("/register/status/"), regUrl);
  await page.screenshot({ path: `${shotDir}/e2e-01-status-pending.png`, fullPage: true });

  // 2. Admin login
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="identifier"]', "admin@isg.dev");
  await page.fill('input[name="password"]', "Admin123!");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${base}/dashboard`, { timeout: 15000 });
  log("Admin login succeeds", true);

  // 3. Create batch
  const batchName = "Angkatan E2E " + suffix;
  await page.goto(`${base}/dashboard/angkatan`, { waitUntil: "networkidle" });
  await page.click('button:has-text("Tambah Angkatan")');
  await page.fill("#name", batchName);
  await page.fill("#period", "Ganjil E2E");
  await page.fill("#startDate", "2026-01-01");
  await page.fill("#endDate", "2026-06-01");
  await page.fill("#capacity", "30");
  await page.click('button:has-text("Simpan")');
  await page.waitForTimeout(700);
  const batchRowVisible = await page.locator(`text=${batchName}`).first().isVisible().catch(() => false);
  log("Batch created and visible in table", batchRowVisible, batchName);
  await page.screenshot({ path: `${shotDir}/e2e-02-batch-created.png`, fullPage: true });

  // 4. Verify applicant
  await page.goto(`${base}/dashboard/pendaftar`, { waitUntil: "networkidle" });
  const applicantRow = page.locator("tr", { hasText: registrationNumber });
  await applicantRow.locator('button:has-text("Lihat Detail")').click();
  await page.waitForTimeout(300);
  await page.click('button:has-text("Verifikasi Pendaftar")');
  await page.selectOption("#batchId", { label: batchName });
  await page.click('button:has-text("Konfirmasi Verifikasi")');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${shotDir}/e2e-03-after-verify.png`, fullPage: true });

  // logout admin
  await page.click('summary:has-text("Admin ISG")').catch(() => {});
  await page.click('button:has-text("Keluar")').catch(() => {});
  await page.waitForTimeout(500);

  // 5. Login as newly verified participant using NIM
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="identifier"]', "99" + suffix);
  await page.fill('input[name="password"]', "PesertaE2E123!");
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL(`${base}/dashboard`, { timeout: 8000 });
    log("Newly verified participant can log in with NIM", true);
    await page.screenshot({ path: `${shotDir}/e2e-04-new-participant-dashboard.png`, fullPage: true });
  } catch {
    const errText = await page.locator('[role="alert"]').innerText().catch(() => "(no error shown)");
    log("Newly verified participant can log in with NIM", false, errText);
  }

  // 6. Check status page now shows VERIFIED
  await page.goto(`${base}${regUrl.replace(base, "")}`, { waitUntil: "networkidle" });
  const statusText = await page.locator("h1, span").allInnerTexts();
  log("Status page reflects VERIFIED", statusText.some((t) => t.includes("Terverifikasi")));
  await page.screenshot({ path: `${shotDir}/e2e-05-status-verified.png`, fullPage: true });

  await page.close();
} catch (err) {
  console.error("EXCEPTION:", err);
} finally {
  await browser.close();
}

console.log("\n=== SUMMARY ===");
const failed = results.filter((r) => !r.pass);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) console.log("FAILED:", failed.map((f) => f.name).join(", "));
