// node index.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import processVideo from "./utils/processVideo.js";
import { closeExiftool } from "./utils/metadata.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIRECTORY = path.join(__dirname, "input");

async function main() {
  // 1. Scan input folder for videos
  const files = fs.readdirSync(INPUT_DIRECTORY);

  // 2. Process each video
  for (const file of files) {
    const inputPath = path.join(INPUT_DIRECTORY, file);
    await processVideo(inputPath);
  }

  // 3. Clean up exiftool
  await closeExiftool();
}

main();
