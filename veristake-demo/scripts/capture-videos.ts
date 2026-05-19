import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import { chromium, type Page } from "playwright";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const bundledFfmpegPath = require("ffmpeg-static") as string | null;
const baseUrl = process.env.VIDEO_BASE_URL || "http://127.0.0.1:3000";
const outDir = path.resolve(process.cwd(), "docs/videos");
const cacheDir = path.join(outDir, ".cache");
const viewport = { width: 1280, height: 720 };
const args = process.argv.slice(2);
const fontFileOption = "fontfile=/Windows/Fonts/arial.ttf";
let ffmpegCommand = "ffmpeg";

type Caption = {
  text: string;
  start: number;
  end: number;
};

type Scenario = {
  name: string;
  persona: "claimant" | "carrier" | "verifier";
  domain: "HEALTH" | "AUTO";
  durationSeconds: number;
  captions: Caption[];
  run(page: Page): Promise<void>;
};

const claimantCaptions: Caption[] = [
  { start: 0, end: 9, text: "A denied ER visit becomes a structured appeal packet." },
  { start: 9, end: 20, text: "The claimant submits without installing a wallet." },
  { start: 20, end: 34, text: "Verifier review opens in the demo sandbox." },
  { start: 34, end: 48, text: "Votes stream in with reputation context." },
  { start: 48, end: 63, text: "The pool approves the appeal 4-1." },
  { start: 63, end: 75, text: "Carrier reserve releases the payout." }
];

const carrierCaptions: Caption[] = [
  { start: 0, end: 9, text: "Pacific Mutual starts from carrier onboarding." },
  { start: 9, end: 22, text: "The auto-collision policy is registered." },
  { start: 22, end: 35, text: "A $10k reserve is funded in the sandbox." },
  { start: 35, end: 50, text: "Three claims resolve from the carrier reserve." },
  { start: 50, end: 60, text: "Manual adjudication compresses from weeks to minutes." }
];

const verifierCaptions: Caption[] = [
  { start: 0, end: 10, text: "A medical-billing reviewer joins the HEALTH pool." },
  { start: 10, end: 25, text: "Three claims arrive: routine, emergency, and fraud." },
  { start: 25, end: 42, text: "The reviewer votes on the evidence." },
  { start: 42, end: 58, text: "The duplicate-billing fraud pattern is caught." },
  { start: 58, end: 75, text: "Rewards, accuracy, and reputation update instantly." }
];

async function ensureFfmpeg() {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
  } catch {
    if (!bundledFfmpegPath) {
      throw new Error("ffmpeg is required to convert Playwright WebM recordings to MP4/GIF.");
    }
    ffmpegCommand = bundledFfmpegPath;
    await execFileAsync(ffmpegCommand, ["-version"]);
  }
}

async function removeIfExists(file: string) {
  if (existsSync(file)) await unlink(file);
}

function ffmpegText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function captionFilter(captions: Caption[]) {
  const filters = captions.map((caption) => {
    const options = [
      `text='${ffmpegText(caption.text)}'`,
      fontFileOption,
      "fontsize=28",
      "fontcolor=white",
      "box=1",
      "boxcolor=black@0.58",
      "boxborderw=18",
      "x=(w-text_w)/2",
      "y=h-86",
      `enable=between(t\\,${caption.start}\\,${caption.end})`
    ].join(":");
    return `drawtext=${options}`;
  });
  return ["scale=1280:720", ...filters].join(",");
}

async function runFfmpeg(args: string[]) {
  await execFileAsync(ffmpegCommand, ["-y", ...args], { maxBuffer: 1024 * 1024 * 8 });
}

async function seed(page: Page, persona: Scenario["persona"], domain: Scenario["domain"]) {
  const response = await page.request.post(`${baseUrl}/api/seed-claim`, {
    data: { persona, domain, walletAddress: "0x000000000000000000000000000000000000d001" }
  });
  if (!response.ok()) {
    throw new Error(`Unable to seed ${persona}/${domain}: ${response.status()} ${await response.text()}`);
  }
}

async function guard(page: Page) {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() === 404) failures.push(`404: ${response.url()}`);
  });
  return () => {
    if (failures.length) throw new Error(failures.join("\n"));
  };
}

async function wait(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}

const scenarios: Scenario[] = [
  {
    name: "claimant-health-er-appeal",
    persona: "claimant",
    domain: "HEALTH",
    durationSeconds: 75,
    captions: claimantCaptions,
    async run(page) {
      await page.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
      await page.getByRole("link", { name: /Start/i }).nth(1).click();
      await page.waitForLoadState("networkidle");
      await wait(page, 2500);
      await page.getByRole("button", { name: /Review packet/i }).click();
      await wait(page, 4000);
      await page.getByRole("button", { name: /Submit appeal/i }).click();
      await page.waitForLoadState("networkidle");
      await wait(page, 68_000);
    }
  },
  {
    name: "carrier-pacific-mutual",
    persona: "carrier",
    domain: "AUTO",
    durationSeconds: 60,
    captions: carrierCaptions,
    async run(page) {
      await page.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
      await page.getByRole("link", { name: /Start/i }).nth(0).click();
      await page.waitForLoadState("networkidle");
      await wait(page, 2500);
      await page.getByRole("button", { name: /Register Pacific Mutual/i }).click();
      await page.waitForLoadState("networkidle");
      await wait(page, 6500);
      await page.getByRole("button", { name: /Register auto-collision policy/i }).click();
      await wait(page, 48_000);
    }
  },
  {
    name: "verifier-three-claims-one-fraud",
    persona: "verifier",
    domain: "HEALTH",
    durationSeconds: 75,
    captions: verifierCaptions,
    async run(page) {
      await page.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
      await page.getByRole("link", { name: /Start/i }).nth(2).click();
      await page.waitForLoadState("networkidle");
      await wait(page, 2500);
      await page.getByRole("button", { name: /Stake 100 VST/i }).click();
      await wait(page, 5000);
      const approveButtons = page.getByRole("button", { name: "APPROVE" });
      const denyButtons = page.getByRole("button", { name: "DENY" });
      await approveButtons.nth(0).click();
      await wait(page, 3000);
      await approveButtons.nth(1).click();
      await wait(page, 3000);
      await denyButtons.nth(2).click();
      await wait(page, 3500);
      await page.getByRole("button", { name: /Show outcome/i }).click();
      await wait(page, 57_000);
    }
  }
];

async function recordScenario(scenario: Scenario) {
  await mkdir(cacheDir, { recursive: true });
  const mp4Path = path.join(outDir, `${scenario.name}.mp4`);
  await removeIfExists(mp4Path);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: cacheDir, size: viewport }
  });
  const page = await context.newPage();
  const assertClean = await guard(page);

  await seed(page, scenario.persona, scenario.domain);
  await scenario.run(page);
  assertClean();

  const video = page.video();
  await context.close();
  await browser.close();
  const webmPath = await video?.path();
  if (!webmPath) throw new Error(`Playwright did not produce video for ${scenario.name}`);

  await runFfmpeg([
    "-i",
    webmPath,
    "-vf",
    captionFilter(scenario.captions),
    "-t",
    String(scenario.durationSeconds),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-an",
    mp4Path
  ]);

  return mp4Path;
}

async function makeCard(output: string, seconds: number, text: string, subtext?: string) {
  const hero = path.resolve(process.cwd(), "docs/screenshots/landing-hero.png");
  const input = existsSync(hero) ? ["-loop", "1", "-i", hero] : ["-f", "lavfi", "-i", "color=c=0f172a:s=1280x720"];
  const overlay = [
    "scale=1280:720",
    "drawbox=x=0:y=0:w=1280:h=720:color=black@0.45:t=fill",
    `drawtext=text='${ffmpegText(text)}':${fontFileOption}:fontsize=46:fontcolor=white:x=(w-text_w)/2:y=285`,
    subtext
      ? `drawtext=text='${ffmpegText(subtext)}':${fontFileOption}:fontsize=28:fontcolor=white:x=(w-text_w)/2:y=350`
      : ""
  ]
    .filter(Boolean)
    .join(",");
  await runFfmpeg([
    ...input,
    "-t",
    String(seconds),
    "-vf",
    overlay,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-an",
    output
  ]);
}

async function cutSegment(input: string, output: string, start: number, duration: number) {
  await runFfmpeg([
    "-ss",
    String(start),
    "-t",
    String(duration),
    "-i",
    input,
    "-vf",
    "scale=1280:720,setpts=PTS-STARTPTS",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-an",
    output
  ]);
}

async function makeHighlightReel() {
  const intro = path.join(cacheDir, "intro.mp4");
  const outro = path.join(cacheDir, "outro.mp4");
  const claimant = path.join(cacheDir, "claimant-segment.mp4");
  const carrier = path.join(cacheDir, "carrier-segment.mp4");
  const verifier = path.join(cacheDir, "verifier-segment.mp4");
  const list = path.join(cacheDir, "highlight-list.txt");
  const highlight = path.join(outDir, "highlight-reel-90s.mp4");
  const gif = path.join(outDir, "highlight-reel-30s.gif");

  await makeCard(
    intro,
    8,
    process.env.INTRO_CARD_COPY || "Veristake.",
    process.env.INTRO_CARD_SUBCOPY || "Insurance claims, verified by economics."
  );
  await cutSegment(path.join(outDir, "claimant-health-er-appeal.mp4"), claimant, 6, 27);
  await cutSegment(path.join(outDir, "carrier-pacific-mutual.mp4"), carrier, 4, 30);
  await cutSegment(path.join(outDir, "verifier-three-claims-one-fraud.mp4"), verifier, 16, 20);
  await makeCard(
    outro,
    5,
    process.env.OUTRO_CARD_COPY || "veristake.xyz/demo",
    process.env.OUTRO_CARD_SUBCOPY || "Book a 20-minute integration call"
  );

  await writeFile(
    list,
    [intro, claimant, carrier, verifier, outro].map((file) => `file '${file.replace(/\\/g, "/")}'`).join("\n")
  );
  await runFfmpeg([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    list,
    "-t",
    "90",
    "-c",
    "copy",
    highlight
  ]);

  await runFfmpeg([
    "-i",
    highlight,
    "-t",
    "30",
    "-vf",
    "fps=12,scale=600:-1:flags=lanczos",
    "-loop",
    "0",
    gif
  ]);
}

async function reportSizes() {
  const files = (await readdir(outDir)).filter((file) => file.endsWith(".mp4") || file.endsWith(".gif"));
  const rows = await Promise.all(
    files.map(async (file) => {
      const info = await stat(path.join(outDir, file));
      return `${file}: ${(info.size / 1024 / 1024).toFixed(2)} MB`;
    })
  );
  console.log(rows.join("\n"));
}

async function main() {
  await ensureFfmpeg();
  await mkdir(outDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });

  const scenarioIndex = args.indexOf("--scenario");
  const selectedName = scenarioIndex >= 0 ? args[scenarioIndex + 1] : undefined;
  const highlightOnly = args.includes("--highlight-only");
  const selected = selectedName ? scenarios.filter((scenario) => scenario.name === selectedName) : scenarios;

  if (selectedName && selected.length === 0) {
    throw new Error(`Unknown scenario "${selectedName}". Valid scenarios: ${scenarios.map((scenario) => scenario.name).join(", ")}`);
  }

  if (!highlightOnly) {
    for (const scenario of selected) {
      console.log(`Recording ${scenario.name}...`);
      await recordScenario(scenario);
    }
  }

  console.log("Building highlight reel and outreach GIF...");
  await makeHighlightReel();
  await reportSizes();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
