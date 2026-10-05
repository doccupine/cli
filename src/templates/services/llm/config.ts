export const llmConfigTemplate = `import type {
  LLMConfig,
  LLMProvider,
  ProviderDefaults,
} from "@/services/llm/types";
const PROVIDER_DEFAULTS: ProviderDefaults = {
  openai: {
    chat: "gpt-4.1-mini",
    embedding: "text-embedding-3-small",
  },
  anthropic: {
    chat: "claude-sonnet-4-5-20250929",
    embedding: "text-embedding-3-small", // Fallback to OpenAI
  },
  google: {
    chat: "gemini-2.5-flash-lite",
    embedding: "gemini-embedding-001",
  },
};
// Used when LLM_TEMPERATURE is unset, for models that accept a temperature.
const DEFAULT_TEMPERATURE = 0;
const MAX_TEMPERATURE: Record<LLMProvider, number> = {
  openai: 2,
  anthropic: 1,
  google: 2,
};
// OpenAI's reasoning models (o1, o3, o4-mini) and its GPT-5 line onwards reject
// a custom temperature, some of them any temperature at all. A vendor prefix
// such as OpenRouter's "openai/" is ignored.
const NO_TEMPERATURE_MODEL = /^(?:[\\w-]+\\/)?(?:gpt-(?:[5-9]|\\d{2,})|o\\d)/;
const warnings = new Set<string>();
function warnOnce(message: string): void {
  if (warnings.has(message)) return;
  warnings.add(message);
  console.warn(message);
}
function acceptsTemperature(provider: LLMProvider, chatModel: string): boolean {
  return provider !== "openai" || !NO_TEMPERATURE_MODEL.test(chatModel);
}
// Returns undefined when no temperature should be sent, leaving the model on
// its own default: LLM_TEMPERATURE=default, or a model that rejects one.
function resolveTemperature(
  provider: LLMProvider,
  chatModel: string,
): number | undefined {
  const raw = process.env.LLM_TEMPERATURE?.trim() ?? "";
  if (raw.toLowerCase() === "default") return undefined;
  const accepted = acceptsTemperature(provider, chatModel);
  if (raw === "") return accepted ? DEFAULT_TEMPERATURE : undefined;
  const value = Number(raw);
  const max = MAX_TEMPERATURE[provider];
  if (!Number.isFinite(value) || value < 0 || value > max) {
    warnOnce(
      \`Ignoring LLM_TEMPERATURE="\${raw}": \${provider} accepts a number from 0 to \${max}, or "default".\`,
    );
    return accepted ? DEFAULT_TEMPERATURE : undefined;
  }
  if (!accepted) {
    warnOnce(
      \`Ignoring LLM_TEMPERATURE: \${chatModel} does not accept a custom temperature.\`,
    );
    return undefined;
  }
  return value;
}
function validateAPIKeys(provider: LLMProvider): void {
  const requiredKeys: Record<LLMProvider, string> = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GOOGLE_API_KEY",
  };
  const keyName = requiredKeys[provider];
  const keyValue = process.env[keyName];
  if (!keyValue) {
    throw new Error(
      \`Missing API key for \${provider}. Please set \${keyName} in your environment variables.\`,
    );
  }
  if (provider === "anthropic" && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "Anthropic provider requires OPENAI_API_KEY for embeddings. Please set OPENAI_API_KEY in your environment variables.",
    );
  }
}
export function isLLMAvailable(): boolean {
  const provider = (process.env.LLM_PROVIDER || "openai") as LLMProvider;
  const requiredKeys: Record<LLMProvider, string> = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GOOGLE_API_KEY",
  };
  const keyName = requiredKeys[provider];
  if (!keyName || !process.env[keyName]) return false;
  if (provider === "anthropic" && !process.env.OPENAI_API_KEY) return false;
  return true;
}
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || "openai") as LLMProvider;
  if (!["openai", "anthropic", "google"].includes(provider)) {
    throw new Error(
      \`Invalid LLM_PROVIDER: \${provider}. Must be one of: openai, anthropic, google\`,
    );
  }
  validateAPIKeys(provider);
  const defaults = PROVIDER_DEFAULTS[provider];
  // Vectors are Matryoshka-truncated to this many dimensions before being
  // stored as int8, keeping the prebuilt search index small. Must match between
  // build time and runtime; a mismatch forces a re-embed. Values >= the model's
  // native dimension keep full precision (default: 512).
  const rawDims = process.env.LLM_EMBEDDING_DIMS;
  let embeddingDims = 512;
  if (rawDims !== undefined && rawDims !== "") {
    const parsed = parseInt(rawDims, 10);
    if (Number.isFinite(parsed) && parsed >= 0) embeddingDims = parsed;
  }
  const chatModel = process.env.LLM_CHAT_MODEL || defaults.chat;
  return {
    provider,
    chatModel,
    embeddingModel: process.env.LLM_EMBEDDING_MODEL || defaults.embedding,
    embeddingDims,
    temperature: resolveTemperature(provider, chatModel),
  };
}
`;
