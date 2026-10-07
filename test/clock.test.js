// The overlay's clock comes from where the video was recorded, not from the
// computer processing it. Run with TZ set somewhere else (npm test sets New
// York) to prove it: a video started at 12:12:25 in California still reads
// 12:12.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ExifDateTime } from "exiftool-vendored";
import { recordedClockSeconds, recordedStamp } from "../helpers/clock.js";

const californiaNoon = ExifDateTime.fromEXIF("2026:02:05 12:12:25-08:00");
const asDate = new Date(californiaNoon.toString());

test("the start time is the time where it was recorded", () => {
  assert.equal(recordedClockSeconds(californiaNoon, asDate), 12 * 3600 + 12 * 60 + 25);
});

test("the file name is the time where it was recorded", () => {
  assert.equal(recordedStamp(californiaNoon, asDate), "2026-02-05_12-12-25");
});

test("without a recorded time it falls back to this computer's clock", () => {
  const d = new Date(2026, 1, 5, 9, 30, 0);
  assert.equal(recordedClockSeconds(null, d), 9 * 3600 + 30 * 60);
});
