import { BANNER_MAX_LENGTH } from "../../lib/banner.js";
import { SITE_TEMPLATES } from "../../lib/templates.js";

// `template` picks the site design at generation time; the generator has
// already warned about an unknown value and fallen back to the default, so
// the runtime schema drops it instead of failing the build.
export const configTemplate = `import { z } from "zod";
import configData from "@/config.json";

const configSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  url: z.string().url().optional(),
  template: z.enum([${SITE_TEMPLATES.map((name) => JSON.stringify(name)).join(", ")}]).optional().catch(undefined),
  // A site-wide announcement above the header. An invalid value is dropped
  // (the generator warns about it) rather than failing the build.
  banner: z
    .object({
      content: z.string().trim().min(1).max(${BANNER_MAX_LENGTH}),
      dismissible: z.boolean().optional(),
    })
    .optional()
    .catch(undefined),
});

type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse(configData);
`;
