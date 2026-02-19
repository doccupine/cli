export const envExampleTemplate = `# LLM Provider Configuration
# Choose your preferred LLM provider: openai, anthropic, or google
LLM_PROVIDER=openai

# API Keys (set the one matching your provider)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Override default chat model
# See available models at your provider's docs:
#   OpenAI:    https://platform.openai.com/docs/models
#   Anthropic: https://docs.anthropic.com/claude/docs/models-overview
#   Google:    https://ai.google.dev/models/gemini
# LLM_CHAT_MODEL=

# Optional: Override default embedding model
# See available embedding models at your provider's docs:
#   OpenAI: https://platform.openai.com/docs/guides/embeddings
#   Google: https://ai.google.dev/gemini-api/docs/embeddings
# Note: Anthropic doesn't provide embeddings, will fallback to OpenAI
# LLM_EMBEDDING_MODEL=

# Optional: Set temperature (0-1, default: 0)
# LLM_TEMPERATURE=0
`;
