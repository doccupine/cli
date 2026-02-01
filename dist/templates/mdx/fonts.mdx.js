export const fontsMdxTemplate = `---
title: "Fonts"
description: "Customize the documentation typography with a fonts.json file (Google Fonts or local custom fonts)."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 5
---
# Fonts
Define your site’s typography with a \`fonts.json\` file. You can load fonts from Google Fonts or from local font files bundled with your project.

## fonts.json
Place a \`fonts.json\` at your project root (the same folder where you execute \`npx doccupine\`). Choose one of the following configurations depending on the source of your fonts.

## Google Fonts
Use this when your font is hosted by Google Fonts.

\`\`\`json
{
  "googleFont": {
    "fontName": "Work_Sans",
    "subsets": ["latin"],
    "weight": "400"
  }
}
\`\`\`

### Rules
- **fontName**: Capitalize each word. If the name contains spaces, replace them with \`_\`.
  - Example: "Work Sans" → \`Work_Sans\`
- **subsets**: Pick the subsets you need (for example, \`latin\`).
- **weight**: The font weight to load (for example, \`"400"\`).

### Tips
- **One primary family**: Start with a single family and weight, then add more if needed.
- **Readability**: Choose readable body fonts; reserve display fonts for headings.

## Local custom fonts
Use this when you want to ship your own font files. Upload your font files to the Next.js \`public\` directory, then reference them with relative paths.

\`\`\`json
{
  "localFonts": {
    "src": [
      {
        "path": "../public/font.woff",
        "weight": "400",
        "style": "normal"
      },
      {
        "path": "../public/font.woff",
        "weight": "400",
        "style": "italic"
      },
      {
        "path": "../public/font.woff",
        "weight": "700",
        "style": "normal"
      },
      {
        "path": "../public/font.woff",
        "weight": "700",
        "style": "italic"
      }
    ]
  }
}
\`\`\`

### Single file shorthand
If you have only one file, you can use:

\`\`\`json
{
  "localFonts": "../public/font.woff"
}
\`\`\`

### Rules
- **Upload files**: Place \`font.woff\` (and any additional weights/styles) in your Next.js \`public\` directory.
- **path**: Use a relative path to the file from where it is consumed by your build tooling; the example above uses \`../public/font.woff\`.
- **weight**: String value of the font weight (for example, \`"400"\`, \`"700"\`).
- **style**: \`"normal"\` or \`"italic"\`.

### Tips
- **Provide only what you need**: Include the minimal set of weights/styles to keep bundle size small.
- **File formats**: \`.woff\` is broadly supported and recommended for the web.

## Behavior
- **Placement**: Put \`fonts.json\` in the project root alongside \`config.json\` and (optionally) \`theme.json\`.
- **Validation**: Follow the naming rule for \`googleFont.fontName\` (capitalize, replace spaces with \`_\`).
- **Local files**: Ensure the referenced files exist under the Next.js \`public\` directory.

## Examples
- **Google Fonts (Work Sans)**

\`\`\`json
{
  "googleFont": {
    "fontName": "Work_Sans",
    "subsets": ["latin"],
    "weight": "400"
  }
}
\`\`\`

- **Local fonts (multiple weights/styles)**

\`\`\`json
{
  "localFonts": {
    "src": [
      { "path": "../public/font.woff", "weight": "400", "style": "normal" },
      { "path": "../public/font.woff", "weight": "400", "style": "italic" },
      { "path": "../public/font.woff", "weight": "700", "style": "normal" },
      { "path": "../public/font.woff", "weight": "700", "style": "italic" }
    ]
  }
}
\`\`\`
`;
