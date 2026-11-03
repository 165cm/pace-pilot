import * as notification from "@zos/notification";
import { getText } from "@zos/i18n";

function parseParams(params) {
  try { return JSON.parse(params || "{}"); } catch (_error) { return {}; }
}

function messageFor({ kind, round }) {
  if (kind === "break") return { content: `${getText("break")} · R${round}`, vibrate: 3 };
  if (kind === "work") return { content: `${getText("work")} · R${round}`, vibrate: 3 };
  return { content: getText("sessionComplete"), vibrate: 5 };
}

AppService({
  onInit(params) {
    const parsed = parseParams(params);
    const message = messageFor(parsed);
    notification.notify({
      title: "PacePilot",
      content: message.content,
      actions: [{
        text: getText("open"),
        file: parsed.kind === "complete" ? "page/complete" : "page/timer",
        param: "",
      }],
      vibrate: message.vibrate,
    });
  },
});
