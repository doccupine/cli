export const keyboardShortcutsMdxTemplate = `---
title: "Keyboard shortcuts"
description: "Show keys and key combinations as key caps that match the reader's keyboard."
date: "2026-11-25"
category: "Components"
categoryOrder: 1
order: 2
---
# Keyboard shortcuts

Show keys and key combinations as key caps that match the reader's keyboard.

Use \`<Kbd>\` to show a key inline. Press <Kbd>Mod+K</Kbd> to search, or <Kbd>Esc</Kbd> to close a dialog. \`Mod\` is the shortcut modifier of the reader's computer: the Command key on a Mac and Ctrl everywhere else, so one page fits both.

## Kbd usage

Write the key inside \`<Kbd>\`. Join the keys of a combination with \`+\`.

\`\`\`html
<Kbd>Esc</Kbd>
<Kbd>Mod+K</Kbd>
<Kbd>Mod+Shift+P</Kbd>
\`\`\`

<Kbd>Esc</Kbd> <Kbd>Mod+K</Kbd> <Kbd>Mod+Shift+P</Kbd>

A single letter is shown upper-case, and any other text is shown as written, so \`<Kbd>F5</Kbd>\` gives <Kbd>F5</Kbd>.

## Key names

These names are recognized in any letter case. On a Mac, the modifier keys show their symbols, and screen readers announce every symbol by name.

| Write | Shows | On a Mac |
| --- | --- | --- |
| \`Mod\` | Ctrl | Command (⌘) |
| \`Cmd\`, \`Command\` | ⌘ | ⌘ |
| \`Ctrl\`, \`Control\` | Ctrl | Control (⌃) |
| \`Shift\` | Shift | Shift (⇧) |
| \`Alt\`, \`Option\`, \`Opt\` | Alt | Option (⌥) |
| \`Enter\`, \`Return\` | Enter | Return (↩) |
| \`Backspace\` | Backspace | Delete (⌫) |
| \`Esc\`, \`Escape\` | Esc | Esc |
| \`Tab\`, \`Space\`, \`Delete\` | Tab, Space, Delete | the same |
| \`Up\`, \`Down\`, \`Left\`, \`Right\` | ↑ ↓ ← → | the same |

<Callout type="note">
  The right caps are chosen before the page first paints, so a Mac reader never sees Ctrl flash before ⌘.
</Callout>

## Properties

<Field value="children" type="string" required>
  The key, or keys joined with \`+\`.
</Field>`;
