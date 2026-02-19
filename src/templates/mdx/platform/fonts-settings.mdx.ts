export const platformFontsSettingsMdxTemplate = `---
title: "Fonts Settings"
description: "Configure custom typography with Google Fonts or local font files."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
order: 4
section: "Platform"
---
# Fonts Settings
The Fonts settings page lets you customize your documentation site's typography using Google Fonts or locally uploaded font files.

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

## How it works
Font settings are stored in \`fonts.json\` at the root of your repository. Here's an example using Google Fonts:

\`\`\`json
{
  "type": "google",
  "name": "Inter",
  "weights": [400, 500, 600, 700],
  "subsets": ["latin"]
}
\`\`\``;
