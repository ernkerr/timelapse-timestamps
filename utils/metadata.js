import { exiftool } from "exiftool-vendored";
import { exec } from "child_process";
import { promisify } from "util";
import { recordedClockSeconds, recordedStamp } from "../helpers/clock.js";

const execAsync = promisify(exec);

export async function getMetadata(inputPath) {
  // CHANGE THIS to your filename (e.g., "IMG_1234.MOV")
  // const filename = "input.mov";

  try {
    console.log(`--- Checking: ${inputPath} ---`);
    const tags = await exiftool.read(inputPath);

    // Step 1: Raw metadata logging
    console.log("--- RAW EXIFTOOL VALUES ---");
    console.log(
      "CreationDate (raw):",
      tags.CreationDate,
      "type:",
      typeof tags.CreationDate,
    );
    console.log(
      "ModifyDate (raw):",
      tags.ModifyDate,
      "type:",
      typeof tags.ModifyDate,
    );
    console.log(
      "Duration (raw):",
      tags.Duration,
      "type:",
      typeof tags.Duration,
    );
    console.log(
      "VideoFrameRate (raw):",
      tags.VideoFrameRate,
      "type:",
      typeof tags.VideoFrameRate,
    );

    // Apple's "Real World" timestamps
    const creationDate = tags.CreationDate; // When the shutter first opened
    const modifyDate = tags.ModifyDate; // When the file was finished saving
    const duration = tags.Duration; // Playback length (e.g. 20s)
    const frameRate = tags.VideoFrameRate;
    // console.log("Metadata tags: ", tags);

    if (creationDate && modifyDate && duration) {
      const start = new Date(creationDate.toString());
      const end = new Date(modifyDate.toString());
      const realSeconds = (end - start) / 1000;

      const realWorldElapsed = Math.round(realSeconds / 60);
      const compressionRatio = Math.round(realSeconds / duration);

      // Step 2: Log parsed values and intermediate calculations
      console.log("\n--- PARSED ---");
      console.log("start (Date):", start.toISOString());
      console.log("end (Date):", end.toISOString());
      console.log("realSeconds:", realSeconds);
      console.log("duration (used in ratio):", duration);
      console.log("compressionRatio (ratio):", compressionRatio);
      console.log("frameRate (passed to ffmpeg):", frameRate);

      // Step 3: Cross-check with ffprobe duration
      let ffprobeDuration = null;
      let ffprobeNbFrames = null;
      try {
        const formatOut = await execAsync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
        );
        ffprobeDuration = parseFloat(formatOut.stdout.trim());
        const streamOut = await execAsync(
          `ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
        );
        const nbFramesStr = streamOut.stdout.trim();
        ffprobeNbFrames = nbFramesStr ? parseInt(nbFramesStr, 10) : null;
      } catch (e) {
        console.log("ffprobe error:", e.message);
      }
      console.log("\n--- FFPROBE CROSS-CHECK ---");
      console.log("exiftool Duration:", duration);
      console.log("ffprobe format duration:", ffprobeDuration);
      console.log("ffprobe stream nb_frames:", ffprobeNbFrames);

      // Step 4: Sanity check at video end
      const numericFrameRate =
        parseFloat(frameRate) || parseFloat(String(frameRate).split("/")[0]);
      const totalFrames =
        ffprobeNbFrames ?? (ffprobeDuration ?? duration) * numericFrameRate;
      // On the clock where it was recorded, not this computer's
      const startSeconds = recordedClockSeconds(creationDate, start);
      const formulaEndSeconds =
        startSeconds + (totalFrames / numericFrameRate) * compressionRatio;
      const expectedEndSeconds = startSeconds + realSeconds;
      console.log("\n--- SANITY CHECK (last frame) ---");
      console.log("Expected end (seconds since midnight):", expectedEndSeconds);
      console.log(
        "Formula gives (startSeconds + (totalFrames/frameRate)*ratio):",
        formulaEndSeconds,
      );
      console.log(
        "Match:",
        Math.abs(formulaEndSeconds - expectedEndSeconds) < 60
          ? "YES"
          : "NO - MISMATCH",
      );

      console.log("\n✅ DATA FOUND!");
      console.log(`Real world time elapsed: ${realWorldElapsed} minutes`);
      console.log(
        `Compression ratio: 1 second of video = ${compressionRatio} seconds of reality.`,
      );

      return {
        startTime: start,
        startClock: startSeconds,
        stamp: recordedStamp(creationDate, start),
        ratio: compressionRatio,
        frameRate,
      };
    } else {
      console.log("\n❌ CRITICAL DATA MISSING.");
      console.log(
        "Check if the file was sent via an app that strips metadata (like WhatsApp).",
      );
    }
  } catch (err) {
    console.error("Error reading file:", err);
    return null;
  }
}

// Call this once after all videos are processed
export async function closeExiftool() {
  await exiftool.end();
}
