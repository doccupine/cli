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
});

type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse(configData);
`;
