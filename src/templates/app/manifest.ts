import { DEFAULT_DESCRIPTION, DEFAULT_SITE_NAME } from "../../lib/constants.js";

export const manifestTemplate = `import type { MetadataRoute } from "next";
import { colorsLight } from "@/app/theme";
import { config } from "@/utils/config";
import { manifestIcons } from "@/utils/icons";

// Served by Next as /manifest.webmanifest and linked from every page's head
// automatically. theme_color and background_color come from the light
// palette: the manifest is static, so it cannot follow the cookie-based
// mode - the pre-paint script and Cherry's provider own the live chrome
// color through the theme-color meta.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.name || "${DEFAULT_SITE_NAME}",
    short_name: config.name || "${DEFAULT_SITE_NAME}",
    description:
      config.description ||
      "${DEFAULT_DESCRIPTION}",
    start_url: "/",
    display: "standalone",
    background_color: colorsLight.light,
    theme_color: colorsLight.primary,
    ...(manifestIcons.length > 0 ? { icons: manifestIcons } : {}),
  };
}
`;
