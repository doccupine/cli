export const envExampleTemplate = `# Public Site URL
# Used by sitemap.xml and robots.txt. Overrides \`url\` in config.json when set.
# NEXT_PUBLIC_SITE_URL=https://docs.example.com

# Password Protection (optional)
# Set a shared password to gate the whole site behind a login screen. When set,
# pages require the password, the content APIs (chat + search) return 401
# without it, and the site is hidden from search engines and crawlers. Leave
# unset (or remove) to keep the site public.
# SITE_PASSWORD=choose-a-strong-shared-password

# Paid API Access (recommended for public deployments with AI enabled)
# Public documentation remains intentionally public by default. Set RAG_API_KEY
# to require Authorization: Bearer <key> for /api/rag and prevent anonymous LLM
# spend. The browser chat cannot safely hold this server secret; use
# SITE_PASSWORD instead when authenticated browser chat is required.
# RAG_API_KEY=generate-a-long-random-secret
# Set DOCS_API_KEY to require bearer authentication for /api/mcp. If omitted,
# MCP follows the site access mode and remains public on an intentionally public
# documentation site.
# DOCS_API_KEY=generate-another-long-random-secret

# Remote Dev Access (optional, dev server only)
# Hostnames (besides localhost) allowed to load the Next.js dev server's
# resources, for when you browse the dev server over a LAN IP or a
# Tailscale/VPN hostname. Without this, Next blocks the dev HMR socket for
# such hosts and the page renders but never becomes interactive. Ignored by
# production builds. Comma-separate multiple hostnames.
# ALLOWED_DEV_ORIGINS=my-machine.tailnet-name.ts.net

# LLM Provider Configuration
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

# Optional: Embedding dimensions for the prebuilt search index (default: 512)
# Doc vectors are Matryoshka-truncated to this many dimensions and stored as
# int8, which keeps services/mcp/docs-index.json small (~20x smaller than raw
# floats) so large doc sets don't stall the AI chat on serverless cold starts.
# Lower = smaller index, slightly lower recall. Values >= the model's native
# dimension keep full precision. Rebuild after changing this.
# LLM_EMBEDDING_DIMS=512
`;
