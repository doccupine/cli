export const useOnClickOutsideTemplate = `"use client";
// Calls back on a mousedown outside every given element. Adapted from
// cherry-styled-components (MIT,
// https://github.com/cherry-design-system/styled-components).
import { RefObject, useEffect, useRef } from "react";

// Controls that hand off to a native OS picker. iOS draws those pickers outside
// the web view, so the taps that drive them never reach the DOM; when the picker
// resolves, WebKit can still emit a stray mousedown whose target sits outside
// the component. Unguarded, that reads as a click outside - which is why
// setting a date inside a Modal used to dismiss the whole Modal on iPhone.
const NATIVE_PICKER_SELECTOR = [
  "select",
  'input[type="date"]',
  'input[type="datetime-local"]',
  'input[type="month"]',
  'input[type="time"]',
  'input[type="week"]',
].join(",");

// A press and the mouse events synthesized from it land within a few frames of
// each other. A stray picker event has no press behind it at all, so anything
// older than this window cannot account for the mousedown being handled.
const RECENT_PRESS_MS = 400;

// One document-wide record of the last genuine press and the last native picker
// to give up focus, shared by every hook instance. The listeners are capture
// phase, so the timestamps are always written before the bubble-phase mousedown
// handlers below read them, whatever order the components mounted in.
let subscriberCount = 0;
let lastPressAt = Number.NEGATIVE_INFINITY;
let pickerBlurredAt = Number.NEGATIVE_INFINITY;

const capture = { capture: true, passive: true } as const;

function notePress() {
  lastPressAt = performance.now();
}

// iOS may blur the control before dispatching the stray event, so remember when
// a picker last held focus as well as whether it holds it right now.
function noteFocusOut(event: FocusEvent) {
  const target = event.target;
  if (target instanceof Element && target.matches(NATIVE_PICKER_SELECTOR)) {
    pickerBlurredAt = performance.now();
  }
}

function subscribeToPresses() {
  if (subscriberCount++ > 0) return;
  document.addEventListener("pointerdown", notePress, capture);
  document.addEventListener("touchstart", notePress, capture);
  document.addEventListener("focusout", noteFocusOut, true);
}

function unsubscribeFromPresses() {
  if (--subscriberCount > 0) return;
  document.removeEventListener("pointerdown", notePress, capture);
  document.removeEventListener("touchstart", notePress, capture);
  document.removeEventListener("focusout", noteFocusOut, true);
}

// True when a native picker is engaged and nothing the user did to the page can
// account for the event: the tap went to the picker, not to the document.
function isStrayPickerEvent() {
  const now = performance.now();
  const active = document.activeElement;
  const pickerEngaged =
    (active instanceof Element && active.matches(NATIVE_PICKER_SELECTOR)) ||
    now - pickerBlurredAt < RECENT_PRESS_MS;

  return pickerEngaged && now - lastPressAt >= RECENT_PRESS_MS;
}

export function useOnClickOutside(
  refs: RefObject<HTMLElement | null>[],
  cb: () => void,
) {
  // Callers typically pass inline arrays and callbacks, so keep the latest
  // values in a ref and subscribe to the document only once per mount.
  const latest = useRef({ refs, cb });

  useEffect(() => {
    latest.current = { refs, cb };
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const { refs, cb } = latest.current;
      // A native picker owns the interaction: the event is an artifact of it
      // closing, not a click the user aimed at the page.
      if (isStrayPickerEvent()) return;
      // Unattached refs are ignored: a click counts as outside unless it
      // lands inside a currently mounted ref target.
      if (
        refs.every(
          (ref) => !ref.current || !ref.current.contains(event.target as Node),
        )
      ) {
        cb();
      }
    }
    subscribeToPresses();
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      unsubscribeFromPresses();
    };
  }, []);
}
`;
