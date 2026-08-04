import { DEFAULT_FAVICON } from "../../lib/constants.js";

export const iconsTemplate = `import type { Metadata } from "next";
import iconsData from "@/icons.json";
import { config } from "@/utils/config";

// icons.json is written by the Doccupine CLI from icon files at the project
// root (icon.png, icon-dark.png, apple-icon.png). Every URL carries a
// content-hash query so a replaced icon busts browser caches.
interface IconManifest {
  icon?: string;
  iconDark?: string;
  appleIcon?: string;
}

const icons = iconsData as IconManifest;

const fallbackIcon = config.icon || "${DEFAULT_FAVICON}";

/** Single icon URL for JSON-LD logos and other one-value consumers. */
export const primaryIconUrl: string = icons.icon ?? fallbackIcon;

function buildSiteIcons(): Metadata["icons"] {
  if (!icons.icon && !icons.appleIcon) return fallbackIcon;
  const iconEntries: { url: string; media?: string }[] = [];
  if (icons.icon && icons.iconDark) {
    iconEntries.push({
      url: icons.icon,
      media: "(prefers-color-scheme: light)",
    });
    iconEntries.push({
      url: icons.iconDark,
      media: "(prefers-color-scheme: dark)",
    });
  } else if (icons.icon) {
    iconEntries.push({ url: icons.icon });
  }
  return {
    icon: iconEntries.length > 0 ? iconEntries : fallbackIcon,
    ...(icons.appleIcon ? { apple: icons.appleIcon } : {}),
  };
}

export const siteIcons: Metadata["icons"] = buildSiteIcons();
`;
