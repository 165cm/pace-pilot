export function pad2(value) {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
    : `${pad2(minutes)}:${pad2(seconds)}`;
}

export function formatClockFromDate(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatSignedDuration(seconds) {
  const prefix = seconds > 0 ? "＋" : seconds < 0 ? "－" : "±";
  return `${prefix}${formatDuration(Math.abs(seconds))}`;
}

export function formatMinutes(seconds) {
  return `${Math.round(seconds / 60)} min`;
}
