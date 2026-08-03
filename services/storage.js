import { LocalStorage } from "@zos/storage";
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
} from "../core/timer-engine";

const KEYS = Object.freeze({
  preferences: "pace.preferences",
  active: "pace.active",
  history: "pace.history",
  lastRecord: "pace.lastRecord",
});

const localStorage = new LocalStorage();

export function getPreferences() {
  return normalizePreferences(
    localStorage.getItem(KEYS.preferences, DEFAULT_PREFERENCES),
  );
}

export function savePreferences(preferences) {
  localStorage.setItem(KEYS.preferences, normalizePreferences(preferences));
}

export function getActiveSession() {
  return localStorage.getItem(KEYS.active, null);
}

export function saveActiveSession(session) {
  localStorage.setItem(KEYS.active, session);
}

export function clearActiveSession() {
  localStorage.removeItem(KEYS.active);
}

export function getHistory() {
  const value = localStorage.getItem(KEYS.history, []);
  return Array.isArray(value) ? value : [];
}

export function appendHistory(record) {
  const history = [record, ...getHistory()].slice(0, 30);
  localStorage.setItem(KEYS.history, history);
  localStorage.setItem(KEYS.lastRecord, record);
  return history;
}

export function getLastRecord() {
  return localStorage.getItem(KEYS.lastRecord, null);
}
