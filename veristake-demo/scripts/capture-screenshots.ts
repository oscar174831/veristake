import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000";
const outDir = path.resolve(process.cwd(), "docs/screenshots");

async function snap(page: Page, name: string) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await snap(page, "landing-hero");

  await page.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await snap(page, "demo-hub");

  await page.goto(`${baseUrl}/demo/carrier`, { waitUntil: "networkidle" });
  await snap(page, "carrier-step-1");
  await page.getByRole("button", { name: /Register Pacific Mutual/i }).click();
  await page.waitForLoadState("networkidle");
  await snap(page, "carrier-step-2");
  await page.getByRole("button", { name: /Register auto-collision policy/i }).click();
  await snap(page, "carrier-step-3");

  await page.goto(`${baseUrl}/demo/claimant`, { waitUntil: "networkidle" });
  await snap(page, "claimant-step-1");
  await page.getByRole("button", { name: /Review packet/i }).click();
  await snap(page, "claimant-step-2");
  await page.getByRole("button", { name: /Submit appeal/i }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await snap(page, "claimant-step-3");

  await page.goto(`${baseUrl}/demo/verifier`, { waitUntil: "networkidle" });
  await snap(page, "verifier-step-1");
  await page.getByRole("button", { name: /Stake 100 VST/i }).click();
  await snap(page, "verifier-step-2");
  const approveButtons = page.getByRole("button", { name: "APPROVE" });
  const denyButtons = page.getByRole("button", { name: "DENY" });
  await approveButtons.nth(0).click();
  await approveButtons.nth(1).click();
  await denyButtons.nth(2).click();
  await page.getByRole("button", { name: /Show outcome/i }).click();
  await snap(page, "verifier-step-3");

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await snap(page, "dashboard");

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await snap(page, "landing-mobile");
  await page.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await snap(page, "demo-hub-mobile");
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await snap(page, "dashboard-mobile");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
