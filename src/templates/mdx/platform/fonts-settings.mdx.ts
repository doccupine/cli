export const platformFontsSettingsMdxTemplate = `---
title: "Fonts Settings"
description: "Configure custom typography with Google Fonts or local font files."
date: "2026-02-19"
updated: "2026-08-01"
category: "Configuration"
categoryOrder: 2
order: 3
section: "Platform"
---
# Fonts Settings

The Fonts settings page lets you customize your documentation site's typography using Google Fonts or locally uploaded font files.

## Enabling custom fonts

Use the **Enable Custom Fonts** toggle to turn custom typography on or off. Turning it off stages a **deletion** of \`fonts.json\` rather than saving an empty configuration, so the file disappears from your repository on the next publish and the site falls back to its default typeface. Absence is what the generator reads as "no custom fonts". An empty \`{}\` left in place ends up disabled too, but it fails validation on every build and prints a warning as it goes.

## Google Fonts

Select a font from the full Google Fonts library:

1. Type a font name to search the library.
2. Select the **weights** you need (e.g., 400 for regular, 700 for bold). You can select multiple weights.
3. Choose **subsets** for language support (latin, cyrillic, greek, vietnamese, etc.).

<Callout type="note">
  Only include the weights and subsets you actually use. Each addition increases page load time.
</Callout>

## Local fonts

Upload your own font files for complete typographic control:

1. Click **Add Font Source** to add a font file entry.
2. Upload a font file (WOFF2, WOFF, TTF, OTF, or EOT format).
3. Set the **weight** (e.g., 400, 700) and **style** (normal or italic).
4. Add more sources for additional weights and styles.

WOFF2 is recommended for the best compression and browser support.

A weight or style already in your \`fonts.json\` that is not one of the offered choices appears as **Custom (value)** and is kept, so a hand-authored entry survives a round trip through the settings page.

## Validation

\`fonts.json\` is checked against the same rules the generator uses, both when the settings page loads it and when you save. A configuration the generator would refuse shows an error here, rather than passing silently and leaving your site on its default typeface:

- Exactly one of \`googleFont\` or \`localFonts\` must be defined, never both and never neither.
- \`googleFont.fontName\` must be a valid identifier, because it becomes an import in the generated site.
- \`googleFont.subsets\` must be an array of non-empty strings, and \`googleFont.weight\` a non-empty string or array of them.
- \`localFonts\` must be a non-empty path, or an object whose \`src\` array holds at least one entry with a string \`path\`.

## How it works

Font settings are stored in \`fonts.json\` at the root of your repository. Here's an example using Google Fonts:

\`\`\`json
{
  "googleFont": {
    "fontName": "Inter",
    "subsets": ["latin"],
    "weight": ["400", "500", "600", "700"]
  }
}
\`\`\`

See the [Fonts](/fonts) page for the full configuration format, including local font support.`;
