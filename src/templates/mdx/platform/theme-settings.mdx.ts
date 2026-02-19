export const platformThemeSettingsMdxTemplate = `---
title: "Theme Settings"
description: "Customize your documentation site's color palette, logos, and dark mode appearance."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 2
order: 1
section: "Platform"
---
# Theme Settings
The Theme settings page gives you full control over your documentation site's visual appearance. Customize colors, upload logos, and configure separate light and dark mode palettes.

## Color palette
The theme system uses an 18-color palette organized into groups:

- **Primary** (light, base, dark) - your brand's main color, used for links, buttons, and accents
- **Secondary** (light, base, dark) - complementary color for secondary elements
- **Tertiary** (light, base, dark) - additional accent color
- **Gray** (light, base, dark) - neutral tones for text, borders, and backgrounds
- **Status colors** (success, error, warning, info) - used for callouts and status indicators
- **Base colors** (dark, light) - the core background and foreground colors

Click any color swatch to open a color picker and adjust the value.

## Dark mode
Enable the dark mode toggle to configure a separate palette for dark mode. When enabled, your site automatically switches based on the visitor's system preference.

The dark mode palette uses the same 18-color structure, letting you fine-tune every color for both appearances.

## Logos
Upload separate logo images for light and dark backgrounds:

- **Light background logo** - shown when the site is in light mode
- **Dark background logo** - shown when the site is in dark mode

<Callout type="note">
  If you only upload one logo, it will be used for both modes.
</Callout>

## Reset to defaults
Each palette section has a **Reset to defaults** button that restores the original Doccupine color values. This is useful if you want to start over after experimenting.

## How it works
Theme settings are stored in \`theme.json\` at the root of your repository. Like all configuration, changes are staged as pending and go live when you publish.`;
