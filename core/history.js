const MONTHS = Object.freeze([
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]);

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function historyDateKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function historyDateLabel(timestamp) {
  const date = new Date(timestamp);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function historyStartTime(timestamp) {
  const date = new Date(timestamp);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function groupHistoryByDate(records = []) {
  const sorted = records
    .filter((record) => Number.isFinite(record?.startedAt))
    .slice()
    .sort((a, b) => b.startedAt - a.startedAt);
  const groups = [];
  for (const record of sorted) {
    const key = historyDateKey(record.startedAt);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: historyDateLabel(record.startedAt),
        latestStartedAt: record.startedAt,
        records: [],
      };
      groups.push(group);
    }
    group.records.push(record);
  }
  return groups;
}
