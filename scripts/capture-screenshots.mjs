// Dev-only helper: captures real UI screenshots of the running app into
// docs/screenshots/ for the hackathon submission. Requires the app to be
// running (default http://localhost:3000) and the optional dev dependencies
// `playwright-core` + `@sparticuz/chromium` installed.
//
//   npm install -D playwright-core @sparticuz/chromium
//   npm run start          # in another terminal
//   node scripts/capture-screenshots.mjs [baseUrl]
import { mkdir } from "node:fs/promises";
import { chromium as pwChromium } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const outDir = new URL("../docs/screenshots/", import.meta.url).pathname;
await mkdir(outDir, { recursive: true });

const executablePath = await sparticuzChromium.executablePath();
const browser = await pwChromium.launch({
  executablePath,
  args: [...sparticuzChromium.args, "--no-sandbox"],
  headless: true,
});

async function newPage(viewport) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(30_000);
  return page;
}

const desktop = { width: 1366, height: 860 };
const mobile = { width: 390, height: 844 };

// 1. Discover (desktop + mobile)
{
  const page = await newPage(desktop);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}01-discover.png`, fullPage: true });
  await page.close();
}
{
  const page = await newPage(mobile);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}02-discover-mobile.png`, fullPage: true });
  await page.close();
}

// 2-6. Full journey on desktop
{
  const page = await newPage(desktop);
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Start with a selfie" }).click();
  await page.getByRole("button", { name: "Use demo photo" }).click();
  await page.waitForSelector("text=/what we noticed/", { state: "visible" });
  await page.screenshot({ path: `${outDir}03-capture-snapshot.png`, fullPage: true });

  // change finish to matte so the matches visibly re-rank
  await page.getByRole("button", { name: "Matte", exact: true }).click();
  await page.getByRole("button", { name: "See my lipstick matches" }).click();
  await page.waitForSelector("text=/lipstick matches/", { state: "visible" });
  await page.screenshot({ path: `${outDir}04-matches.png`, fullPage: true });

  await page.getByRole("button", { name: "Try the best match" }).click();
  await page.getByRole("button", { name: "Keep this shade", exact: true }).waitFor({ state: "visible" });
  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "Keep this shade",
      );
      return btn && !btn.disabled;
    },
  );
  await page.screenshot({ path: `${outDir}05-try-on.png`, fullPage: true });

  await page.getByRole("button", { name: "Keep this shade", exact: true }).click();
  await page.waitForSelector("text=/Your edit/", { state: "visible" });
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.waitForSelector("text=/prototype cart/", { state: "visible" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}06-result-cart.png`, fullPage: true });

  await page.close();
}

await browser.close();
console.log(`Screenshots saved to ${outDir}`);
