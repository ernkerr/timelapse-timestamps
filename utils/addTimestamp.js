import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Adds a dynamic timestamp overlay to a video using ffmpeg
 *
 * @param inputPath - Path to the input video
 * @param outputPath - Path for the output video
 * @param startClock - Seconds since midnight when recording started, on the
 *   clock where it was recorded (helpers/clock.js)
 * @param ratio - How many real seconds pass per video second (e.g., 15)
 * @param frameRate - Video frame rate (e.g., 30)
 * @param position - "top" or "bottom" for timestamp placement
 */
export async function addTimestamp(
  inputPath,
  outputPath,
  startClock,
  ratio,
  frameRate,
  position
) {
  const fontPath = path.join(__dirname, "../assets/MostraNuova.otf");

  // Step 1: When recording started, in seconds since midnight
  // Example: 6:48:41 PM = 18*3600 + 48*60 + 41 = 67721 seconds
  const startSeconds = startClock;

  // Step 2: Build the time calculation for ffmpeg
  // Formula: currentTime = startSeconds + (frameNumber / frameRate) * ratio
  // Wrap with mod 86400 so times crossing midnight show correctly (e.g. 23:00 + 2h → 01:00, not 25:00)
  //
  // Example at frame 300 with ratio=15, fps=30:
  //   currentTime = 67721 + (300 / 30) * 15
  //   currentTime = 67721 + 150 = 67871 seconds
  //   That's 18:51:11 (2.5 minutes later in real time)
  const timeCalc = `mod(${startSeconds}+(n/${frameRate})*${ratio}\\,86400)`;

  // Step 3: Format as HH:MM
  // - Divide by 3600 for hours
  // - Divide by 60, mod 60 for minutes
  const hhExpr = `%{eif\\:trunc(${timeCalc}/3600)\\:d\\:2}`; // hours, 2 digits
  const mmExpr = `%{eif\\:trunc(mod(${timeCalc}/60\\,60))\\:d\\:2}`; // minutes, 2 digits
  const textExpr = `'${hhExpr}\\:${mmExpr}'`;

  // Step 4: Build and run ffmpeg command
  const yPosition = position === "top" ? "h*0.2" : "h*0.75";
  // -y: replace an earlier output of the same video instead of waiting for
  // an answer to "Overwrite?" that never comes
  const cmd = `ffmpeg -y -i "${inputPath}" -vf "drawtext=fontfile='${fontPath}':text=${textExpr}:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=${yPosition}" -codec:a copy "${outputPath}"`;

  console.log("Running ffmpeg...");
  await execAsync(cmd);
  console.log("Done!");
}
