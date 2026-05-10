import { useState, useEffect } from "react";

const SAVES_KEY = "konekto_saves";
const SAVES_EVENT = "konekto_saves_change";

export type SavedItems = { circleIds: string[]; eventIds: string[]; dealIds: string[] };

const emptySaves = (): SavedItems => ({ circleIds: [], eventIds: [], dealIds: [] });

function normalizeSaves(value: unknown): SavedItems {
  if (!value || typeof value !== "object") return emptySaves();
  const saved = value as Partial<SavedItems>;
  return {
    circleIds: Array.isArray(saved.circleIds) ? saved.circleIds.filter((id): id is string => typeof id === "string") : [],
    eventIds: Array.isArray(saved.eventIds) ? saved.eventIds.filter((id): id is string => typeof id === "string") : [],
    dealIds: Array.isArray(saved.dealIds) ? saved.dealIds.filter((id): id is string => typeof id === "string") : [],
  };
}

function storageKey(userId?: string | null) {
  return userId ? `${SAVES_KEY}:${userId}` : null;
}

function loadSaves(userId?: string | null): SavedItems {
  const key = storageKey(userId);
  if (!key) return emptySaves();

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptySaves();
    return normalizeSaves(JSON.parse(raw));
  } catch {
    return emptySaves();
  }
}

function writeSaves(userId: string, saves: SavedItems) {
  localStorage.setItem(`${SAVES_KEY}:${userId}`, JSON.stringify(saves));
  window.dispatchEvent(new CustomEvent(SAVES_EVENT));
}

export function useSaves(userId?: string | null) {
  const [saves, setSaves] = useState<SavedItems>(() => {
    if (typeof window === "undefined") return emptySaves();
    return loadSaves(userId);
  });

  useEffect(() => {
    const handler = () => setSaves(loadSaves(userId));
    handler();
    window.addEventListener(SAVES_EVENT, handler);
    return () => window.removeEventListener(SAVES_EVENT, handler);
  }, [userId]);

  function toggle(type: "circle" | "event" | "deal", id: string) {
    if (!userId) return;
    const current = loadSaves(userId);
    const key = type === "circle" ? "circleIds" : type === "event" ? "eventIds" : "dealIds";
    const arr = current[key];
    const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    writeSaves(userId, { ...current, [key]: next });
  }

  function isSaved(type: "circle" | "event" | "deal", id: string) {
    const key = type === "circle" ? "circleIds" : type === "event" ? "eventIds" : "dealIds";
    return saves[key].includes(id);
  }

  return { saves, toggle, isSaved };
}
