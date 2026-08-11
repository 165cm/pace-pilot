import * as notification from "@zos/notification";

function parseParams(params) {
  try { return JSON.parse(params || "{}"); } catch (_error) { return {}; }
}

function messageFor({ kind, round }) {
  if (kind === "break") return { content: `Break · Round ${round}`, vibrate: 3 };
  if (kind === "work") return { content: `Work · Round ${round}`, vibrate: 3 };
  return { content: "Session complete", vibrate: 5 };
}

AppService({
  onInit(params) {
    const parsed = parseParams(params);
    const message = messageFor(parsed);
    notification.notify({
      title: "Pace Pilot",
      content: message.content,
      actions: [{
        text: "Open",
        file: parsed.kind === "complete" ? "page/complete" : "page/timer",
        param: "",
      }],
      vibrate: message.vibrate,
    });
  },
});
