# Timelapse Timestamps

Adds **real-world time overlays** to timelapse videos. Each frame shows the actual clock time (HH:MM) that moment represents, based on the video’s metadata.

## What It Does

1. **Reads metadata** from videos in the `input/` folder (CreationDate, ModifyDate, Duration, frame rate)
2. **Computes the time mapping** so each video second maps to the correct real-world seconds
3. **Renders timestamp overlays** with ffmpeg (HH:MM, centered, white text)
4. **Outputs two versions** per video: one with the timestamp near the top, one near the bottom
5. **Archives originals** by moving processed files into `archive/`

## How It Works

### 1. Metadata extraction (`utils/metadata.js`)

Uses **exiftool** (via `exiftool-vendored`) to read:

- **CreationDate** – when recording started
- **ModifyDate** – when recording ended
- **Duration** – playback length in seconds
- **VideoFrameRate** – frames per second

From this it derives:

- **Start time** – when the first frame was captured
- **Compression ratio** – real seconds per video second (e.g. 15 means 1 video second = 15 real seconds)

### 2. Time calculation

For each frame:

```
realTime = startTime + (frameNumber / frameRate) × ratio
```

The overlay text is computed per frame so it stays accurate across the whole video.

### 3. Overlay rendering (`utils/addTimestamp.js`)

Uses **ffmpeg** `drawtext` to overlay HH:MM on each frame. The formula is implemented as an ffmpeg expression so the timestamp updates correctly for every frame without pre-rendering.

### 4. Output structure

- **Output files**: `output/YYYY-MM-DD_HH-MM-SS_top.MOV` and `output/YYYY-MM-DD_HH-MM-SS_bottom.MOV`
- **Archived originals**: `archive/YYYY-MM-DD_HH-MM-SS.MOV`

## Requirements

- **Node.js** (ES modules)
- **ffmpeg** – must be installed and on your PATH
- **exiftool** – bundled by `exiftool-vendored`, no separate install needed

## Setup

```bash
npm install

# Ensure ffmpeg is installed (e.g. via Homebrew)
brew install ffmpeg
```

## Usage

1. Put timelapse videos in `input/`
2. Run:

```bash
npm start
```

3. Processed videos appear in `output/` (top and bottom timestamp variants)
4. Originals are moved to `archive/`

## Notes

- Times are on the clock where the video was recorded: an iPhone saves the time zone with the recording, so a video shot in California shows California time even when it's processed somewhere else. Output files are named the same way.
- `npm test` checks that, with the computer set to New York time.

- Video files must have valid CreationDate, ModifyDate, and Duration metadata. Files sent via apps like WhatsApp may have metadata stripped and will be skipped.
- The font used for the overlay is `assets/MostraNuova.otf` – ensure this file exists.
- The script processes all files in `input/`; empty or non-video files may cause errors.
