export const themeMdxTemplate = `---
title: "Theme"
description: "Customize the documentation UI colors with a theme.json file."
date: "2025-01-15"
category: "Configuration"
categoryOrder: 3
order: 5
---
# Theme
Define your site’s color system with a \`theme.json\` file. This lets you tailor the look and feel of your documentation without changing content.

## theme.json
Place a \`theme.json\` at your project root (the same folder where you execute \`npx doccupine\`). It supports multiple modes. Define a \`default\` mode and a \`dark\` mode.

\`\`\`json
{
  "default": {
    "primaryLight": "#93c5fd",
    "primary": "#3b82f6",
    "primaryDark": "#1e40af",
    "secondaryLight": "#c4b5fd",
    "secondary": "#8b5cf6",
    "secondaryDark": "#5b21b6",
    "tertiaryLight": "#fbbf24",
    "tertiary": "#f59e0b",
    "tertiaryDark": "#d97706",
    "grayLight": "#f3f4f6",
    "gray": "#9ca3af",
    "grayDark": "#374151",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#000000",
    "light": "#ffffff"
  },
  "dark": {
    "primaryLight": "#9bcaff",
    "primary": "#1e7ae0",
    "primaryDark": "#033d7e",
    "secondaryLight": "#ddd6fe",
    "secondary": "#a78bfa",
    "secondaryDark": "#7c3aed",
    "tertiaryLight": "#fed7aa",
    "tertiary": "#fb923c",
    "tertiaryDark": "#ea580c",
    "grayLight": "#1f2937",
    "gray": "#6b7280",
    "grayDark": "#9ca3af",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#ffffff",
    "light": "#000000"
  },
  "logo": {
    "dark": "https://docs.doccupine.com/logo-dark.svg",
    "light": "https://docs.doccupine.com/logo-light.svg"
  }
}
\`\`\`

## Modes
- **default**: The base color palette for your site.
- **dark**: Dark‑mode palette.

## Fields
- **primaryLight**: A lighter variant of your brand color, used for subtle accents and backgrounds.
- **primary**: The main brand color.
- **primaryDark**: A darker variant of your brand color for emphasis and hover states.
- **secondaryLight**: A lighter variant of your secondary color, used for subtle accents and backgrounds.
- **secondary**: The secondary brand color used for highlights and UI accents.
- **secondaryDark**: A darker variant of your secondary color for emphasis and hover states.
- **tertiaryLight**: A lighter variant of your tertiary color, used for subtle accents and backgrounds.
- **tertiary**: The tertiary accent color.
- **tertiaryDark**: A darker variant of your tertiary color for emphasis and hover states.
- **grayLight**: Light gray for surfaces and borders.
- **gray**: Neutral gray for text and UI elements.
- **grayDark**: Dark gray for headings or high‑contrast text.
- **success**: Positive/confirmation color.
- **error**: Error/destructive color.
- **warning**: Warning/attention color.
- **info**: Informational/highlight color.
- **dark**: The darkest/base color (often page background in dark mode).
- **light**: The lightest/base color (often page background in light mode).
- **logo.light**: Path or URL to the logo used on light backgrounds. Recommended size: 164×30 px.
- **logo.dark**: Path or URL to the logo used on dark backgrounds. Recommended size: 164×30 px.

## Behavior
- **Placement**: Put \`theme.json\` in the project root alongside \`config.json\`.
- **Partial palettes**: If a key is missing in a mode, consumers may fall back to the \`default\` value.
- **Logo size**: Recommended dimensions are 164px width and 30px height.

<Callout type="warning">
  Use valid hex colors (e.g., \`#22c55e\`). Invalid color values may cause unexpected rendering.
</Callout>

## Tips
- **Contrast**: Ensure sufficient contrast between text and backgrounds for readability.
- **Branding**: Start with your brand’s \`primary\` color, then derive \`primaryLight\` and \`primaryDark\`.
- **Iterate**: Adjust colors and refresh the site to preview changes quickly.

# Demo
In the following demos, you can see how the theme can be changed. To override the theme, create a \`theme.json\` file in the project root and copy paste the code below.

<DemoTheme variant="purple" />
<DemoTheme variant="green" />
<DemoTheme variant="yellow" />
<DemoTheme />

## Purple

\`\`\`json
{
  "default": {
    "primaryLight": "#c4b5fd",
    "primary": "#8b5cf6",
    "primaryDark": "#5b21b6",
    "secondaryLight": "#86efac",
    "secondary": "#22c55e",
    "secondaryDark": "#15803d",
    "tertiaryLight": "#fbbf24",
    "tertiary": "#f59e0b",
    "tertiaryDark": "#d97706",
    "grayLight": "#f3f4f6",
    "gray": "#9ca3af",
    "grayDark": "#374151",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#000000",
    "light": "#ffffff"
  },
  "dark": {
    "primaryLight": "#ddd6fe",
    "primary": "#a78bfa",
    "primaryDark": "#7c3aed",
    "secondaryLight": "#6ee7b7",
    "secondary": "#10b981",
    "secondaryDark": "#065f46",
    "tertiaryLight": "#fed7aa",
    "tertiary": "#fb923c",
    "tertiaryDark": "#ea580c",
    "grayLight": "#1f2937",
    "gray": "#6b7280",
    "grayDark": "#9ca3af",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#ffffff",
    "light": "#000000"
  }
}
\`\`\`
<DemoTheme variant="purple" />

## Green

\`\`\`json
{
  "default": {
    "primaryLight": "#86efac",
    "primary": "#22c55e",
    "primaryDark": "#15803d",
    "secondaryLight": "#c4b5fd",
    "secondary": "#8b5cf6",
    "secondaryDark": "#5b21b6",
    "tertiaryLight": "#fbbf24",
    "tertiary": "#f59e0b",
    "tertiaryDark": "#d97706",
    "grayLight": "#f3f4f6",
    "gray": "#9ca3af",
    "grayDark": "#374151",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#000000",
    "light": "#ffffff"
  },
  "dark": {
    "primaryLight": "#6ee7b7",
    "primary": "#10b981",
    "primaryDark": "#065f46",
    "secondaryLight": "#ddd6fe",
    "secondary": "#a78bfa",
    "secondaryDark": "#7c3aed",
    "tertiaryLight": "#fed7aa",
    "tertiary": "#fb923c",
    "tertiaryDark": "#ea580c",
    "grayLight": "#1f2937",
    "gray": "#6b7280",
    "grayDark": "#9ca3af",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#ffffff",
    "light": "#000000"
  }
}
\`\`\`
<DemoTheme variant="green" />

## Yellow

\`\`\`json
{
  "default": {
    "primaryLight": "#fbbf24",
    "primary": "#f59e0b",
    "primaryDark": "#d97706",
    "secondaryLight": "#c4b5fd",
    "secondary": "#8b5cf6",
    "secondaryDark": "#5b21b6",
    "tertiaryLight": "#86efac",
    "tertiary": "#22c55e",
    "tertiaryDark": "#15803d",
    "grayLight": "#f3f4f6",
    "gray": "#9ca3af",
    "grayDark": "#374151",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#000000",
    "light": "#ffffff"
  },
  "dark": {
    "primaryLight": "#fed7aa",
    "primary": "#fb923c",
    "primaryDark": "#ea580c",
    "secondaryLight": "#ddd6fe",
    "secondary": "#a78bfa",
    "secondaryDark": "#7c3aed",
    "tertiaryLight": "#6ee7b7",
    "tertiary": "#10b981",
    "tertiaryDark": "#065f46",
    "grayLight": "#1f2937",
    "gray": "#6b7280",
    "grayDark": "#9ca3af",
    "success": "#10b981",
    "error": "#f43f5e",
    "warning": "#f59e0b",
    "info": "#3b82f6",
    "dark": "#ffffff",
    "light": "#000000"
  }
}
\`\`\`

<DemoTheme variant="yellow" />`;
