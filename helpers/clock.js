// The time a video was recorded, on the clock where it was recorded.
//
// An iPhone saves CreationDate with its time zone (2026:02:05
// 12:12:25-08:00). Its hour, minute and second are the time on the wall
// when recording started. Converting it to a Date and asking for getHours()
// gives the time in whatever zone this computer is set to instead, so a
// video shot in California and processed in New York came out 3 hours off.

const pad = (n) => String(n).padStart(2, "0");

// Seconds since midnight when recording started.
export function recordedClockSeconds(exifDate, fallback) {
  if (exifDate && Number.isFinite(exifDate.hour)) {
    return exifDate.hour * 3600 + exifDate.minute * 60 + exifDate.second;
  }
  return fallback.getHours() * 3600 + fallback.getMinutes() * 60 + fallback.getSeconds();
}

// "2026-02-05_12-12-25": when recording started, safe for a file name.
export function recordedStamp(exifDate, fallback) {
  if (exifDate && Number.isFinite(exifDate.year)) {
    const { year, month, day, hour, minute, second } = exifDate;
    return `${year}-${pad(month)}-${pad(day)}_${pad(hour)}-${pad(minute)}-${pad(second)}`;
  }
  return fallback.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "-");
}
