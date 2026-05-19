import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string;

const root = process.cwd();
const outDir = path.join(root, "docs", "videos");
const publicDir = path.join(root, "public", "videos");
const cacheDir = path.join(outDir, ".cache", "hero");
const htmlPath = path.join(cacheDir, "hero-reel.html");
const rawVideoPath = path.join(cacheDir, "hero-reel.webm");
const voicePath = path.join(cacheDir, "hero-voice.wav");
const outputPath = path.join(outDir, "highlight-reel-90s.mp4");
const publicOutputPath = path.join(publicDir, "highlight-reel-90s.mp4");
const posterPath = path.join(outDir, "highlight-poster.jpg");
const publicPosterPath = path.join(publicDir, "highlight-poster.jpg");
const vttPath = path.join(publicDir, "highlight-reel-90s.vtt");
const viewport = { width: 1280, height: 720 };
const durationSeconds = 86;

const narration = [
  "Veristake is a verification layer for licensed insurance carriers.",
  "Start with the problem: appealed Medicare Advantage denials were overturned 80.7 percent of the time in 2024.",
  "In the demo, a claimant submits an emergency room denial appeal without a wallet or crypto setup.",
  "The claim packet is structured, sourced, and ready for reviewer attention.",
  "Verifiers review the evidence, vote, and reputation weighted results resolve the claim.",
  "When the pool approves, payout releases from the carrier reserve.",
  "Carriers keep underwriting authority while Veristake provides an audit trail and shared verifier liquidity.",
  "The same flow handles auto disputes, partial payouts, and fraud patterns.",
  "Verifiers earn rewards for accurate review. Incorrect votes can be slashed when the evidence and supermajority are clear.",
  "The public dashboard reads the production grade Base Sepolia deployment: claims processed, resolution time, staked VST, carrier registrations, and slashing events.",
  "The demo sandbox moves fast for sales conversations, while the live dashboard stays read only and audit clean.",
  "Veristake: insurance claims, verified by economics."
].join(" ");

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function run(command: string, args: string[]) {
  await execFileAsync(command, args, { maxBuffer: 1024 * 1024 * 32 });
}

async function createVoiceover() {
  const script = `
Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Volume = 96
$voice.Rate = -1
try { $voice.SelectVoice('Microsoft Zira Desktop') } catch {}
$voice.SetOutputToWaveFile('${voicePath.replace(/'/g, "''")}')
$voice.Speak('${narration.replace(/'/g, "''")}')
$voice.Dispose()
`;
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  await run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded]);
}

function html() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1280px;
      height: 720px;
      overflow: hidden;
      background: #f6f8fb;
      color: #0b2545;
      font-family: Inter, Arial, sans-serif;
    }
    .frame {
      position: relative;
      width: 1280px;
      height: 720px;
      background:
        linear-gradient(120deg, rgba(11,37,69,0.06), rgba(20,184,166,0.08)),
        radial-gradient(circle at 84% 20%, rgba(20,184,166,0.16), transparent 24%),
        #f6f8fb;
    }
    .brand {
      position: absolute;
      left: 58px;
      top: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 20;
      font-weight: 750;
      letter-spacing: 0.04em;
      color: #0b2545;
    }
    .mark {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0b2545, #14b8a6);
      box-shadow: 0 12px 30px rgba(11,37,69,0.18);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      border: 1px solid rgba(11,37,69,0.14);
      border-radius: 999px;
      background: rgba(255,255,255,0.72);
      color: #334155;
      padding: 7px 12px;
      font-size: 14px;
      font-weight: 700;
    }
    .scene {
      position: absolute;
      inset: 0;
      padding: 96px 58px 54px;
      opacity: 0;
      transform: translateY(22px);
      animation: scene 86s linear forwards;
    }
    .scene:nth-of-type(1) { animation-delay: 0s; }
    .scene:nth-of-type(2) { animation-delay: 0s; }
    .scene:nth-of-type(3) { animation-delay: 0s; }
    .scene:nth-of-type(4) { animation-delay: 0s; }
    .scene:nth-of-type(5) { animation-delay: 0s; }
    .scene:nth-of-type(6) { animation-delay: 0s; }
    @keyframes scene {
      0%, 13.2% { opacity: 1; transform: translateY(0); }
      15%, 100% { opacity: 0; transform: translateY(-16px); }
    }
    .scene.s1 { animation-name: s1; }
    .scene.s2 { animation-name: s2; }
    .scene.s3 { animation-name: s3; }
    .scene.s4 { animation-name: s4; }
    .scene.s5 { animation-name: s5; }
    .scene.s6 { animation-name: s6; }
    @keyframes s1 { 0%, 15% { opacity: 1; transform: translateY(0); } 17%, 100% { opacity: 0; transform: translateY(-18px); } }
    @keyframes s2 { 0%, 15% { opacity: 0; transform: translateY(22px); } 17%, 31% { opacity: 1; transform: translateY(0); } 33%, 100% { opacity: 0; transform: translateY(-18px); } }
    @keyframes s3 { 0%, 31% { opacity: 0; transform: translateY(22px); } 33%, 47% { opacity: 1; transform: translateY(0); } 49%, 100% { opacity: 0; transform: translateY(-18px); } }
    @keyframes s4 { 0%, 47% { opacity: 0; transform: translateY(22px); } 49%, 63% { opacity: 1; transform: translateY(0); } 65%, 100% { opacity: 0; transform: translateY(-18px); } }
    @keyframes s5 { 0%, 63% { opacity: 0; transform: translateY(22px); } 65%, 80% { opacity: 1; transform: translateY(0); } 82%, 100% { opacity: 0; transform: translateY(-18px); } }
    @keyframes s6 { 0%, 80% { opacity: 0; transform: translateY(22px); } 82%, 100% { opacity: 1; transform: translateY(0); } }
    h1, h2 {
      margin: 0;
      max-width: 760px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 68px;
      line-height: 0.96;
      letter-spacing: 0;
      color: #0b2545;
    }
    h2 { font-size: 54px; line-height: 1; }
    p {
      margin: 20px 0 0;
      max-width: 720px;
      font-size: 25px;
      line-height: 1.36;
      color: #475569;
    }
    .grid {
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      gap: 36px;
      align-items: center;
      height: 100%;
    }
    .stat {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 146px;
      line-height: 0.88;
      color: #0b2545;
      font-weight: 700;
    }
    .source {
      margin-top: 22px;
      display: inline-flex;
      border-radius: 999px;
      background: #ffffff;
      border: 1px solid rgba(11,37,69,0.12);
      padding: 10px 14px;
      color: #334155;
      font-size: 15px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(11,37,69,0.08);
    }
    .panel {
      border: 1px solid rgba(11,37,69,0.12);
      border-radius: 18px;
      background: rgba(255,255,255,0.82);
      box-shadow: 0 26px 70px rgba(11,37,69,0.14);
      padding: 24px;
    }
    .claim-card {
      display: grid;
      gap: 13px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-radius: 13px;
      background: #f8fafc;
      padding: 16px;
      font-size: 18px;
      color: #334155;
    }
    .row strong { color: #0b2545; }
    .pill {
      border-radius: 999px;
      padding: 7px 12px;
      background: #e0f2fe;
      color: #075985;
      font-size: 14px;
      font-weight: 800;
    }
    .flow {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 34px;
    }
    .step {
      min-height: 150px;
      border-radius: 16px;
      background: #ffffff;
      border: 1px solid rgba(11,37,69,0.1);
      padding: 18px;
      box-shadow: 0 16px 44px rgba(11,37,69,0.09);
    }
    .step b {
      display: block;
      color: #0b2545;
      font-size: 20px;
      margin-bottom: 8px;
    }
    .step span {
      color: #64748b;
      font-size: 16px;
      line-height: 1.35;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .metric {
      min-height: 130px;
      border-radius: 16px;
      background: #ffffff;
      border: 1px solid rgba(11,37,69,0.1);
      padding: 20px;
      box-shadow: 0 16px 44px rgba(11,37,69,0.09);
    }
    .metric small {
      display: block;
      color: #64748b;
      font-size: 16px;
      font-weight: 700;
    }
    .metric strong {
      display: block;
      margin-top: 12px;
      color: #0b2545;
      font-size: 38px;
    }
    .signal {
      color: #0f766e;
      font-weight: 850;
    }
    .warning {
      color: #b45309;
      font-weight: 850;
    }
    .progress {
      position: absolute;
      left: 58px;
      right: 58px;
      bottom: 38px;
      height: 6px;
      border-radius: 999px;
      background: rgba(11,37,69,0.1);
      overflow: hidden;
    }
    .progress::before {
      content: "";
      display: block;
      height: 100%;
      width: 100%;
      transform-origin: left center;
      background: linear-gradient(90deg, #0b2545, #14b8a6);
      animation: progress 86s linear forwards;
    }
    @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  </style>
</head>
<body>
  <main class="frame">
    <div class="brand"><div class="mark"></div><span>VERISTAKE</span><span class="badge">Live testnet + demo sandbox</span></div>
    <section class="scene s1">
      <div class="grid">
        <div>
          <div class="stat">80.7%</div>
          <div class="source">KFF, Medicare Advantage prior authorization determinations</div>
          <p>Appealed denials are often overturned. Veristake gives carriers an economic verification layer for the claims that deserve another look.</p>
        </div>
        <div class="panel claim-card">
          <div class="row"><strong>Claim packet</strong><span class="pill">HEALTH</span></div>
          <div class="row"><span>ER chest pain denial</span><strong>$4,820</strong></div>
          <div class="row"><span>ICD-10 I20.0</span><span>Unstable angina evidence attached</span></div>
          <div class="row"><span>Wallet install</span><strong class="signal">Not required</strong></div>
        </div>
      </div>
    </section>
    <section class="scene s2">
      <h2>Submit once. Reviewers see the same evidence.</h2>
      <p>The claimant experience stays familiar: structured packet, plain-English status, and no crypto setup.</p>
      <div class="flow">
        <div class="step"><b>1. Claim submitted</b><span>Policy, denial reason, clinical notes, and payout request.</span></div>
        <div class="step"><b>2. Verifiers review</b><span>Credentialed reviewers enter the domain pool.</span></div>
        <div class="step"><b>3. Votes resolve</b><span>Reputation-weighted votes create an auditable outcome.</span></div>
        <div class="step"><b>4. Reserve pays</b><span>Payout releases from the carrier reserve when approved.</span></div>
      </div>
    </section>
    <section class="scene s3">
      <div class="grid">
        <div>
          <h2>Carriers keep authority.</h2>
          <p>Veristake plugs into the claims pipeline as a verification layer. The carrier still owns policies, reserves, and underwriting decisions.</p>
        </div>
        <div class="panel claim-card">
          <div class="row"><strong>Pacific Mutual</strong><span class="pill">AUTO</span></div>
          <div class="row"><span>Reserve funded</span><strong>$10,000</strong></div>
          <div class="row"><span>Rear-end collision dispute</span><strong>Partial payout</strong></div>
          <div class="row"><span>Audit trail</span><strong class="signal">On-chain</strong></div>
        </div>
      </div>
    </section>
    <section class="scene s4">
      <h2>Fraud pressure meets economic pressure.</h2>
      <p>Reviewer incentives are explicit: accurate review earns rewards; clear wrong-side votes can lose bond.</p>
      <div class="flow">
        <div class="step"><b>Routine physical</b><span class="signal">Approved</span></div>
        <div class="step"><b>ER denial appeal</b><span class="signal">Approved 4-1</span></div>
        <div class="step"><b>Duplicate PT billing</b><span class="warning">Denied as fraud</span></div>
        <div class="step"><b>Incorrect vote</b><span class="warning">50 VST slashed</span></div>
      </div>
    </section>
    <section class="scene s5">
      <h2>The dashboard is live testnet data.</h2>
      <p>Sales demos move fast in the sandbox. The public dashboard reads the production-grade Base Sepolia deployment.</p>
      <div class="metric-grid" style="margin-top: 32px;">
        <div class="metric"><small>Claims processed</small><strong>5</strong></div>
        <div class="metric"><small>Average resolution</small><strong>32 sec</strong></div>
        <div class="metric"><small>Verifier accuracy</small><strong>70.1%</strong></div>
        <div class="metric"><small>Total VST staked</small><strong>1,950</strong></div>
      </div>
    </section>
    <section class="scene s6">
      <div class="grid">
        <div>
          <h1>Insurance claims, verified by economics.</h1>
          <p>Bias-free adjudication on demand, verifier liquidity across carriers, and an audit trail that a carrier can diligence.</p>
        </div>
        <div class="panel claim-card">
          <div class="row"><span>Demo surface</span><strong>3 minutes</strong></div>
          <div class="row"><span>Production dashboard</span><strong class="signal">Read-only</strong></div>
          <div class="row"><span>Carrier risk</span><strong>Reserve-backed</strong></div>
          <div class="row"><span>Next step</span><strong>veristake.xyz/demo</strong></div>
        </div>
      </div>
    </section>
    <div class="progress"></div>
  </main>
</body>
</html>`;
}

async function recordVisuals() {
  await writeFile(htmlPath, html());
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: cacheDir, size: viewport }
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: posterPath, type: "jpeg", quality: 90 });
  await page.waitForTimeout((durationSeconds * 1000) - 1800);
  const video = page.video();
  await context.close();
  await browser.close();
  const recordedPath = await video?.path();
  if (!recordedPath) throw new Error("Playwright did not produce a hero video");
  await run(ffmpegPath, ["-y", "-i", recordedPath, "-c:v", "copy", rawVideoPath]);
}

async function mux() {
  await run(ffmpegPath, [
    "-y",
    "-i",
    rawVideoPath,
    "-i",
    voicePath,
    "-vf",
    "scale=1280:720,fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath
  ]);
}

async function writeCaptions() {
  const captions = `WEBVTT

00:00:00.000 --> 00:00:15.000
Veristake is a verification layer for licensed insurance carriers.

00:00:15.000 --> 00:00:29.000
A claimant submits a structured ER denial appeal without a wallet or crypto setup.

00:00:29.000 --> 00:00:43.000
Carriers keep underwriting authority while Veristake adds reserve-backed verification.

00:00:43.000 --> 00:00:56.000
Verifiers review evidence, catch fraud, and can lose bond for clear wrong-side votes.

00:00:56.000 --> 00:01:10.000
The public dashboard reads the production-grade Base Sepolia deployment.

00:01:10.000 --> 00:01:26.000
Veristake: insurance claims, verified by economics.
`;
  await writeFile(vttPath, captions);
}

async function main() {
  await mkdir(cacheDir, { recursive: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  await createVoiceover();
  await recordVisuals();
  await mux();
  await writeCaptions();
  await run(ffmpegPath, ["-y", "-i", posterPath, "-vf", "scale=1280:720", publicPosterPath]);
  await run(ffmpegPath, ["-y", "-i", outputPath, "-c", "copy", publicOutputPath]);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
