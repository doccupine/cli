# Changelog

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
