# Changelog

## 0.0.67

- Fix dark-mode FOUC on Safari and Firefox

## 0.0.66

- Rename deployment MDX templates to reduce naming confusion

## 0.0.65

- Add source links below AI answers in chat
- Add AI internal links prompt and usage budget docs
- Pre-compute page URLs from chunk URIs in RAG context
- Decouple ActionBar from ChatContext
- Extract `useLockBodyScroll` hook from Chat
- Separate close and reset actions in chat with improved UX
- Use Next.js Link component for source links in chat
- Improve line wrapping in DocsSideBar
- Use `dvh` viewport units and adjust sidebar offsets
- Show sidebar border-right only on desktop breakpoint
- Update dependencies

## 0.0.64

- Add components index page and improve content links
- Add welcome greeting when AI chat panel opens
- Add optional `href` prop for link cards
- Overhaul layout and chat UI components
- Improve docs sidebar offset and active item visibility
- Reduce horizontal padding on footer and static links layout
- Fix table scroll, step icon alignment, and table header padding
- Fix inaccuracies and add missing props across MDX templates
- Update dependencies

## 0.0.63

- Add per-page `name` and `image` metadata overrides for Open Graph
- Pass Next.js stdout through in verbose mode
- Refactor CLI into modular `src/lib/` structure (types, utils, config, constants, metadata, structures, layout)
- Improve footer links responsiveness and chat-aware spacing
- Update dependencies

## 0.0.62

- Add multi-turn conversation history support for AI chat
- Update dependencies

## 0.0.60

- Add sections support for organizing docs into multiple areas via `sections.json` or frontmatter fields (`section`, `sectionOrder`, `sectionLabel`)
- Add public directory watching and automatic static asset syncing
- Smooth scrolling for sidebar navigation and heading anchors

## 0.0.56

- Add branding verification with signature-based key

## 0.0.52

- Add type safety, security hardening, and stricter linting across generated templates
- Harden SSE streaming, error recovery, and security for AI chat

## 0.0.50

- Remove `dist/` from repository and add vitest testing

## 0.0.44

- Improve AI system context for better chat responses

## 0.0.41

- Default AI model to `gpt-4.1-nano`
- Update chunk sizes and supported OpenAI models

## 0.0.35

- Add media and asset components

## 0.0.32

- Add icon support for navigation links

## 0.0.30

- Add static footer links configuration
- Add footer with version display from `package.json`
- Use pnpm as package manager when available

## 0.0.28

- Add MCP server for semantic doc search
- Add AI chat integration with RAG (SSE streaming, LangChain)
- Add AI assistant MDX template

## 0.0.25

- Add local font support
- Add custom Google Fonts configuration

## 0.0.23

- Add grayscale default color palette

## 0.0.21

- Add action bar with copy-to-clipboard for code blocks

## 0.0.18

- Add code copy button
- Improve theming and dark mode support

## 0.0.16

- Add theme logo support
- Add theme configuration via `theme.json`

## 0.0.14

- Add Steps component
- Add Columns layout component

## 0.0.12

- Add SSR theme toggle with system preference detection
- Add custom configuration support (`doccupine.json`)

## 0.0.10

- Switch from `react-markdown` to `@mdx-js/react` for MDX rendering
- Add custom component templates (Callout, Card, Accordion, Code, etc.)
- Add image, video, and iframe global styles

## 0.0.7

- Add document index and sidebar navigation

## 0.0.1

- Initial public release with MDX-to-Next.js generation, file watching, and dev server
