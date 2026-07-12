# Changelog

## 0.0.124

- Let the `Card`, `Step`, and `Update` components omit their title/description text so no empty element is rendered when it is missing: `Card`'s `title` and `Step`'s `title` are now optional (the title element renders only when a title is present, or for a step when a title or icon is present), and `Update`'s `description` is now optional (the description line renders only when provided), so a title-less card or step no longer leaves an empty bold line and a description-less update no longer leaves an empty styled box consuming the sidebar gap. The Cards, Steps, and Update docs pages mark these props optional
- Stop a label-less `<Update>` from crashing the generated page: the shared heading slugger is now fed only when an `<Update>` actually has a `label` (the injected anchor id falls back to `undefined` otherwise), and `slugify` tolerates nullish input, so the shared helper can no longer throw a `TypeError` on an undefined label and blank the whole page

## 0.0.123

- Let the search modal hand its query straight to the AI assistant: when chat is enabled, the modal shows a desktop "Ask AI" button (advertising an Option+Enter shortcut) that submits the typed query to the assistant and closes the modal, opening the chat panel on the answer. A new `askAssistant` bridge on the chat context submits immediately when the assistant is idle, or - if a response is already streaming - opens the panel and pre-fills the input so the question is ready to send the moment the current answer finishes. The greeting is seeded consistently as the first turn (via a shared `INITIAL_GREETING`) so a handed-off question always reads against a started conversation
- Open search results without leaving the page: Cmd/Ctrl+Enter (or Cmd/Ctrl+click) opens the highlighted result in a new background tab, and Shift+Enter (or Shift+click) opens it in a separate, centered browser window, both with `noopener,noreferrer` so the new context can't reach back through `window.opener`; plain Enter/click still navigates in place within the app
- Replace the search results' per-item background fade with a single highlight that glides between rows: the active item is measured in a pre-paint `useLayoutEffect` and the indicator is positioned and sized from that measurement, so it slides on `transform`/`height` as the selection moves while committing its first position without an entrance animation, and the active result's title tints to the primary color. `prefers-reduced-motion` disables the glide
- Scroll the active result into view in the same pre-paint pass that positions the highlight - adjusting the list's `scrollTop` directly instead of `scrollIntoView` (which could also pan ancestors) - so the highlight and the scrolled row can never desync into a one-frame flicker, and re-filtering on a new query re-scrolls the reset selection into view even when its index is unchanged
- Surface the keyboard-shortcut hint on the theme toggle in the sidebar and the password-gate footer via the new cherry-styled-components `ThemeToggle $shortcut` prop
- Add a dedicated Model Context Protocol (MCP) documentation page covering ready-to-paste connection snippets for Claude, Cursor, and other MCP-compatible apps, and MCP server authentication (the `DOCS_API_KEY` Bearer-token guard); move the MCP authentication details off the AI Assistant page onto it, leaving the AI Assistant page pointing readers to the new page
- Update generated app dependencies: cherry-styled-components to ^0.2.11 (for the `ThemeToggle $shortcut` prop), posthog-js to ^1.399.2, and posthog-node to ^5.41.0

## 0.0.122

- Fix a blank gap appearing above the "Answering..." loader in the generated docs chat between sending a question and the first streamed token: the RAG client (`Chat.ts`) used to insert an empty answer bubble (`{ text: "", answer: true }`) as soon as the response headers arrived, and that bubble's `margin: 20px 0` rendered as an empty block sitting on top of the loader while the assistant was still connecting. The answer bubble is now created lazily on the first streamed token (or the done event for an empty response), and the loader shows only while the last message is still the user's question, so "Answering..." sits flush with no gap and is cleanly replaced by the text the moment it starts appearing

## 0.0.121

- Fix the generated docs chat hanging forever (connecting, streaming keep-alive heartbeats, but never answering) when a deployment's prebuilt embeddings index is missing on a large doc set: 0.0.119 began shipping a precomputed `services/mcp/docs-index.json`, but the build-time embed step fails soft, so a build without an embedding API key - or one whose provider/model/`dims` no longer match the current LLM config - leaves no usable index, and the MCP server then fell back to embedding the entire doc set on demand inside a single `/api/rag` request. That fallback runs one embedding round trip per batch and, past a few hundred chunks, cannot finish within a serverless function's time limit, so the request stalled until the platform timeout instead of ever answering. The server now caps on-demand embedding in production at `RAG_RUNTIME_EMBED_MAX_CHUNKS` chunks (default 400) and, above that, fails fast with a new `IndexNotBuiltError` whose message ("The AI assistant is temporarily unavailable ... redeploy with an embedding API key available at build time") surfaces to the client as an SSE `error` event, so the chat shows a clear message instead of hanging, and a client-forced `refresh` can no longer burn embedding quota re-embedding a too-large set. `next dev` has no time cap, so local development keeps embedding on demand and works without running the build; the new `RAG_RUNTIME_EMBED_MAX_CHUNKS` variable is overridable per deployment (`0` always requires a prebuilt index) and is parsed defensively so a bad value falls back to the default rather than silently disabling the guard
- Make a missing or broken index diagnosable without server-log access: `getIndexStatus` and `GET /api/rag` now return a `reason` field (null when healthy) carrying the actionable message about the missing or provider/model/dims-mismatched index, and a failed eager index build at server startup no longer surfaces as an `unhandledRejection` - the first request retries via `ensureDocsIndex` and returns a real error to the client

## 0.0.120

- Stop the generated docs chat from idling on large documentation sets by shrinking the precomputed embeddings index roughly 20x (a 5,000-chunk index drops from ~150 MB to ~8 MB): 0.0.119 shipped `services/mcp/docs-index.json` with every chunk's embedding stored as a raw JSON float array, so at the default 1,536-dimension model a few hundred pages produced a 100 MB+ file that `JSON.parse`'d into millions of boxed numbers on every serverless cold start; the function then OOM'd or stalled for seconds (the chat connected and emitted its keep-alive but never answered) and the index pressed against Vercel's 250 MB function-size limit because it is bundled into both `/api/rag` and `/api/mcp`. A new shared `services/mcp/vector.ts` now applies the same two transforms at build time and at query time so stored and query vectors can never diverge: each vector is Matryoshka-truncated to `LLM_EMBEDDING_DIMS` (default 512) and renormalized (`text-embedding-3-*` and `gemini-embedding-001` are MRL-trained, so a renormalized prefix is a valid lower-dimension embedding), then quantized to int8 and stored as base64. Because cosine similarity is scale-invariant, the per-vector quantization scale never has to be stored and search scores the float query vector directly against the int8 vector with no dequantization step, so retrieval ranking is preserved: the int8 top result matches the full-precision top result for the overwhelming majority of queries, with negligible score error
- Guard the compact index against transform drift and make it tunable: `docs-index.json` now records its `dims` and `quantization` alongside the existing provider and model, and the MCP server rejects a precomputed index whose transform no longer matches the current config, falling back to on-demand embedding that reduces and quantizes identically so both code paths score the same. A new optional `LLM_EMBEDDING_DIMS` environment variable (default 512; lower trades a little recall for a smaller index, and values at or above the model's native dimension keep full precision) is documented in `.env.example`, and the Model Context Protocol docs describe the new compaction step

## 0.0.119

- Precompute the generated docs' chat embeddings at build time so the AI assistant no longer re-embeds the entire doc set on every serverless cold start, which was the root cause of slow first chats and the proxy timeouts they triggered: a new `scripts/build-docs-index.mts` step embeds every doc chunk in batches and writes `services/mcp/docs-index.json` before `next build`, the MCP server loads that precomputed index at runtime and only falls back to re-embedding when the file is missing or its provider/model no longer match the current LLM config, and `next.config.ts` bundles the index into the `/api/rag` and `/api/mcp` serverless functions via `outputFileTracingIncludes` (a dynamic `fs` read is otherwise invisible to Next's file tracing). The embed step fails soft (a missing key or API error exits 0) so the build always proceeds, and the generated `docs-index.json` artifact is git- and Prettier-ignored. Update the Model Context Protocol docs to describe the new build-time indexing: embeddings are precomputed and shipped with the site and loaded on startup, runtime embedding is only a fallback for a missing index or a provider/model mismatch, and refreshing content is a rebuild or redeploy rather than a server restart
- Fix the generated docs chat intermittently failing with an HTTP 524 and an `Unexpected token '<' ... is not valid JSON` error: the RAG route (`app/api/rag/route.ts`) used to run all indexing, semantic search, and LLM streaming before returning a `Response`, so on cold starts it exceeded edge-proxy time-to-first-byte windows and the proxy returned an HTML gateway page the client then tried to parse as JSON. The route now returns the SSE streaming response immediately and moves all slow work inside the stream's `start()` callback, flushing a `: connected` heartbeat as the first byte plus a 15s keep-alive so proxies never hit their TTFB timeout; request-body and LLM-config validation stays up front so genuine client and configuration errors still return real 400/500 codes, and errors raised after headers are sent surface as SSE `error` events. On the client, `Chat.ts` now inspects the response content type instead of blindly calling `res.json()`, showing a friendly "took too long, please try again" retry message for gateway/HTML error pages rather than throwing a JSON parse error

## 0.0.118

- Let long spaceless inline `code`/`kbd` tokens wrap in the generated docs instead of overflowing the page: a URL or path with no spaces (for example a long AWS console link like `https://{region}.console.aws.amazon.com/.../catalog-info.yaml`) has no legal break point, so `hyphens: auto` could not break it and the token pushed the document wider than the viewport; the inline `code`/`kbd` rule now sets `overflow-wrap: anywhere` so the browser breaks inside such a token only when it would otherwise overflow. This completes the 0.0.113 fix, which dropped `white-space: pre` to allow wrapping at spaces but still left spaceless tokens overflowing

## 0.0.117

- Fix numbered lists so multi-digit numbers render cleanly: the number marker is now an in-flow element sized to its content with a hanging indent instead of a fixed-width gutter, so `1.`, `10.`, and `100.` keep a consistent gap and never overlap the item's text. Nested ordered lists also number independently now instead of continuing the parent list's count
- Align the unordered- and ordered-list indents so bullets and numbers share the same 24px gutter, and recenter the bullet dot within it

## 0.0.116

- Theme the generated docs code block from the site's palette instead of a fixed GitHub look, so it matches the rest of the app and picks up a custom brand theme in both light and dark modes: the outer frame and window-bar divider now use the same `grayLight` border as the sidebar and footer, the dark-mode surface uses the left sidebar's translucent `primaryLight` tint instead of GitHub's `#0d1117` so the code window shares the nav's background, and the copy button, code tabs, and centered file-name title all draw from theme tokens that swap for dark mode via the theme provider. The `.hljs` syntax highlighting keeps its fixed GitHub Light and Dark palettes so code stays legible regardless of the brand colors
- Fix numbered lists so a wrapped item stays indented: the counter is now pinned to the left with a hanging indent instead of sitting inline, so the second and later lines of a long item align with its text rather than collapsing back under the number
- Render paragraphs inside list items inline so a list item's text sits beside its marker instead of dropping to the next line, and cap list width at 100% so wide list content no longer stretches the page

## 0.0.115

- Speed up the initial build for large documentation sets by roughly 340x (a 1,000-file build drops from ~239s to ~0.7s): the generator used to regenerate every site-wide file (pages index, root and site layout, sitemap, `llms.txt`/`llms-full.txt`, and section-index redirects) once per MDX file, and each of those re-parsed every file, so a full build scaled quadratically with the number of docs; it now writes each page once and runs the aggregations a single time at the end, sharing a single parse of all pages across them. Output is unchanged - the generated files are byte-identical to before for full builds and for incremental add/change/delete while watching
- Fix a latent ordering bug where sections were resolved before the starter sample docs that define them were written, so a first run now applies section navigation correctly in a single pass instead of relying on per-file rediscovery
- Detect pnpm reliably when it is installed as a standalone binary (for example under `PNPM_HOME`/`~/Library/pnpm`): the `watch` command previously probed for pnpm only through the shell `PATH`, so launching Doccupine from an IDE terminal or GUI that didn't inherit the interactive shell's `PATH` made it silently fall back to npm even though pnpm was installed. It now also resolves pnpm via `PNPM_HOME` and spawns it by absolute path, trusts `npm_config_user_agent` when pnpm launched the CLI, and adds a `--package-manager <pnpm|npm>` flag (plus a matching `packageManager` field in `doccupine.json`) to force the choice

## 0.0.114

- Size the user's chat message to its content instead of stretching it edge to edge: the user bubble now uses `width: fit-content` and right-aligns within the panel, with roomier padding and rounded corners, while the AI answer keeps its full-width layout, so short questions read as compact right-aligned bubbles rather than full-width blocks

## 0.0.113

- Let long inline `code` and `kbd` tokens wrap in the generated docs instead of forcing horizontal overflow: drop the `white-space: pre` rule from the inline `code`/`kbd` styling so a long token (a file path, URL, or command) breaks onto the next line rather than pushing the document wider than the viewport on narrow screens

## 0.0.112

- Fix the generated app failing to deploy with an `npm install` `ERESOLVE` peer-dependency error: the 0.0.111 migration to ESLint 10 left `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-import` on peer ranges that still cap at ESLint 9 even though they run fine under 10; installing with pnpm only warns on such mismatches, but installing with npm hard-fails. Ship a `.npmrc` (`legacy-peer-deps=true`) with the generated app so npm skips the stale peer check and matches pnpm's behavior
- Update generated app dependency posthog-js to ^1.398.7

## 0.0.111

- Smoothly animate the active sidebar link into view instead of snapping to it, and honor `prefers-reduced-motion` in both the nav sidebar and the "On this page" table of contents: readers who opt out of motion get instant (`auto`) scrolling while everyone else gets a `smooth` scroll
- Migrate the generated app's linting to ESLint 10 with a hand-rolled flat config that replaces `eslint-config-next`, which crashes under ESLint 10 because its `react.version: "detect"` detection calls the removed `context.getFilename()`; the new config composes the same React, React Hooks, Next.js, jsx-a11y, import, and `@typescript-eslint` plugins, pins `react.version` to skip the removed code path, and preserves the project's `no-console` and `@typescript-eslint` rules
- Add a `type-check` script (`tsgo --noEmit`) to the generated app backed by the `@typescript/native-preview` compiler, and alias `typescript` to `npm:@typescript/typescript6` so Next keeps building against the classic compiler while the native preview drives type checking
- Update generated app dependencies cherry-styled-components to ^0.2.10 and posthog-js to ^1.398.6
- Upgrade the CLI's TypeScript dev dependency to the native v7 compiler

## 0.0.110

- Scroll the generated docs sidebar to the active page's link when it starts off-screen (deep pages, in-content links, or search results): the sidebar nav scrolls within its own overflow area so the main document never jumps, treats links hidden behind the sticky theme-toggle footer as off-screen so they are still revealed, and marks the current link with `aria-current="page"`
- Add the generated Next.js `public/` directory to the app's `.prettierignore` so generated build output (`llms.txt`, `llms-full.txt`, and per-page markdown) is no longer reformatted by the app's `prettier --write .`
- Use `html` code fences instead of `mdx` for the component-usage examples in the starter MDX docs so the sample component tags syntax-highlight consistently in both themes; the JavaScript/JSX highlighter mis-tokenizes bare component tags and colored the first tag differently from the rest
- Update generated app dependency posthog-js to ^1.398.1
- Update CLI dev dependencies (`@types/node`, `vitest`)

## 0.0.109

- Render the search modal's inline result snippets as plain text: snippet source is extracted from the generated page files as raw MDX, so results used to show stray backticks, backslashes, and other Markdown syntax (for example `` `Test` `` instead of `Test`); a new `toPlainText` step now undoes the template-literal escaping and strips inline code, emphasis, links, images, and heading/list markers so snippets read as clean prose
- Style `<kbd>` elements in the docs like inline `code`, sharing the same tinted background, padding, and rounded corners in both light and dark themes
- Document the Cmd/Ctrl+I shortcut for toggling the AI assistant on the AI Assistant page, noting it activates once an LLM provider is configured
- Use "directory" consistently in place of "folder" across the starter MDX documentation

## 0.0.108

- Strip Next.js route-group segments like `(site)` from the search index slug so content search hits map back to real page URLs instead of being silently dropped: the slug MiniSearch stores now matches the URL produced by `toDocPath()` and the nav slugs, extending the 0.0.101 URL fix to the client-side search index
- Fix the "Images and Embeds" card link on the Components docs page, which pointed to `/images-and-embeds` and 404'd; it now uses the canonical `/image-and-embeds` slug shared by the rest of the site
- Update generated app dependency posthog-js to ^1.398.0

## 0.0.107

- Play the search modal's close animation to completion instead of letting the modal vanish instantly: the backdrop's `onAnimationEnd` also fired for `animationend` events bubbling up from descendant elements, which could unmount the modal before its own exit animation finished; it now responds only to the backdrop's own animation via an `e.target === e.currentTarget` guard
- Toggle the AI assistant with Cmd/Ctrl+I when chat is enabled: a global shortcut opens or closes the chat panel (seeding the greeting and focusing the input on open) through a shared `toggleChat` action that the "Ask AI" button now reuses as well

## 0.0.106

- Consolidate the keyboard focus rings added in 0.0.104 into a single global `:focus-visible` rule, so every link shares one consistent, keyboard-only ring instead of each element re-declaring it, and slim the ring from 4px to 2px; the shared `focusRing` helper is dropped in favor of the global style
- Keep the focus ring off buttons that render as links (a Cherry `Button` given an `href`) so they retain their own button focus treatment instead of picking up the link ring
- Draw the section-tab and Tabbed Code Block focus rings inset on a pseudo-element so the horizontally scrolling bars never clip them top or bottom
- Give the search modal's scrollable results list its own inset focus ring so keyboard users can see when it is focused
- Use Cherry's `IconButton` for the AI chat panel's reset and close buttons
- Replace the search modal's desktop-only "Esc" hint with an always-visible close (X) button so the modal can be dismissed by tap on touch devices
- Render the Accordion header as a real `<button>` with `aria-expanded` and `aria-controls` wired to the content `region`, instead of an `<h3>` carrying `role="button"`, so it is fully keyboard- and screen-reader-accessible and no longer injects an out-of-order heading into the page outline
- Swap the sample `<Update>` label and description on the Update docs page so the version string reads as the entry's sidebar anchor and "Example" as its description

## 0.0.105

- Fix a generated-app build failure introduced with the keyboard focus rings: the shared `focusRing` helper required a non-optional `theme`, so interpolating it into the sidebar row styles (whose props type `theme` as optional) failed `next build` with a styled-components type-variance error; type its generic theme as optional so it composes into both required- and optional-theme styled blocks

## 0.0.104

- Add accessible keyboard focus indicators throughout the generated docs site: a shared `focusRing` helper draws a soft `:focus-visible` glow (matching the existing `interactiveStyles` treatment) on header navigation links and the logo, both the left and right sidebars, footer links, and inline document and chat links, so keyboard users get a clear, on-brand focus ring that never shows on mouse clicks
- Round the footer's GitHub icon-link focus ring, and draw the header section-tab ring inset so the horizontally scrolling section bar never clips it top or bottom
- Redesign the generated 404 page as a standalone, centered card served from the site root (`app/not-found.tsx`) reusing the password-gate box pattern, with an icon, an "Error 404" title, a "This page could not be found." message, and a "Home" button that links back to the home page
- Render the Steps component's step title as a bold `div` instead of an `h3` so step labels no longer inject an out-of-order heading into the page outline

## 0.0.103

- Add optional sidebar icons: set `navIcon` in a page's frontmatter for its sidebar link and `categoryIcon` for its category header, or add an `icon` to any category or link in `navigation.json`, all using [Lucide](https://lucide.dev/icons) names, with unknown names rendering nothing so a typo never breaks the build
- Add an optional `icon` prop to `TabContent` that renders a Lucide icon before the tab title
- Support nested, collapsible navigation groups in `navigation.json`: any link can carry its own `links` array to become a group that expands and collapses on click and opens automatically when one of its pages is active, nested as deep as needed; a group can be a plain label or a real page when given a `slug`
- Walk nested link groups when computing previous/next page navigation so paging spans every real page in reading order
- Generate unique, document-order heading anchors via a shared slugger so repeated heading text yields stable ids (`setup`, `setup-1`, ...) matching GitHub and rehype-slug, keeping the "On this page" sidebar links in sync with the rendered headings and `<Update>` labels
- Make each `<Update>` label a clickable anchor so readers can copy a deep link straight to a changelog entry
- Document icons, nested navigation, and the tab `icon` prop on the Navigation and Tabs pages

## 0.0.102

- Surface each `<Update>` component's `label` in the generated docs' "On this page" sidebar as a top-level, deep-linkable heading anchor, so changelog entries appear in the page navigation and can be linked to directly
- Document the behavior on the Update page and fix two em dashes in its sample content

## 0.0.101

- Strip Next.js route-group segments like `(site)` from generated doc URLs so AI chat answers, chat source links, and MCP search results link to real pages (`/code/` instead of `/(site)/code/`)
- Instruct the AI chat assistant to never include route-group segments in links as an extra safeguard

## 0.0.100

- Type the `TabList` styled component in `Code` with the `Theme` generic so it receives the typed theme prop like the other styled components
- Update generated app dependency cherry-styled-components to 0.2.8

## 0.0.99

- Add an optional `title` prop to the `Code` component that shows a file name centered in the window bar, styled to match the GitHub-style header in both modes
- Add a `CodeTabs` component for multi-variant snippets (e.g. npm/pnpm/yarn install commands): a keyboard-accessible tablist in the window bar with arrow-key navigation, and a copy button that copies the active tab
- Expose `Code` and `CodeTabs` to MDX authors so docs can use them directly without imports
- Render `diff` code blocks GitHub-style with added and removed lines highlighted full-width in green and red
- Document the new features on the Code page: Highlighting Diffs, File Names, and Tabbed Code Blocks sections with live examples
- Update generated app dependency baseline-browser-mapping

## 0.0.98

- Open external links in the generated app in a new tab with `rel="noopener noreferrer"`: `Card` now detects external `href` values like `Button` already did, and the "Powered by Doccupine" links in the footer and password gate open in a new tab (the footer's GitHub link also gained the missing `rel`)

## 0.0.97

- Apply a slim, theme-aware scrollbar to internal scroll areas in the generated app (tables, code blocks, search results, tab lists, and chat overflow areas) via a shared `thinScrollbar` helper, replacing the chunky native bar that stood out in dark mode

## 0.0.96

- Adopt cherry-styled-components' theme stack in the generated app: `ThemeToggle`, `ClientThemeProvider`, and `useOnClickOutside` now come from Cherry instead of bespoke local copies, and the theme is defined as literal `theme`/`themeDark` objects swapped on toggle
- Keep pages fully static with no dark-mode flash: the blocking theme-init script hides the body and pins a dark background on dark visits until Cherry's provider reconciles, and temporarily disables CSS transitions so the light-to-dark swap on load snaps instantly instead of animating every element
- Rework the `DemoTheme` presets to rebuild the swapped theme objects (via the new `buildColors` helper) while still mirroring overrides onto CSS custom properties
- Restyle the ActionBar view toggle to match Cherry's `ThemeToggle` exactly: `interactiveStyles` border highlight and focus/active rings instead of the scale hover, with the knob and icons perfectly centered in both states
- Make the code block copy button icon-only (copy icon, check when copied) with an accessible label, using `interactiveStyles` instead of the scale effect
- Fix `react-hooks` lint errors in generated sites: derive search results and the searching flag at render time instead of setting state inside the debounced search effect, and drop the local `useOnClickOutside` with its non-literal dependency array
- Delete obsolete generated files (`ClickOutside.ts`, `ClientThemeProvider.tsx`, `ThemeToggle.tsx`) on every run so upgraded projects don't keep stale copies that fail lint
- Emit Prettier-clean output from the search template
- Update generated app dependency cherry-styled-components to 0.2.5

## 0.0.95

- Persist the theme preference client-side in the theme toggle and drop the `/api/theme` route, removing a server round-trip on every toggle
- Update generated app dependencies (Next.js 16.2.10, cherry-styled-components 0.2.0, PostHog, and others)

## 0.0.94

- Add optional password protection: set `SITE_PASSWORD` to gate the whole generated site behind a shared-password login screen, with a theme toggle and hideable "Powered by Doccupine" branding below the login box
- Return `401` from the chat (`/api/rag`) and search (`/api/search`) APIs while locked so the docs can't be scraped around the login, keeping the MCP endpoint on its own `DOCS_API_KEY` auth
- Hide password-protected sites from search engines via a `robots.txt` disallow rule, a `noindex, nofollow` tag, and an `X-Robots-Tag` header
- Enforce the gate in middleware with a URL-transparent `(site)` route-group layout so documentation pages stay statically rendered
- Add an Authentication documentation page describing the feature
- Clear the generated `app/` directory on start so upgrades never leave stale, conflicting routes behind
- Fix disabled buttons crashing by passing the `$error` argument to Cherry's `buttonStyles`
- Emit Prettier-formatted output from the layout, button, and sitemap templates so generated sites no longer produce formatting-only diffs
- Disable pnpm's minimum-release-age supply-chain gate in the generated workspace and the CLI repo

## 0.0.93

- Guard the `Icon` component against a missing icon name so it returns `null` instead of attempting an invalid render, and only render the `Callout` icon when an icon type is resolved
- Update CLI dev dependencies

## 0.0.92

- Read the initial theme mode via a lazy `useState` initializer so generated sites apply the stored preference on first render instead of defaulting to light and correcting in an effect
- Drop the `esbuild: false` entry from the generated workspace `allowBuilds`
- Update CLI and generated app dependencies

## 0.0.91

- Fix `</Update>` closing tag indentation in the update MDX template so it renders as a block element instead of being parsed as inline content

## 0.0.90

- Emit `llms.txt`, `llms-full.txt`, and per-page markdown for LLM-friendly content discovery
- Open external links in `Button` in a new tab by default
- Use primary color for footer link hover state
- Ship `pnpm-workspace.yaml` with the package and inherit install stdio so dependency installs stream output to the user
- Migrate generated workspace to pnpm's `allowBuilds` for native dependencies
- Make starter MDX templates Prettier-conformant and add a `.prettierignore` for generated files
- Drop the deprecated `@types/chokidar` dependency
- Update CLI runtime, dev dependencies, and generated app dependencies

## 0.0.89

- Switch theming to CSS custom properties toggled by a `dark` class on `<html>`, removing runtime `theme.isDark` branching across components
- Add blocking `theme-init` script in the root layout so the theme is applied before first paint to prevent a flash of incorrect theme
- Serve doc, home, and section pages fully statically from the edge cache by removing the theme cookie from middleware and marking pages as `force-static` - theme now resolves client-side via the `dark` class set before paint
- Derive semantic tokens (`accent`, `accentStrong`, `accentMuted`, `surface`) from the brand palette using native `color-mix`, dropping the `polished` dependency
- Add JSON-LD structured data and canonical URLs to generated pages for improved SEO
- Document `sitemap.xml` and `robots.txt` generation in the README
- Document the site URL field in platform site settings
- Fix JSON-LD favicon fallback chain so a configured `config.icon` is no longer skipped by an always-falsy override check
- Restore type checking in the generated app after the CSS-variable theming refactor
- Derive semantic CSS tokens via `var()` so theme preset overrides cascade through to dependent tokens
- Lock down semantic tokens and repair filled-button text contrast in dark mode
- Emit Prettier-clean output for JSON-LD declarations and styled-components so generated sites no longer produce formatting-only diffs

## 0.0.88

- Generate `sitemap.xml` automatically when a site URL is configured and link it from `robots.txt`
- Add `url` field to `config.json` with `NEXT_PUBLIC_SITE_URL` environment variable override
- Update dependencies

## 0.0.87

- Replace `h3` with `p` element in Card component to fix heading order accessibility
- Fix config command option syntax from single to double dash in README

## 0.0.86

- Make LLM API key optional to prevent build failures

## 0.0.85

- Replace manual ref callback with autoFocus in search modal
- Add explicit text color using theme grayDark for field component
- Update icon examples and external links MDX template
- Update dependencies

## 0.0.84

- Add robots.ts template using Next.js Metadata API
- Improve color contrast across navigation, buttons, links, and primary theme for WCAG AA compliance
- Improve accessibility across sidebar, docs wrapper, and footer
- Code-split PostHogProvider and SearchDocs modal for better performance
- Replace raw script tags with next/script component
- Scope MCP filesystem operations through APP_DIR to fix turbopack warning
- Remove baseUrl from generated tsconfig
- Update dependencies

## 0.0.83

- Update navigation example with correct slugs and categories
- Rename list-and-tables template to lists-and-tables
- Resolve eslint warnings in generated components
- Update dependencies

## 0.0.82

- Fix sidebar mobile bar to use light theme color in light mode
- Simplify badge background to use primary color
- Add sticky footer and refine sidebar layout spacing

## 0.0.81

- Add full-text content search to search modal
- Resolve section labels from slug in search results
- Adjust spacing and shadow in search modal
- Capitalize escape key label in search modal

## 0.0.80

- Add Cmd+K search modal for docs navigation
- Fix Callout component flex column layout for proper children spacing

## 0.0.79

- Update to Next.js 16.2
- Update dependencies

## 0.0.78

- Update dependencies

## 0.0.77

- Fix `order` frontmatter values in Components category

## 0.0.76

- Add Color Swatches card to components index page

## 0.0.75

- Add ColorSwatch component for documenting color palettes
- Exclude image-wrapping anchors from styled anchor rules

## 0.0.74

- Fix nested paragraph color inherit rule for buttons

## 0.0.73

- Move table overflow-x to wrapper div for proper layout
- Self-close img tags in image-and-embeds MDX template

## 0.0.72

- Add theme-aware visibility classes for light/dark mode content
- Fix button text color inheritance for nested paragraph elements
- Fix public directory watcher to detect directory creation at runtime
- Update dependencies

## 0.0.71

- Add analytics platform documentation template
- Update template dependencies and migrate PostHog React package
- Add `analytics.json` to README configuration files table

## 0.0.70

- Add PostHog analytics integration via `analytics.json`
- Fix generated layout indentation when PostHog is enabled
- Close chat when tapping source link on mobile

## 0.0.69

- Replace navigation and sections MDX pages with Navigation Builder guide
- Fix internal link to navigation-settings page
- Fix directory structure in media-and-assets guide

## 0.0.68

- Show missing component placeholders in MDX pages
- Allow null date in PagesProps type
- Add responsive md breakpoint for 3+ column grids

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
