import * as notification from "@zos/notification";
import { addUnit } from "../core/timer-engine";
import { scheduleAddedUnit } from "../services/alarm-manager";
import {
  getActiveSession,
  saveActiveSession,
} from "../services/storage";

function parseParams(params) {
  try {
    return JSON.parse(params || "{}");
  } catch (_error) {
    return {};
  }
}

function notificationFor({ kind, unit }) {
  if (kind === "chase") {
    return {
      content: "Finish phase: wrap up this unit",
      vibrate: 4,
    };
  }
  if (kind === "work") {
    return {
      content: `Start work: unit ${unit}`,
      vibrate: 3,
    };
  }
  return {
    content: `Auto added unit ${unit}`,
    vibrate: 5,
  };
}

function extendAtBoundary(params) {
  if (params.kind !== "end") return params;
  const session = getActiveSession();
  if (
    !session ||
    session.status !== "running" ||
    params.unit <= session.currentPlannedUnits
  ) {
    return params;
  }
  const next = addUnit(session);
  const scheduled = scheduleAddedUnit(session, next, Date.now());
  if (!scheduled.ok) {
    return { ...params, extensionFailed: true };
  }
  saveActiveSession({ ...next, alarmEntries: scheduled.entries });
  return params;
}

AppService({
  onInit(params) {
    const parsed = extendAtBoundary(parseParams(params));
    const message = parsed.extensionFailed
      ? { content: "Auto add failed. Open the app.", vibrate: 5 }
      : notificationFor(parsed);
    notification.notify({
      title: "PacePilot",
      content: message.content,
      actions: [
        {
          text: "Open",
          file: "page/timer",
          param: "",
        },
      ],
      vibrate: message.vibrate,
    });
  },
});
