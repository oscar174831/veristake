import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

async function main() {
  const root = process.cwd();
  const publicVideos = path.join(root, "public", "videos");

  async function copyIfPresent(source: string, destination: string) {
    if (!existsSync(source)) return;
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }

  await mkdir(publicVideos, { recursive: true });
  await copyIfPresent(
    path.join(root, "docs", "videos", "highlight-reel-90s.mp4"),
    path.join(publicVideos, "highlight-reel-90s.mp4")
  );
  await copyIfPresent(
    path.join(root, "docs", "videos", "highlight-poster.jpg"),
    path.join(publicVideos, "highlight-poster.jpg")
  );
  await copyIfPresent(
    path.join(root, "public", "docs", "whitepaper", "Veristake_Whitepaper_v2.pdf"),
    path.join(root, "public", "whitepaper.pdf")
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
