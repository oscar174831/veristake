import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
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
const narrationTextPath = path.join(cacheDir, "hero-narration.txt");
const voicePath = path.join(cacheDir, "hero-voice.wav");
const neuralVoicePath = path.join(cacheDir, "hero-voice-neural.mp3");
const outputPath = path.join(outDir, "highlight-reel-90s.mp4");
const webmOutputPath = path.join(outDir, "highlight-reel-90s.webm");
const publicOutputPath = path.join(publicDir, "highlight-reel-90s.mp4");
const publicWebmOutputPath = path.join(publicDir, "highlight-reel-90s.webm");
const posterPath = path.join(outDir, "highlight-poster.jpg");
const publicPosterPath = path.join(publicDir, "highlight-poster.jpg");
const staleCaptionPath = path.join(publicDir, "highlight-reel-90s.vtt");
const viewport = { width: 1280, height: 720 };

const narrationSegments = [
  "Veristake starts with a boundary. It is not for every insurance claim.",
  "Routine claims stay in the carrier's system. Veristake is for disputed claims: denied appeals, delayed payouts, complex evidence, and fraud-sensitive cases.",
  "A claimant or carrier submits a structured packet: denial reason, policy context, evidence, and requested outcome.",
  "Credentialed reviewers evaluate the packet. This is not raw majority voting.",
  "Influence depends on credentials, case fit, reputation, historical accuracy, and capital at risk.",
  "Economics make reckless review costly, but evidence standards, appeals, and arbiter correction protect against herd mentality.",
  "A correct minority can be rewarded; a careless majority can be corrected.",
  "The short-term wedge is claimant appeal preparation. The long-term business is carrier integration: an independent verification layer while carriers keep policies, reserves, and compliance.",
  "The dashboard reads a real Base Sepolia deployment; the sandbox lets visitors try the flow without a wallet.",
  "Veristake: disputed claims, reviewed by expertise, constrained by economics, and made auditable by software."
];

const narration = narrationSegments.join(" ");

type Scene = {
  badge: string;
  title: string;
  body: string;
  visual: string;
  weight: number;
};

const scenes: Scene[] = [
  {
    badge: "Focused wedge",
    title: "Not every claim. The disputed ones.",
    body: "Routine claims stay in the carrier system. Veristake activates when a denial, payout dispute, complex packet, or fraud signal needs independent review.",
    weight: 1.15,
    visual: `
      <div class="route-card">
        <div class="route muted"><span>Routine claim</span><b>Carrier workflow</b></div>
        <div class="route active"><span>Denied appeal</span><b>Veristake review</b></div>
        <div class="route active"><span>Fraud signal</span><b>Verifier pool</b></div>
        <div class="route muted"><span>Simple payout</span><b>Carrier workflow</b></div>
      </div>`
  },
  {
    badge: "Claim packet",
    title: "Evidence first, not crypto first.",
    body: "A claimant or carrier submits the denial reason, policy context, medical or auto evidence, requested payout, and supporting documents.",
    weight: 1,
    visual: `
      <div class="packet">
        <div><small>HEALTH</small><strong>ER denial appeal</strong><span>ICD-10 I20.0 · CPT 99285</span></div>
        <div><small>AUTO</small><strong>Rear-end collision dispute</strong><span>Police report · photos · repair estimate</span></div>
        <div><small>STATUS</small><strong>No wallet needed</strong><span>Guided demo · plain-English state</span></div>
      </div>`
  },
  {
    badge: "Expert network",
    title: "This is not raw majority voting.",
    body: "Verifier influence should reflect credentials, case fit, historical accuracy, reputation, and capital at risk.",
    weight: 1.12,
    visual: `
      <div class="weights">
        <div style="--w: 92%"><span>Domain credential</span><b>92</b></div>
        <div style="--w: 84%"><span>Historical accuracy</span><b>84</b></div>
        <div style="--w: 76%"><span>Case fit</span><b>76</b></div>
        <div style="--w: 68%"><span>Stake at risk</span><b>68</b></div>
      </div>`
  },
  {
    badge: "Anti-herd design",
    title: "Economics constrain behavior. Evidence decides outcomes.",
    body: "Stake and slashing make reckless review costly. Appeals, arbiter correction, and contrarian rewards keep the system from blindly following the crowd.",
    weight: 1.22,
    visual: `
      <div class="decision">
        <div class="vote yes">Approve</div>
        <div class="vote no">Deny</div>
        <div class="vote partial">Partial</div>
        <div class="arbiter">Correct minority preserved · careless majority corrected</div>
      </div>`
  },
  {
    badge: "Two wedges",
    title: "Claimants teach the system. Carriers scale it.",
    body: "A claimant-side appeal assistant can create early traction. The long-term business is a carrier-facing verification layer for disputed health and auto claims.",
    weight: 1.2,
    visual: `
      <div class="split">
        <div>
          <small>Wedge 1</small>
          <strong>Appeal packet builder</strong>
          <span>Denied claim → evidence checklist → dispute reasoning</span>
        </div>
        <div>
          <small>Wedge 2</small>
          <strong>Carrier verification layer</strong>
          <span>Dispute queue → verifier network → auditable outcome</span>
        </div>
      </div>`
  },
  {
    badge: "Carrier-safe",
    title: "The insurer stays the insurer.",
    body: "Carriers keep policies, underwriting authority, reserves, compliance obligations, and customer relationships. Veristake supplies the accountable review layer.",
    weight: 1,
    visual: `
      <div class="carrier">
        <div><span>Policies</span><b>Carrier-owned</b></div>
        <div><span>Reserve</span><b>Carrier-funded</b></div>
        <div><span>Review</span><b>Verifier network</b></div>
        <div><span>Audit trail</span><b>Software layer</b></div>
      </div>`
  },
  {
    badge: "Live proof",
    title: "A demo people can understand in minutes.",
    body: "The dashboard reads a production-grade Base Sepolia deployment. The sandbox moves quickly so visitors can experience the flow without wallet setup.",
    weight: 1.05,
    visual: `
      <div class="metrics">
        <div><small>Claims processed</small><strong>5</strong></div>
        <div><small>Verifier accuracy</small><strong>70.1%</strong></div>
        <div><small>VST staked</small><strong>1,950</strong></div>
        <div><small>Carrier integrations</small><strong>2</strong></div>
      </div>`
  },
  {
    badge: "Veristake",
    title: "Disputed claims, verified by expertise and economics.",
    body: "A practical accountability layer for high-friction insurance decisions.",
    weight: 0.82,
    visual: `
      <div class="closing-card">
        <strong>veristake-demo.vercel.app</strong>
        <span>Whitepaper · Demo · Live dashboard</span>
      </div>`
  }
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value: string) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

async function run(command: string, args: string[]) {
  await execFileAsync(command, args, { maxBuffer: 1024 * 1024 * 64 });
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function createSapiVoiceover() {
  const fallbackVoice = process.env.HERO_SAPI_VOICE || "Microsoft Zira Desktop";
  const ssml = `<?xml version="1.0"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${escapeXml(fallbackVoice)}">
    <prosody rate="-6%">
      ${escapeXml(narration)}
    </prosody>
  </voice>
</speak>`;
  const script = `
Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Volume = 100
try { $voice.SelectVoice('${fallbackVoice.replace(/'/g, "''")}') } catch {}
$voice.SetOutputToWaveFile('${voicePath.replace(/'/g, "''")}')
$voice.SpeakSsml('${ssml.replace(/'/g, "''")}')
$voice.Dispose()
`;
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  await run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded]);
  return voicePath;
}

async function createVoiceover() {
  const founderVoiceover = process.env.HERO_VOICEOVER_PATH || path.join(outDir, "voiceover.wav");
  if (existsSync(founderVoiceover)) {
    console.log(`Using founder voiceover: ${founderVoiceover}`);
    return founderVoiceover;
  }

  await writeFile(narrationTextPath, narration);
  const python = process.env.PYTHON || "python";
  const voice = process.env.HERO_TTS_VOICE || "en-US-AvaMultilingualNeural";
  let lastError: unknown;

  async function synthesizeSegment(text: string, index: number) {
    const segmentTextPath = path.join(cacheDir, `hero-voice-segment-${String(index).padStart(2, "0")}.txt`);
    const segmentAudioPath = path.join(cacheDir, `hero-voice-segment-${String(index).padStart(2, "0")}.mp3`);
    await writeFile(segmentTextPath, text);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        await rm(segmentAudioPath, { force: true });
        await run(python, [
          "-m",
          "edge_tts",
          "--file",
          segmentTextPath,
          "--voice",
          voice,
          "--rate=+4%",
          "--pitch=+0Hz",
          "--write-media",
          segmentAudioPath
        ]);
        return segmentAudioPath;
      } catch (error) {
        lastError = error;
        console.warn(`Neural Edge TTS segment ${index + 1}, attempt ${attempt} failed.`);
        if (attempt < 4) await delay(1200 * attempt);
      }
    }
    throw lastError;
  }

  try {
    await rm(neuralVoicePath, { force: true });
    const segmentPaths = [];
    for (let index = 0; index < narrationSegments.length; index += 1) {
      segmentPaths.push(await synthesizeSegment(narrationSegments[index], index));
    }
    const concatPath = path.join(cacheDir, "hero-voice-concat.txt");
    await writeFile(
      concatPath,
      segmentPaths
        .map((segmentPath) => `file '${segmentPath.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
        .join("\n")
    );
    await run(ffmpegPath, ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", neuralVoicePath]);
    console.log(`Using neural Edge TTS voice: ${voice}`);
    return neuralVoicePath;
  } catch (error) {
    lastError = error;
    console.warn("Neural Edge TTS failed while building segmented voiceover.");
    if (process.env.HERO_SINGLE_TTS_FALLBACK === "1") {
      console.warn("Trying one-shot neural TTS fallback.");
      await run(python, [
        "-m",
        "edge_tts",
        "--file",
        narrationTextPath,
        "--voice",
        voice,
        "--rate=+4%",
        "--pitch=+0Hz",
        "--write-media",
        neuralVoicePath
      ]);
      console.log(`Using neural Edge TTS voice: ${voice}`);
      return neuralVoicePath;
    }
  }

  if (process.env.HERO_ALLOW_SAPI_FALLBACK === "1") {
    console.warn("Neural Edge TTS unavailable; falling back to local Windows SAPI voice.");
    console.warn(lastError instanceof Error ? lastError.message : String(lastError));
    return createSapiVoiceover();
  }

  throw new Error(
    "Neural TTS failed after 4 attempts. Set HERO_ALLOW_SAPI_FALLBACK=1 only if you explicitly want the lower-quality Windows voice."
  );
}

async function getMediaDuration(filePath: string) {
  try {
    await execFileAsync(ffmpegPath, ["-hide_banner", "-i", filePath], { maxBuffer: 1024 * 1024 * 4 });
  } catch (error) {
    const output = `${(error as { stdout?: string }).stdout || ""}\n${(error as { stderr?: string }).stderr || ""}`;
    const match = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (match) {
      return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
    }
  }
  return 86;
}

function sceneKeyframes(totalSeconds: number) {
  const totalWeight = scenes.reduce((sum, scene) => sum + scene.weight, 0);
  let cursor = 0;
  return scenes
    .map((scene, index) => {
      const start = (cursor / totalWeight) * 100;
      cursor += scene.weight;
      const end = (cursor / totalWeight) * 100;
      const fade = Math.min(1.6, Math.max(0.8, totalSeconds * 0.012));
      const fadePct = (fade / totalSeconds) * 100;
      const startIn = Math.min(start + fadePct, end);
      const endOut = Math.max(end - fadePct, startIn);
      const finalEnd = index === scenes.length - 1 ? 100 : end;
      const afterEnd = Math.min(100, finalEnd + 0.01);
      return `.scene-${index} { animation: scene-${index} ${totalSeconds}s linear forwards; }
@keyframes scene-${index} {
  0%, ${start.toFixed(3)}% { opacity: 0; transform: translateY(18px) scale(0.985); }
  ${startIn.toFixed(3)}%, ${endOut.toFixed(3)}% { opacity: 1; transform: translateY(0) scale(1); }
  ${finalEnd.toFixed(3)}%, 100% { opacity: ${index === scenes.length - 1 ? 1 : 0}; transform: translateY(${index === scenes.length - 1 ? 0 : -14}px) scale(${index === scenes.length - 1 ? 1 : 0.99}); }
  ${afterEnd.toFixed(3)}% { opacity: ${index === scenes.length - 1 ? 1 : 0}; }
}`;
    })
    .join("\n");
}

function html(totalSeconds: number) {
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
      background: #f8fafc;
      color: #0b2545;
      font-family: Inter, Arial, sans-serif;
    }
    .frame {
      position: relative;
      width: 1280px;
      height: 720px;
      overflow: hidden;
      background:
        linear-gradient(120deg, rgba(248,250,252,0.96), rgba(239,246,255,0.92)),
        radial-gradient(circle at 84% 18%, rgba(20,184,166,0.15), transparent 28%),
        radial-gradient(circle at 18% 92%, rgba(11,37,69,0.08), transparent 32%);
    }
    .frame::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(11,37,69,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(11,37,69,0.035) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: linear-gradient(to bottom, transparent, black 16%, black 78%, transparent);
      pointer-events: none;
    }
    .brand {
      position: absolute;
      left: 58px;
      right: 58px;
      top: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 20;
      font-weight: 800;
      color: #0b2545;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: 0.04em;
    }
    .mark {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: linear-gradient(135deg, #0b2545, #14b8a6);
      box-shadow: 0 16px 34px rgba(11,37,69,0.16);
    }
    .topline {
      border-radius: 999px;
      background: rgba(255,255,255,0.76);
      border: 1px solid rgba(11,37,69,0.12);
      padding: 8px 13px;
      color: #475569;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(11,37,69,0.08);
    }
    .scene {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: 0.92fr 1.08fr;
      gap: 44px;
      align-items: center;
      padding: 92px 58px 64px;
      opacity: 0;
      z-index: 5;
    }
    ${sceneKeyframes(totalSeconds)}
    .copy { position: relative; z-index: 8; }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #dff7f4;
      color: #0f766e;
      padding: 8px 13px;
      font-size: 14px;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    h1 {
      margin: 18px 0 0;
      max-width: 610px;
      color: #0b2545;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 58px;
      line-height: 0.98;
      letter-spacing: 0;
    }
    p {
      margin: 22px 0 0;
      max-width: 590px;
      color: #475569;
      font-size: 23px;
      line-height: 1.36;
    }
    .visual {
      position: relative;
      z-index: 8;
      min-height: 430px;
      border-radius: 24px;
      background: rgba(255,255,255,0.82);
      border: 1px solid rgba(11,37,69,0.12);
      box-shadow: 0 28px 80px rgba(11,37,69,0.15);
      padding: 28px;
      display: flex;
      align-items: stretch;
      justify-content: center;
      overflow: hidden;
    }
    .visual::before {
      content: "";
      position: absolute;
      inset: -40%;
      background: conic-gradient(from 120deg, transparent, rgba(20,184,166,0.1), transparent, rgba(11,37,69,0.08), transparent);
      animation: slow-spin 16s linear infinite;
    }
    .visual > * { position: relative; z-index: 2; width: 100%; }
    @keyframes slow-spin { to { transform: rotate(1turn); } }
    .route-card, .packet, .weights, .decision, .split, .carrier, .metrics {
      display: grid;
      gap: 14px;
      align-content: center;
    }
    .route, .packet div, .carrier div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid rgba(11,37,69,0.08);
      padding: 18px;
      color: #475569;
      font-size: 18px;
    }
    .route.active { background: #ecfdf5; border-color: rgba(15,118,110,0.2); }
    .route b, .carrier b { color: #0b2545; font-size: 19px; }
    .route.active b { color: #0f766e; }
    .packet div {
      display: block;
      padding: 20px;
    }
    small {
      display: block;
      color: #64748b;
      font-size: 13px;
      font-weight: 850;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .packet strong, .split strong, .closing-card strong {
      display: block;
      margin-top: 7px;
      color: #0b2545;
      font-size: 25px;
    }
    .packet span, .split span, .closing-card span {
      display: block;
      margin-top: 7px;
      color: #64748b;
      font-size: 17px;
      line-height: 1.35;
    }
    .weights div {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid rgba(11,37,69,0.08);
      padding: 18px;
    }
    .weights div::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: var(--w);
      background: linear-gradient(90deg, rgba(20,184,166,0.26), rgba(20,184,166,0.07));
    }
    .weights span, .weights b {
      position: relative;
      z-index: 2;
      font-size: 18px;
      color: #334155;
    }
    .weights b {
      float: right;
      color: #0f766e;
      font-size: 22px;
    }
    .decision {
      grid-template-columns: repeat(3, 1fr);
      align-content: center;
    }
    .vote {
      min-height: 150px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      font-size: 27px;
      font-weight: 900;
      color: #0b2545;
      background: #f8fafc;
      border: 1px solid rgba(11,37,69,0.1);
    }
    .vote.yes { background: #ecfdf5; color: #0f766e; }
    .vote.no { background: #fff7ed; color: #b45309; }
    .vote.partial { background: #eff6ff; color: #1d4ed8; }
    .arbiter {
      grid-column: 1 / -1;
      border-radius: 18px;
      background: #0b2545;
      color: white;
      padding: 22px;
      font-size: 22px;
      font-weight: 850;
      text-align: center;
    }
    .split {
      grid-template-columns: 1fr 1fr;
    }
    .split div {
      min-height: 260px;
      border-radius: 20px;
      background: #f8fafc;
      border: 1px solid rgba(11,37,69,0.08);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .metrics {
      grid-template-columns: repeat(2, 1fr);
    }
    .metrics div {
      min-height: 155px;
      border-radius: 18px;
      background: #f8fafc;
      border: 1px solid rgba(11,37,69,0.08);
      padding: 22px;
    }
    .metrics strong {
      display: block;
      margin-top: 16px;
      color: #0f766e;
      font-size: 44px;
    }
    .closing-card {
      display: grid;
      place-content: center;
      text-align: center;
    }
    .closing-card strong { font-size: 34px; }
    .progress {
      position: absolute;
      left: 58px;
      right: 58px;
      bottom: 36px;
      height: 6px;
      border-radius: 999px;
      background: rgba(11,37,69,0.1);
      overflow: hidden;
      z-index: 30;
    }
    .progress::before {
      content: "";
      display: block;
      height: 100%;
      width: 100%;
      transform-origin: left center;
      background: linear-gradient(90deg, #0b2545, #14b8a6);
      animation: progress ${totalSeconds}s linear forwards;
    }
    @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  </style>
</head>
<body>
  <main class="frame">
    <div class="brand">
      <div class="brand-left"><div class="mark"></div><span>VERISTAKE</span></div>
      <div class="topline">Disputed-claim verification · Health + Auto</div>
    </div>
    ${scenes
      .map(
        (scene, index) => `
      <section class="scene scene-${index}">
        <div class="copy">
          <div class="badge">${escapeHtml(scene.badge)}</div>
          <h1>${escapeHtml(scene.title)}</h1>
          <p>${escapeHtml(scene.body)}</p>
        </div>
        <div class="visual">${scene.visual}</div>
      </section>`
      )
      .join("\n")}
    <div class="progress"></div>
  </main>
</body>
</html>`;
}

async function recordVisuals(totalSeconds: number) {
  await writeFile(htmlPath, html(totalSeconds));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: cacheDir, size: viewport }
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForTimeout(900);
  await page.screenshot({ path: posterPath, type: "jpeg", quality: 92 });
  await page.waitForTimeout(Math.ceil(totalSeconds * 1000) - 900);
  const video = page.video();
  await context.close();
  await browser.close();
  const recordedPath = await video?.path();
  if (!recordedPath) throw new Error("Playwright did not produce a hero video");
  await run(ffmpegPath, ["-y", "-i", recordedPath, "-c:v", "copy", rawVideoPath]);
}

async function mux(audioPath: string) {
  await run(ffmpegPath, [
    "-y",
    "-i",
    rawVideoPath,
    "-i",
    audioPath,
    "-vf",
    "scale=1280:720,fps=30,format=yuv420p",
    "-filter:a",
    "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000",
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-level",
    "4.0",
    "-preset",
    "medium",
    "-crf",
    "22",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath
  ]);

  await run(ffmpegPath, [
    "-y",
    "-i",
    outputPath,
    "-vf",
    "scale=1280:720,fps=30,format=yuv420p",
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "34",
    "-c:a",
    "libopus",
    "-b:a",
    "96k",
    webmOutputPath
  ]);
}

async function copyPublicAssets() {
  await run(ffmpegPath, ["-y", "-i", posterPath, "-vf", "scale=1280:720", publicPosterPath]);
  await run(ffmpegPath, ["-y", "-i", outputPath, "-c", "copy", publicOutputPath]);
  await run(ffmpegPath, ["-y", "-i", webmOutputPath, "-c", "copy", publicWebmOutputPath]);
  if (existsSync(staleCaptionPath)) {
    await rm(staleCaptionPath, { force: true });
  }
}

async function main() {
  await mkdir(cacheDir, { recursive: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  const audioPath = await createVoiceover();
  const audioDuration = await getMediaDuration(audioPath);
  const totalSeconds = Math.max(72, Math.ceil(audioDuration + 2));
  console.log(`Audio duration: ${audioDuration.toFixed(1)}s; visual duration: ${totalSeconds}s`);
  await recordVisuals(totalSeconds);
  await mux(audioPath);
  await copyPublicAssets();
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
