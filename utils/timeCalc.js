export function getClockTimeForFrame(frameNum, startTime, ratio) {
  const fps = 30;

  // 1. Calculate how many real-world seconds have passes since the start
  // frame / 30 gives us video seconds
  // Multiplying by ratio gives us the "jump" in real time.
  // Multiply by 1000 since JS Dates use milliseconds
  const realSecondsPassed = (frameNum / fps) * ratio * 1000;

  // 2. Create a new Date object offset by those seconds
  const currentTime = new Date(startTime.getTime() + realSecondsPassed);

  // 3. Return the formatted string (HH:MM:SS)
  // .toISOString() gives us "YYYY_MM_DDTHH:mm:ss.sssZ"
  // we can slice out the time part for a quick result
  return currentTime.toISOString().slice(11, 8);
}
