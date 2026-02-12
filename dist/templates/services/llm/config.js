export const llmConfigTemplate = `import type {
  LLMConfig,
  LLMProvider,
  ProviderDefaults,
} from "@/services/llm/types";
const PROVIDER_DEFAULTS: ProviderDefaults = {
  openai: {
    chat: "gpt-5-nano",
    embedding: "text-embedding-3-small",
  },
  anthropic: {
    chat: "claude-sonnet-4-5-20250929",
    embedding: "text-embedding-3-small", // Fallback to OpenAI
  },
  google: {
    chat: "gemini-2.5-flash-lite",
    embedding: "text-embedding-004",
  },
};
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
    console.warn(
      "Anthropic provider requires OPENAI_API_KEY for embeddings. Please set OPENAI_API_KEY in your environment variables.",
    );
  }
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
  return {
    provider,
    chatModel: process.env.LLM_CHAT_MODEL || defaults.chat,
    embeddingModel: process.env.LLM_EMBEDDING_MODEL || defaults.embedding,
    temperature: parseFloat(process.env.LLM_TEMPERATURE || "1"),
  };
}
export function getLLMDisplayName(config?: LLMConfig): string {
  const c = config || getLLMConfig();
  const providerNames: Record<LLMProvider, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
  };
  return \`\${providerNames[c.provider]} (\${c.chatModel})\`;
}
export function isLLMConfigured(): boolean {
  try {
    getLLMConfig();
    return true;
  } catch {
    return false;
  }
}
`;
