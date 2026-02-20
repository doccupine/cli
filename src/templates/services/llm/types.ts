export const llmTypesTemplate = `export type LLMProvider = "openai" | "anthropic" | "google";

export interface LLMConfig {
  provider: LLMProvider;
  chatModel: string;
  embeddingModel: string;
  temperature: number;
}

interface ProviderModels {
  chat: string;
  embedding: string;
}

export type ProviderDefaults = Record<LLMProvider, ProviderModels>;
`;
