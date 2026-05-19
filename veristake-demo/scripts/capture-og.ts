import { chromium } from "playwright";
import path from "node:path";

const baseUrl = process.env.CAPTURE_BASE_URL || "http://127.0.0.1:3000";
const output = path.join(process.cwd(), "public", "og.png");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/og-card`, { waitUntil: "networkidle" });
  await page.screenshot({ path: output, fullPage: false });
  await browser.close();
  console.log(`OG image captured: ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
