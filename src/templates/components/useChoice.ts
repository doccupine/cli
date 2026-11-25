export const useChoiceTemplate = `"use client";
import { useCallback, useSyncExternalStore } from "react";

// A reader's remembered pick among labeled alternatives: the package manager
// of <Install> blocks, the language of <View> groups. Every block reading the
// same key follows a pick made in any of them, on this page and in other tabs
// (the storage event), and the pick survives reloads in localStorage. Where
// storage is blocked the pick still syncs the page, for this visit only.

const PREFIX = "doccupine:choice:";
const memory = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();
let listeningToStorage = false;

function read(key: string): string | null {
  try {
    const stored = window.localStorage.getItem(PREFIX + key);
    if (stored !== null) return stored;
  } catch {
    // Storage is blocked: fall through to this visit's memory.
  }
  return memory.get(key) ?? null;
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key && event.key.startsWith(PREFIX)) {
    notify(event.key.slice(PREFIX.length));
  }
}

function subscribe(key: string, listener: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  if (!listeningToStorage) {
    window.addEventListener("storage", onStorage);
    listeningToStorage = true;
  }
  return () => {
    set.delete(listener);
  };
}

/** Remembers a pick for every block that reads this key. */
export function setChoice(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage is blocked: memory keeps the pick for this visit.
  }
  notify(key);
}

/**
 * The remembered pick for a key, or null. The server and the hydration pass
 * read null, so a block renders its first alternative there and switches to
 * the reader's pick right after hydrating.
 */
export function useChoice(
  key: string,
): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(
    useCallback((listener: () => void) => subscribe(key, listener), [key]),
    () => read(key),
    () => null,
  );
  const set = useCallback((next: string) => setChoice(key, next), [key]);
  return [value, set];
}
`;
