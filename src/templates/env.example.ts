export const envExampleTemplate = `# LLM Provider Configuration
# Choose your preferred LLM provider: openai, anthropic, or google
LLM_PROVIDER=openai

# API Keys (set the one matching your provider)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Override default models
# OpenAI models: gpt-4.1-nano, gpt-5-mini, gpt-5-nano, gpt-5
# Anthropic models: claude-sonnet-4-5-20250929, claude-haiku-4-5-20251001, claude-opus-4-5-20251101
# Google models: gemini-2.5-flash-lite, gemini-2.5-pro, gemini-2.5-flash
# LLM_CHAT_MODEL=gpt-4.1-nano

# Optional: Override default embedding model
# OpenAI: text-embedding-3-small, text-embedding-3-large
# Google: text-embedding-004
# Note: Anthropic doesn't provide embeddings, will fallback to OpenAI
# LLM_EMBEDDING_MODEL=text-embedding-3-small

# Optional: Set temperature (0-1, default: 1)
# LLM_TEMPERATURE=1
`;
