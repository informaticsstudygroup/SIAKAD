import { chromium } from "playwright";

const base = "http://localhost:3000";
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="identifier"]', "2211523001");
  await page.fill('input[name="password"]', "Peserta123!");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${base}/dashboard`, { timeout: 15000 });
  await page.waitForTimeout(400);

  const diag = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const outer = body.firstElementChild;
    const main = document.querySelector("main");
    const rect = (el) => el ? { h: el.getBoundingClientRect().height, scrollH: el.scrollHeight, clientH: el.clientHeight, overflowY: getComputedStyle(el).overflowY } : null;
    return {
      window_innerHeight: window.innerHeight,
      html: rect(html),
      body: rect(body),
      outerDiv: rect(outer),
      outerDivClass: outer?.className,
      main: rect(main),
      mainClass: main?.className,
      bodyScrollingElementIsHtml: document.scrollingElement === html,
      documentScrollHeight: document.documentElement.scrollHeight,
    };
  });
  console.log(JSON.stringify(diag, null, 2));

  await browser.close();
} catch (err) {
  console.error("EXCEPTION:", err);
  await browser.close();
}
