export const llmTypesTemplate = `export type LLMProvider = "openai" | "anthropic" | "google";

export interface LLMConfig {
  provider: LLMProvider;
  chatModel: string;
  embeddingModel: string;
  temperature: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderModels {
  chat: string;
  embedding: string;
}

export type ProviderDefaults = Record<LLMProvider, ProviderModels>;
`;
