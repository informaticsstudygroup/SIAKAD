import { chromium } from "playwright";

const base = "http://localhost:3001";
const suffix = Date.now().toString().slice(-6);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${base}/register`, { waitUntil: "networkidle" });
await page.fill("#name", "Peserta Debug " + suffix);
await page.fill("#studentId", "77" + suffix);
await page.fill("#email", `dbg${suffix}@isg.dev`);
await page.fill("#phone", "08123456789");
await page.fill("#studyProgram", "Informatika");
await page.click('button:has-text("Lanjut")'); // now on step 2
await page.waitForTimeout(150);
await page.fill("#password", "PesertaDebug123!");
await page.fill("#confirmPassword", "PesertaDebug123!");

console.log("--- calling reportValidity() directly via evaluate, WITHOUT clicking React button ---");
const result = await page.evaluate(() => {
  const fieldsets = document.querySelectorAll("fieldset");
  const step2 = fieldsets[1];
  const before = document.getElementById("name")?.value;
  const rv = step2.reportValidity();
  const after = document.getElementById("name")?.value;
  return { rv, before, after };
});
console.log(JSON.stringify(result, null, 2));

await browser.close();
