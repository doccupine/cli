export const llmTypesTemplate = `export type LLMProvider = "openai" | "anthropic" | "google";

export interface LLMConfig {
  provider: LLMProvider;
  chatModel: string;
  embeddingModel: string;
  embeddingDims: number;
  /** Omitted when the model should use its own default. */
  temperature?: number;
}

interface ProviderModels {
  chat: string;
  embedding: string;
}

export type ProviderDefaults = Record<LLMProvider, ProviderModels>;
`;
