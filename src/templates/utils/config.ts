export const configTemplate = `import { z } from "zod";
import configData from "@/config.json";

const configSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
});

type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse(configData);
`;
