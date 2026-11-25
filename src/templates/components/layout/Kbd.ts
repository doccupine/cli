export const kbdTemplate = `import React from "react";
import { DEFAULT_STRINGS, type UiStrings } from "@/utils/strings";

// Styles: app/styles/design.css (.dcp-kbd, see src/templates/styles/kbd.ts
// in the CLI).

interface KbdProps {
  children?: React.ReactNode;
  /** The page language's strings, for the key names screen readers say. */
  strings?: UiStrings;
}

type KeyName =
  | "keyCommand"
  | "keyControl"
  | "keyShift"
  | "keyOption"
  | "keyReturn"
  | "keyDelete"
  | "keyUp"
  | "keyDown"
  | "keyLeft"
  | "keyRight";

/**
 * A key as written on the cap, and the string with the name a screen reader
 * should say when the cap is a symbol. \`mac\` is the Mac keyboard's own
 * cap, where it differs.
 */
interface KeyCap {
  label: string;
  name?: KeyName;
  mac?: { label: string; name: KeyName };
}

const MAC_COMMAND: KeyCap["mac"] = { label: "\\u2318", name: "keyCommand" };

// Aliases are matched case-insensitively. Anything else is shown as written,
// a single letter upper-cased (k shows as K).
const KEYS: Record<string, KeyCap> = {
  mod: { label: "Ctrl", mac: MAC_COMMAND },
  cmd: { label: "\\u2318", name: "keyCommand" },
  command: { label: "\\u2318", name: "keyCommand" },
  ctrl: { label: "Ctrl", mac: { label: "\\u2303", name: "keyControl" } },
  control: { label: "Ctrl", mac: { label: "\\u2303", name: "keyControl" } },
  shift: { label: "Shift", mac: { label: "\\u21e7", name: "keyShift" } },
  alt: { label: "Alt", mac: { label: "\\u2325", name: "keyOption" } },
  option: { label: "Alt", mac: { label: "\\u2325", name: "keyOption" } },
  opt: { label: "Alt", mac: { label: "\\u2325", name: "keyOption" } },
  enter: { label: "Enter", mac: { label: "\\u21a9", name: "keyReturn" } },
  return: { label: "Enter", mac: { label: "\\u21a9", name: "keyReturn" } },
  esc: { label: "Esc" },
  escape: { label: "Esc" },
  tab: { label: "Tab" },
  space: { label: "Space" },
  backspace: {
    label: "Backspace",
    mac: { label: "\\u232b", name: "keyDelete" },
  },
  delete: { label: "Delete" },
  del: { label: "Delete" },
  up: { label: "\\u2191", name: "keyUp" },
  arrowup: { label: "\\u2191", name: "keyUp" },
  down: { label: "\\u2193", name: "keyDown" },
  arrowdown: { label: "\\u2193", name: "keyDown" },
  left: { label: "\\u2190", name: "keyLeft" },
  arrowleft: { label: "\\u2190", name: "keyLeft" },
  right: { label: "\\u2192", name: "keyRight" },
  arrowright: { label: "\\u2192", name: "keyRight" },
};

function extractText(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return extractText(element.props.children);
  }
  return "";
}

/** "Mod+Shift+K" as its keys. A lone "+" is the plus key itself. */
export function parseKeys(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed === "+") return ["+"];
  return trimmed
    .split("+")
    .map((key) => key.trim())
    .filter(Boolean);
}

/** The cap for one key, written the way the reader's keyboard labels it. */
export function keyCap(key: string): KeyCap {
  const known = KEYS[key.toLowerCase()];
  if (known) return known;
  return { label: key.length === 1 ? key.toUpperCase() : key };
}

// A symbol cap is hidden from screen readers, which say its name instead.
function Label({ label, name }: { label: string; name?: string }) {
  if (!name) return <>{label}</>;
  return (
    <>
      <span aria-hidden="true">{label}</span>
      <span className="dcp-visually-hidden">{name}</span>
    </>
  );
}

// A key whose cap differs on a Mac renders both; CSS shows the one that
// matches the data-os attribute the pre-paint script sets on <html>, so the
// right one paints first and the markup is the same on server and client.
function Cap({ cap, strings }: { cap: KeyCap; strings: UiStrings }) {
  const name = cap.name ? strings[cap.name] : undefined;
  return (
    <kbd className="dcp-kbd">
      {cap.mac ? (
        <>
          <span className="dcp-kbd__other">
            <Label label={cap.label} name={name} />
          </span>
          <span className="dcp-kbd__mac">
            <Label label={cap.mac.label} name={strings[cap.mac.name]} />
          </span>
        </>
      ) : (
        <Label label={cap.label} name={name} />
      )}
    </kbd>
  );
}

/**
 * Key caps, inline. A combination ("Mod+K") is one <kbd> holding a <kbd>
 * per key, the HTML spelling of a key combination.
 */
function Kbd({ children, strings = DEFAULT_STRINGS }: KbdProps) {
  const keys = parseKeys(extractText(children));
  if (keys.length === 0) return null;
  if (keys.length === 1) {
    return <Cap cap={keyCap(keys[0])} strings={strings} />;
  }
  return (
    <kbd className="dcp-kbd-combo">
      {keys.map((key, index) => (
        <Cap key={\`\${key}-\${index}\`} cap={keyCap(key)} strings={strings} />
      ))}
    </kbd>
  );
}

export { Kbd, type KbdProps };
`;
