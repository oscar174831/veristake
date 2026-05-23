import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
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
const webVoicePath = path.join(cacheDir, "hero-voice-web.mp3");
const musicPath = path.join(cacheDir, "hero-music.wav");
const outputPath = path.join(outDir, "highlight-reel-90s.mp4");
const webmOutputPath = path.join(outDir, "highlight-reel-90s.webm");
const publicOutputPath = path.join(publicDir, "highlight-reel-90s.mp4");
const publicWebmOutputPath = path.join(publicDir, "highlight-reel-90s.webm");
const posterPath = path.join(outDir, "highlight-poster.jpg");
const publicPosterPath = path.join(publicDir, "highlight-poster.jpg");
const staleCaptionPath = path.join(publicDir, "highlight-reel-90s.vtt");
const viewport = { width: 1280, height: 720 };

const narrationSegments = [
  "Veristake has one wedge: carrier-routed disputed claims.",
  "Routine claims stay in the carrier's system. Veristake activates when a carrier sends a denial appeal, delayed payout, complex evidence packet, or fraud signal for independent review.",
  "The carrier keeps the policy, the reserve, the customer relationship, and compliance authority. Veristake supplies the accountable verification layer.",
  "A configured intake flow turns each dispute into a structured packet: denial reason, policy context, evidence, requested outcome, and audit trail.",
  "Credentialed reviewers evaluate the packet. This is not raw majority voting.",
  "Influence depends on credentials, case fit, reputation, historical accuracy, and capital at risk.",
  "Economics make reckless review costly, but evidence standards, appeals, and arbiter correction protect against herd mentality.",
  "A correct minority can be rewarded; a careless majority can be corrected.",
  "The demo shows the three views of one carrier workflow: carrier onboarding, dispute intake, and verifier review.",
  "The dashboard reads a real Base Sepolia deployment; the sandbox lets visitors try the carrier workflow without wallet setup.",
  "Veristake: carrier-routed disputed claims, reviewed by expertise, constrained by economics, and made auditable by software."
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
    title: "One wedge: carrier-routed disputed claims.",
    body: "Routine claims stay in the carrier system. Veristake activates only when the carrier routes a denial appeal, payout dispute, complex packet, or fraud signal for independent review.",
    weight: 1.15,
    visual: `
      <div class="route-card">
        <div class="route muted"><span>Routine claim</span><b>Carrier workflow</b></div>
        <div class="route active"><span>Carrier-routed appeal</span><b>Veristake review</b></div>
        <div class="route active"><span>Carrier fraud signal</span><b>Verifier pool</b></div>
        <div class="route muted"><span>Simple payout</span><b>Carrier workflow</b></div>
      </div>`
  },
  {
    badge: "Carrier control",
    title: "The insurer stays the insurer.",
    body: "The carrier keeps underwriting authority, customer relationship, reserve ownership, and compliance obligations. Veristake supplies the second-look verification layer.",
    weight: 1,
    visual: `
      <div class="carrier">
        <div><span>Policies</span><b>Carrier-owned</b></div>
        <div><span>Reserve</span><b>Carrier-funded</b></div>
        <div><span>Routing rules</span><b>Carrier-configured</b></div>
        <div><span>Review layer</span><b>Veristake</b></div>
      </div>`
  },
  {
    badge: "Dispute intake",
    title: "Evidence first, not crypto first.",
    body: "A configured intake flow converts eligible disputes into a structured packet: denial reason, policy context, medical or auto evidence, requested payout, and supporting documents.",
    weight: 1,
    visual: `
      <div class="packet">
        <div><small>HEALTH</small><strong>Carrier-routed ER appeal</strong><span>ICD-10 I20.0 - CPT 99285</span></div>
        <div><small>AUTO</small><strong>Carrier-routed collision dispute</strong><span>Police report - photos - repair estimate</span></div>
        <div><small>STATUS</small><strong>No wallet setup</strong><span>Guided demo - plain-English state</span></div>
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
        <div class="arbiter">Correct minority preserved - careless majority corrected</div>
      </div>`
  },
  {
    badge: "One workflow",
    title: "Carrier onboarding. Dispute intake. Verifier review.",
    body: "The demo no longer asks viewers to choose between a consumer tool and an enterprise layer. Every view supports the carrier-facing disputed-claim workflow.",
    weight: 1.2,
    visual: `
      <div class="split">
        <div>
          <small>View 1</small>
          <strong>Carrier operations</strong>
          <span>Register policy - fund reserve - monitor outcomes</span>
        </div>
        <div>
          <small>View 2</small>
          <strong>Review network</strong>
          <span>Route packet - expert vote - auditable outcome</span>
        </div>
      </div>`
  },
  {
    badge: "Carrier-safe",
    title: "Independent review without surrendering the book.",
    body: "Veristake is not a TPA, consumer claims service, or insurer substitute. It is software infrastructure for carrier-selected high-friction claims.",
    weight: 1,
    visual: `
      <div class="route-card">
        <div class="route active"><span>Carrier keeps</span><b>Policy + reserve</b></div>
        <div class="route active"><span>Veristake adds</span><b>Verifier liquidity</b></div>
        <div class="route active"><span>Output</span><b>Auditable second look</b></div>
        <div class="route muted"><span>Not the product</span><b>Consumer claims app</b></div>
      </div>`
  },
  {
    badge: "Live proof",
    title: "A carrier workflow people can understand in minutes.",
    body: "The dashboard reads a production-grade Base Sepolia deployment. The sandbox moves quickly so visitors can experience the carrier-routed flow without wallet setup.",
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
    title: "Carrier-routed disputes, verified by expertise and economics.",
    body: "A practical accountability layer for high-friction insurance decisions inside carrier claims operations.",
    weight: 0.82,
    visual: `
      <div class="closing-card">
        <strong>veristake-demo.vercel.app</strong>
        <span>Whitepaper - Demo - Live dashboard</span>
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

function splitForWebTts(text: string) {
  const chunks: string[] = [];
  let current = "";
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!sentence) continue;
    if ((current + " " + sentence).trim().length <= 180) {
      current = (current + " " + sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= 180) {
        current = sentence;
      } else {
        for (const part of sentence.match(/.{1,170}(?:\s|$)/g) || [sentence]) {
          chunks.push(part.trim());
        }
        current = "";
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function createWebVoiceover() {
  await rm(webVoicePath, { force: true });
  const chunks = splitForWebTts(narration);
  const segmentPaths: string[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const params = new URLSearchParams({
      ie: "UTF-8",
      client: "tw-ob",
      tl: "en",
      q: chunks[index]
    });
    const bytes = await downloadBuffer(`https://translate.google.com/translate_tts?${params.toString()}`);
    const segmentPath = path.join(cacheDir, `hero-voice-web-segment-${String(index).padStart(2, "0")}.mp3`);
    await writeFile(segmentPath, bytes);
    segmentPaths.push(segmentPath);
    await delay(250);
  }
  const concatPath = path.join(cacheDir, "hero-voice-web-concat.txt");
  await writeFile(
    concatPath,
    segmentPaths
      .map((segmentPath) => `file '${segmentPath.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
      .join("\n")
  );
  await run(ffmpegPath, [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-ar",
    "48000",
    "-ac",
    "1",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "2",
    webVoicePath
  ]);
  console.log("Using web TTS voiceover fallback.");
  return webVoicePath;
}

async function downloadBuffer(url: string, redirects = 3): Promise<Buffer> {
  const client = url.startsWith("https:") ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
        }
      },
      (response) => {
        const status = response.statusCode || 0;
        const location = response.headers.location;
        if (status >= 300 && status < 400 && location && redirects > 0) {
          response.resume();
          const next = new URL(location, url).toString();
          downloadBuffer(next, redirects - 1).then(resolve).catch(reject);
          return;
        }
        if (status < 200 || status >= 300) {
          response.resume();
          reject(new Error(`Web TTS request failed with ${status}`));
          return;
        }
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    request.on("error", reject);
    request.setTimeout(15_000, () => {
      request.destroy(new Error("Web TTS request timed out"));
    });
  });
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
    if (process.env.HERO_DISABLE_EDGE_TTS === "1") {
      throw new Error("Edge TTS disabled by HERO_DISABLE_EDGE_TTS=1.");
    }
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

  if (process.env.HERO_DISABLE_WEB_TTS !== "1") {
    try {
      console.warn("Trying web TTS fallback for a clearer narrated walkthrough.");
      return await createWebVoiceover();
    } catch (error) {
      lastError = error;
      console.warn("Web TTS fallback failed.");
      console.warn(error instanceof Error ? error.message : String(error));
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

async function createMusicBed(totalSeconds: number) {
  const fadeOutStart = Math.max(0, totalSeconds - 6).toFixed(2);
  const duration = totalSeconds.toFixed(2);
  await run(ffmpegPath, [
    "-y",
    "-f",
    "lavfi",
    "-t",
    duration,
    "-i",
    "sine=frequency=130.81:sample_rate=48000",
    "-f",
    "lavfi",
    "-t",
    duration,
    "-i",
    "sine=frequency=164.81:sample_rate=48000",
    "-f",
    "lavfi",
    "-t",
    duration,
    "-i",
    "sine=frequency=196.00:sample_rate=48000",
    "-f",
    "lavfi",
    "-t",
    duration,
    "-i",
    "anoisesrc=color=pink:sample_rate=48000:amplitude=0.02",
    "-filter_complex",
    [
      `[0:a]volume=0.018,lowpass=f=700,afade=t=in:st=0:d=4,afade=t=out:st=${fadeOutStart}:d=6[a0]`,
      `[1:a]volume=0.012,lowpass=f=900,afade=t=in:st=1:d=5,afade=t=out:st=${fadeOutStart}:d=6[a1]`,
      `[2:a]volume=0.010,lowpass=f=1100,tremolo=f=0.12:d=0.25,afade=t=in:st=2:d=5,afade=t=out:st=${fadeOutStart}:d=6[a2]`,
      `[3:a]volume=0.004,lowpass=f=450,afade=t=in:st=0:d=4,afade=t=out:st=${fadeOutStart}:d=6[a3]`,
      "[a0][a1][a2][a3]amix=inputs=4:normalize=0,alimiter=limit=0.08[out]"
    ].join(";"),
    "-map",
    "[out]",
    "-ac",
    "2",
    "-ar",
    "48000",
    musicPath
  ]);
  return musicPath;
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
      <div class="topline">Disputed-claim verification - Health + Auto</div>
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

async function mux(audioPath: string, totalSeconds: number) {
  const bedPath = await createMusicBed(totalSeconds);
  const fadeOutStart = Math.max(0, totalSeconds - 5).toFixed(2);
  await run(ffmpegPath, [
    "-y",
    "-i",
    rawVideoPath,
    "-i",
    audioPath,
    "-i",
    bedPath,
    "-filter_complex",
    [
      "[0:v]scale=1280:720,fps=30,format=yuv420p[v]",
      "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[narr]",
      `[2:a]volume=0.45,afade=t=in:st=0:d=4,afade=t=out:st=${fadeOutStart}:d=5[music]`,
      "[narr][music]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0,alimiter=limit=0.95[a]"
    ].join(";"),
    "-map",
    "[v]",
    "-map",
    "[a]",
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
  const totalSeconds = Math.max(90, Math.ceil(audioDuration + 2));
  console.log(`Audio duration: ${audioDuration.toFixed(1)}s; visual duration: ${totalSeconds}s`);
  await recordVisuals(totalSeconds);
  await mux(audioPath, totalSeconds);
  await copyPublicAssets();
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
