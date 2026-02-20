import { getMetadata } from "./metadata.js";
import { addTimestamp } from "./addTimestamp.js";
import { formatFilename } from "../helpers/formatFilename.js";
import fs from "fs";
import path from "path";

export default async function processVideo(inputPath) {
  // 1: get metadata
  const metadata = await getMetadata(inputPath);
  if (!metadata) {
    console.log("Skipping file - no metadata");
    return;
  }
  const { startTime, ratio, frameRate } = metadata;
  console.log("Process Video Recieved: ", startTime, ratio, frameRate);

  // 2: build output paths
  const filename = formatFilename(startTime);
  const ext = path.extname(inputPath);
  const outputDir = path.join(path.dirname(inputPath), "../output");
  const outputPathTop = path.join(outputDir, filename + "_top" + ext);
  const outputPathBottom = path.join(outputDir, filename + "_bottom" + ext);

  // 3: add ffmpeg overlay (both top and bottom versions)
  await addTimestamp(inputPath, outputPathTop, startTime, ratio, frameRate, "top");
  await addTimestamp(inputPath, outputPathBottom, startTime, ratio, frameRate, "bottom");

  // 4: move original to archive
  const archiveDir = path.join(path.dirname(inputPath), "../archive");
  const archivePath = path.join(archiveDir, filename + ext);
  fs.renameSync(inputPath, archivePath);
  console.log("Archived:", archivePath);
}
