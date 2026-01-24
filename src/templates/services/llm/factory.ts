export const llmFactoryTemplate = `import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import type { LLMConfig } from "@/services/llm/types";

/**
 * Creates a chat model instance based on the provider configuration
 */
export function createChatModel(config: LLMConfig) {
  switch (config.provider) {
    case "openai":
      return new ChatOpenAI({
        model: config.chatModel,
        temperature: config.temperature,
      });

    case "anthropic":
      return new ChatAnthropic({
        model: config.chatModel,
        temperature: config.temperature,
      });

    case "google":
      return new ChatGoogleGenerativeAI({
        model: config.chatModel,
        temperature: config.temperature,
      });

    default:
      throw new Error(\`Unsupported LLM provider: \${config.provider}\`);
  }
}

/**
 * Creates an embeddings instance based on the provider configuration
 * Note: Anthropic doesn't provide embeddings, so we fallback to OpenAI
 */
export function createEmbeddings(config: LLMConfig) {
  switch (config.provider) {
    case "openai":
      return new OpenAIEmbeddings({
        model: config.embeddingModel,
      });

    case "google":
      return new GoogleGenerativeAIEmbeddings({
        model: config.embeddingModel,
      });

    case "anthropic":
      // Anthropic doesn't have embeddings API
      // Fallback to OpenAI embeddings
      console.warn(
        "Anthropic provider selected but no native embeddings available. Falling back to OpenAI embeddings.",
      );
      return new OpenAIEmbeddings({
        model: "text-embedding-3-small",
      });

    default:
      throw new Error(
        \`Unsupported LLM provider for embeddings: \${config.provider}\`,
      );
  }
}`;
