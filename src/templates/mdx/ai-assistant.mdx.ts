export const aiAssistantMdxTemplate = `---
title: "AI Assistant"
description: "Integrate AI capabilities into your Doccupine documentation using OpenAI, Anthropic, or Google Gemini."
date: "2026-02-19"
category: "Configuration"
categoryOrder: 3
order: 8
---
# AI Assistant
Doccupine supports AI integration to enhance your documentation experience. You can use OpenAI, Anthropic, or Google Gemini to power AI features in your documentation site. The AI assistant uses your documentation content as context, allowing users to ask questions about your docs and receive accurate answers based on the documentation.

## Setup
To enable AI features, create an \`.env\` file in the directory where your website is generated. By default, this is the \`nextjs-app/\` directory.

## Configuration
Create an \`.env\` file with the following configuration options:

\`\`\`env
# LLM Provider Configuration
# Choose your preferred LLM provider: openai, anthropic, or google
LLM_PROVIDER=openai

# API Keys (set the one matching your provider)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Override default chat model (see your provider's docs for available models)
# LLM_CHAT_MODEL=your-model-id

# Optional: Override default embedding model (see your provider's docs for available models)
# Note: Anthropic doesn't provide embeddings, will fallback to OpenAI
# LLM_EMBEDDING_MODEL=your-embedding-model-id

# Optional: Set temperature (0-1, default: 0)
# LLM_TEMPERATURE=0
\`\`\`

## Provider Selection
Set \`LLM_PROVIDER\` to one of the following values:
- \`openai\` - Use OpenAI's models
- \`anthropic\` - Use Anthropic's models
- \`google\` - Use Google's models

## API Keys
You need to set the API key that matches your chosen provider:
- For OpenAI: Set \`OPENAI_API_KEY\`
- For Anthropic: Set \`ANTHROPIC_API_KEY\`
- For Google: Set \`GOOGLE_API_KEY\`

<Callout type="warning">
  Keep your API keys secure. Never commit your \`.env\` file to version control.
</Callout>

<Callout type="note">
  Doccupine automatically adds \`.env\` to your \`.gitignore\` file.
</Callout>

## Using Anthropic with OpenAI
If you want to use Anthropic as your LLM provider, you must also have an OpenAI API key set. Here's why:

### The Situation
Anthropic (Claude) does not provide an embeddings API. They only offer chat/completion models, not text embeddings.

Your RAG (Retrieval-Augmented Generation) system has two components:
- **Chat/Completion** - Generates answers, works with Anthropic.
- **Embeddings** - Creates vector representations of text for search, Anthropic doesn't provide this.

When using Anthropic as your \`LLM_PROVIDER\`, Doccupine will use Anthropic for chat/completion tasks, but will automatically fallback to OpenAI for embeddings. This means you need both API keys configured:

\`\`\`env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
\`\`\`

This hybrid approach allows you to leverage Anthropic's powerful chat models while still having access to embeddings functionality through OpenAI.

## Optional Settings

### Chat Model
Override the default chat model by uncommenting and setting \`LLM_CHAT_MODEL\`. You can use any available model from your chosen provider. For a complete list of available models, refer to the official documentation:
- [OpenAI Models](https://platform.openai.com/docs/models)
- [Anthropic Models](https://docs.anthropic.com/claude/docs/models-overview)
- [Google Gemini Models](https://ai.google.dev/models/gemini)

### Embedding Model
Override the default embedding model by uncommenting and setting \`LLM_EMBEDDING_MODEL\`. For a complete list of available embedding models, refer to the official documentation:
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Google Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- **Anthropic**: Anthropic doesn't provide embeddings. If you use Anthropic as your provider, Doccupine will fallback to OpenAI for embeddings.

### Temperature
Control the randomness of AI responses by setting \`LLM_TEMPERATURE\` to a value between 0 and 1:
- \`0\` - More deterministic and focused responses (default)
- \`1\` - More creative and varied responses`;
