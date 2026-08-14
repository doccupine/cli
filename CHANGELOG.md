# Changelog

## 0.0.154

- Import `StyledComponentsRegistry` from the cherry `/next` subpath: cherry-styled-components 0.2.16 moved the registry out of the package root barrel into a `cherry-styled-components/next` entry point, and the generated root layout still imported it from the root, so every newly generated app failed to resolve it against the version the scaffolded `package.json` installs. `rootLayoutTemplate` now emits the subpath import, and the scaffolded `package.json` pins cherry-styled-components at `^0.2.16` so the import and the installed package agree
- Update dependencies: the CLI moves @readme/openapi-parser to ^7.0.1, @types/node to ^26.2.0, next to ^16.3.1, and pnpm to 11.21.0; generated apps move to next 16.3.1 with `@next/env`/`@next/eslint-plugin-next` 16.3.1, cherry-styled-components ^0.2.16, styled-components ^6.5.2, langchain ^1.5.8 with `@langchain/anthropic` ^1.5.5, `@langchain/core` ^1.2.7, and `@langchain/openai` ^1.5.7, lucide-react ^1.31.0, posthog-js ^1.417.1, posthog-node ^5.49.1, `@typescript-eslint/*` ^8.67.0, globals ^17.11.0, and tsx ^4.23.12

## 0.0.153

- Keep mermaid node labels readable on colored boxes in dark mode: the diagram renderer labels every node with the theme foreground even when the diagram sets its own fill via `classDef` or `style`, and those literal fills - usually light pastels - do not follow the theme, so dark mode painted white text over light boxes. The rendered SVG is produced once server-side and shared by both modes, so `renderDiagram` now bakes a literal contrast color into the labels of nodes whose shape carries a literal fill, chosen from the fill's perceived brightness: black on light fills, white on dark ones, correct in both modes at once. Nodes without a custom fill keep the theme-variable color so they continue to follow theme toggles, and a `classDef` that sets `color:` explicitly is left untouched
- Fall back generated site icons to `icon.png`: the default favicon constant still pointed at the legacy `favicon.ico` while generated sites standardize on `icon.png` under the icon file convention, so a project with no root `icon.png` and no `config.json` `icon` resolved its fallback to the old format. The fallback now resolves to `icon.png` like every other icon path

- Fix the browser-chrome color flipping back to the light `primary` on every route change: 0.0.151 served the `theme-color` meta from a static viewport export, and on each soft navigation Next re-asserts that React-owned tag with its baked-in light value, which then sticks because Cherry's post-hydration sync only re-runs on theme changes. The tag is script-owned again, as in the pre-release builds: the pre-paint script emits it via `document.write` with the resolved mode's `primary` already in it, so the right color is in place from the first paint, hydration has nothing to reconcile (a server-rendered tag corrected pre-paint is answered by React 19 hydration with a stale duplicate, which is what 0.0.150 shipped), and navigation never touches it. Cherry's `$themeColor="primary"` sync keeps it current across theme toggles, on the same `primary` token the script resolves. The Theme page's Browser chrome note in the generated starter documentation describes the restored behavior again
- Update generated app dependency tsx to ^4.23.6

## 0.0.151

- Generate a web app manifest: every site now serves `/manifest.webmanifest` through a generated `app/manifest.ts`, linked from every page's head automatically. It carries the site's `name` and `description` from `config.json` (falling back to the Doccupine defaults), `start_url`, `standalone` display, background and theme colors drawn from the light palette, and the root icon files as icon entries through a new `manifestIcons` export in `utils/icons.ts`, keeping their cache-busting hashed URLs; a site without root icon files gets a manifest without icons rather than a guessed format, and Global Settings documents the manifest under Icon files
- Keep the docs header in normal document flow at the top of the page and fix it in place only once the page scrolls, which is what actually restores the browser-chrome color on doc pages: the browser toolbar on some platforms will not take the page's theme color while a sticky or fixed element touches the top edge, whatever that element's background - transparent, translucent, and opaque all behave the same, isolated by testing stripped-down copies of the real page on the affected device - so doc pages lost their chrome color while the 404 page and plain static files kept it. The Doccupine platform site's header is `position: relative` on its app pages, which is why it never hit this. At scroll position zero an in-flow header occupies exactly the space a sticky one would, so nothing changes visually; once the page scrolls the header pins as before, with a placeholder holding its measured height so the swap never shifts the layout
- Align the browser-chrome color meta with the Doccupine platform site: the layout's static viewport export serves a single tag with the light `primary` in the first bytes of head, the pre-paint script never touches it - a pre-paint edit makes React 19 hydration insert a duplicate with the stale value beside it, which is what 0.0.150 shipped - and the theme provider's `$themeColor="primary"` sync corrects the tag after hydration and follows theme toggles, exactly as it does on the platform. The Theme page's Browser chrome note in the generated starter documentation now describes this behavior, including the shade settling shortly after load on themes whose modes define very different `primary` values

## 0.0.150

- Server-render the browser-chrome color meta in the layout with the light `primary` (pages are static, so the server cannot know the cookie-based mode), with the pre-paint script correcting it for dark visits before first paint and the theme provider keeping it in sync after hydration as before. The template test pins the server-rendered tag's name and content alongside the pre-paint correction

## 0.0.149

- Adopt Next.js-style icon file conventions: drop `icon.png`, `icon-dark.png`, and `apple-icon.png` next to `config.json` at the project root and Doccupine copies them into the generated site's `public/` and wires them through a generated `icons.json` and a new `utils/icons.ts` into the site metadata, every URL carrying a content-hash query so a replaced icon busts browser caches. The dark variant is emitted as `prefers-color-scheme` media entries and `apple-icon.png` becomes the apple touch icon, with `favicon.ico` in `public/` remaining as the legacy fallback path. Precedence is: a page's frontmatter `icon` wins on that page, then the root icon files, then `config.json`'s `icon`, then the built-in default - and an `icon-dark.png` without an `icon.png` beside it warns and is skipped, since there is no light icon to pair it against. A root icon file and a same-named file in your own `public/` directory would publish the same URL, so copying either now fails - checked in both directions - instead of one silently overwriting the other; a symlinked icon source is rejected before any output is touched, the files are watched in watch mode so adding, replacing, or deleting one resyncs the site live, and the copies are tracked in the artifact manifest so a removed icon is pruned like any other generated file. Regression coverage grows to 326 tests
- Paint the browser chrome - the iOS Safari status bar, say - in the site's own brand color from the first frame: the `theme-color` meta was synced from OS-scheme-scoped colors after hydration, which disagrees with the site's cookie-based mode, so a dark site visited on a light-OS device showed the wrong chrome until the theme provider took over, a visible flash on every load. The blocking pre-paint script that already resolves the theme cookie before first paint now writes `meta[name="theme-color"]` from that same resolution, with each mode's `primary` color interpolated at app build time, and the post-hydration sync moves to cherry-styled-components 0.2.15's `$themeColor` handling, which resolves the `primary` token through computed styles to the same per-mode hex - so the chrome color never jumps at hydration. `app/theme.ts` drops `"use client"` so the layout template can read the palettes server-side, and `ThemeModeAttribute` now mirrors `data-theme` from the theme cookie rather than counting effect passes: the old skip-the-first-run ref guard broke under React StrictMode's development double-invoke, where the second pass fired before the provider had reconciled the server-rendered light theme and flashed dark loads white, and the pass-counting path survives only as a fallback for cookie-blocking browsers
- Fill the docs sidebar so it reads as a panel rather than a barely-there tint: the desktop navigation sidebar and its sticky footer used a 5% `primaryLight` wash over transparent; both now mix 8% `primaryLight` into the opaque page background through `color-mix`, and the sticky footer's now-pointless backdrop blur is removed along with the dead declarations it was masking. The right table-of-contents rail keeps its plain page background
- Document the new surface area in the generated starter documentation: Global Settings gains an "Icon files" section covering the three root icon files, their precedence over `config.json`'s `icon` field, and the collision error against `public/`; Media and assets points its favicon guidance at the icon file convention, keeping `favicon.ico` documented as the legacy fallback; Theme notes that the browser-chrome color now derives from each mode's `primary` token; and Commands gains a "Browsing from another device" section explaining `ALLOWED_DEV_ORIGINS` for pages opened over a LAN IP or a Tailscale hostname, which otherwise render but never become interactive
- Update dependencies: the CLI moves @readme/openapi-parser to ^7.0.0, and generated apps move to cherry-styled-components ^0.2.15, styled-components ^6.5.0, posthog-js ^1.411.0, and posthog-node ^5.47.10

## 0.0.148

- Migrate the generated chat UI to cherry-styled-components' chat kit: the bespoke chat drawer, rainbow input, and hand-rolled focus-trap, scroll-lock, and dialog logic are replaced by `ChatProvider`/`ChatPanel`/`ChatMessageList`/`ChatInput`/`ChatLauncher` now that Cherry ships that surface. The template keeps only the transport concern - POST `/api/rag` and stream the SSE frames into the provider via `onSend` - while the kit owns panel state, the transcript, focus containment, inert siblings, Escape handling, and stick-to-bottom scrolling. `ChatStyles.ts` is gone, the header's hand-built chat button becomes Cherry's `ChatLauncher`, and search, navigation, and footer read chat-open state through `useChat()` instead of the old `ChatContext` contract
- Open the chat with the keyboard actually following on iPads and iPhones: through the cherry-styled-components 0.2.14 bump, opening the panel (launcher click, Cmd/Ctrl+I, or handing a search query to the assistant) now commits the open synchronously and focuses the composer inside the triggering tap gesture. iOS Safari ignores `focus()` once the gesture has passed, so the previous deferred focus opened the panel with an unfocused input on touch devices while working everywhere else
- Pin the header search button and the search modal's "Ask AI" button to the same 30px compact header-control tier as Cherry's `ChatLauncher` (`box-sizing: border-box; height: 30px`). Their heights previously fell out of font metrics and happened to agree on most platforms; now the header controls line up exactly regardless of how a platform renders text
- Let a generated app opt into serving its dev server over a non-localhost hostname (a LAN IP, a Tailscale name, ...): Next 16 blocks dev resources - including the HMR socket Turbopack needs before it hydrates the page - for hosts it does not recognize, which leaves the site rendered but inert. A new optional `ALLOWED_DEV_ORIGINS` env var (comma-separated hostnames, documented in the generated `.env.example`) feeds Next's `allowedDevOrigins` only when non-empty, so DNS-rebinding protection stays on by default and production builds ignore it
- Keep generated builds type-checking on Next 16.3: Next flipped `experimental.useTypeScriptCli` on by default, and that path requires a `tsc` binary, while generated apps alias `typescript` to `@typescript/typescript6`, whose only binary is `tsc6` - so `next build` failed claiming TypeScript was not installed. The generated `next.config.ts` now sets `experimental.useTypeScriptCli: false` so type-checking keeps going through the TS6 compiler API the alias does ship
- Update dependencies: generated apps move to cherry-styled-components ^0.2.14, next 16.3.0, `@next/env`/`@next/eslint-plugin-next` 16.3.0, posthog-js ^1.410.7, posthog-node ^5.47.8, `@typescript-eslint/*` ^8.66.0, globals ^17.9.0, and tsx ^4.23.5; the CLI itself moves to next ^16.3.0 and pnpm 11.20.0

## 0.0.147

- Emit the generated `layout.tsx`'s Google font options the way Prettier writes them: the font call was assembled on one line with its arrays passed whole through `JSON.stringify`, which puts no space after a comma, so a `fonts.json` naming more than one subset or weight produced `weight: ["400","500"]` inside a file the generator is meant to emit already formatted. Options now go one per line with a trailing comma and every element quoted individually, a shape Prettier preserves as written, and a Google font configured with no options at all emits `({})` rather than the `({  })` the old join left behind
- Keep the generated site Prettier-clean under test rather than trusting each template to be: the generated `package.json` gains a `format:check` script and `pnpm smoke:generated` runs it against a real generated app after type-check and lint, so a template that drifts from Prettier's output fails the smoke test instead of being quietly rewritten the first time someone runs `format`. The seven configuration files the generator mirrors byte-for-byte from the project root - `analytics.json`, `config.json`, `fonts.json`, `links.json`, `navigation.json`, `sections.json`, and `theme.json` - are exempt in the generated `.prettierignore`, since reformatting a copy would both overrule the author's own formatting and make that copy differ from the source it is fingerprinted against, and a new test pins both halves so a mirrored config added later cannot start failing the check on a file its author never asked to be reformatted
- Recognize an MDX source by its extension case-insensitively everywhere: the check was spelled out separately in source discovery, the watcher's change filter, the watcher's restart fingerprint, and the Markdown-mirror body reader, and they disagreed about case, so a file saved as `Guide.MDX` counted towards the fingerprint that decides whether to restart the watchers while being skipped by the scan that generates pages - invisible to the site, but not to the work it caused. All four now route through one `isMdxPath` helper, and `generateSlug` strips the extension case-insensitively too, so an uppercase source resolves to the same lowercase route as any other
- Fail with a usable message when no port is free: `findAvailablePort` recursed a port at a time with nothing stopping it at the end of the range, so a machine with every port above the configured one taken ended in `listen(65536)` and a `RangeError` about an out-of-range option, which explains neither what happened nor what to do about it. The scan is now a loop that stops at 65535 and raises an error naming the range it searched and pointing at the `port` key in `doccupine.json`
- Print a command failure the way a CLI should rather than dumping Node's default stack trace: an error escaping `doccupine watch`, `build`, or `config` reached the top level unhandled, so the trace came first and the sentence telling the reader what to fix was somewhere inside it. Failures now go through `reportCliError`, which leads with the actionable message, indents each nested `Error.cause` and every `AggregateError` member underneath it - shutdown raises exactly that shape when more than one watcher refuses to close - and prints the raw stack only when `--verbose` was passed, naming `--verbose` when it was not. The cause walk keeps a seen set so a self-referencing chain cannot hang the command, `--verbose` is now accepted by `build` and `config` as well as `watch` so the hint is actionable wherever it appears, and a failed command exits 1
- Render the homepage once per pass instead of twice: reconciling `index.mdx` called `renderHomepage` itself and the aggregate pass then wrote the same file again through `updatePagesIndex`, a leftover from before that pass existed, so every homepage edit paid for two renders and two writes of identical output. The direct call is gone, and the `const operation = JSON.parse(...)` declaration that carries an endpoint descriptor into a page with an `openapi` frontmatter field now comes from one shared helper, so the homepage's copy picks the same quoting and line break a normal page's does instead of being double-stringified whatever its width
- Expand the generated platform documentation: Agent Sync separates asking a question, which the agent answers in the chat without touching your pages, from asking for a change, which starts a run, and states that a run commits itself only when every page it wrote is set to auto-update and untouched by hand - anything else stages the whole change set and waits for review as a unit. Publishing documents the `agent` badge on files a run staged, the notice that names how many conversations are waiting, and the lock that keeps Deploy and the discard controls disabled while a run is still writing. Analytics and Fonts settings explain that turning a toggle off stages a deletion of the underlying config file rather than saving an empty one, that a hand-authored value outside the offered choices round-trips as Custom rather than snapping back to a default, and each gains a Validation section listing the rules the generator enforces on save
- Move the generated Chat component's styles into `components/ChatStyles.ts` and the API playground's helpers into `utils/apiPlayground.ts`, both registered in the structure map like every other generated file, which leaves `Chat.tsx` and `ApiPlayground.tsx` as the components themselves. Regression coverage grows to 314 tests
- Update generated app dependencies posthog-js to ^1.409.5 and posthog-node to ^5.47.3

## 0.0.146

- Claim an output directory that holds nothing but a restored build cache: CI jobs and hosting builds restore `node_modules` and `.next` into the output directory before Doccupine runs, and the claim treated either as unrelated content, so a directory the generator had written on every previous run was refused with "Refusing to overwrite non-empty directory". The emptiness check now accepts those two names alongside the existing `.DS_Store`, `.gitkeep`, and `.env` allowances, but only when each is a real directory: a plain file or a symlink under either name is still refused, since a link there could redirect generated writes outside the output, and any other unrelated entry beside them still fails the claim with the directory left untouched
- Restore the previous API reference whenever a refresh cannot be completed, not only when a single apply fails: a refresh that failed before anything had been applied, exhausted its retries because the spec kept changing underneath it, or failed while re-pointing the file watcher afterwards left the generator holding the new registry, and every later page, navigation, and llms pass was derived from specs the site had never been rendered from. A stable refresh now records the registry and spec list it started from and, on any of those failures, re-applies the previous specs - re-reading them and retrying up to four times when they are themselves being edited, and falling back to the last successful output when they no longer parse - then reports the original error once the previous state is back. The spec watcher is also resynchronized on every apply within a refresh rather than only the first, so a `$ref` graph that changes shape between retries cannot leave the watcher pointing at the file set before it
- Write the section index redirects as one transaction: each redirect was written in place and stale ones removed one by one, so a failure part-way through left some sections pointing at their new landing page and others at the old one, with the route manager's record of the redirects it owns out of step with the files on disk, and a removal that failed was swallowed entirely. The pass now reads back every redirect it is about to touch, writes the whole set, and on any failure restores both those files and the previous ownership set before reporting the error, while a stale redirect that cannot be removed raises instead of being ignored
- Build each pass from the sections that pass itself discovered: section discovery assigned the generator's shared `sectionsConfig` as soon as it ran, before any page had been parsed against it, so a pass that then failed left the generator resolving routes with a section set no generated page had been built from. Each pass now carries its own sections through page parsing and commits them to the generator only after the pass has resolved - for a changed file, only once that file is confirmed to still resolve in it, and for a deleted file, the page's last successful state is cleared only once the delete's own snapshot succeeds. The aggregate pass also builds the homepage from the pass's page set rather than listing the MDX directory again, so the last read of a pass sees what the rest of it saw
- Keep a page in the site's own metadata when its source stops resolving: a source blocked by a route collision or a parse failure drops out of the current catalog, and because navigation, the sitemap, and the llms output were derived only from sources the catalog still resolved, the page's last successful version stayed on disk as a route nothing linked to. The page set now carries those last successful pages through, and the slugs they occupy count as claimed, so a generated endpoint page cannot take a route a real page is still holding while its source is being repaired
- Close every watcher on shutdown, including one that refuses to close: `stop()` closed the watchers one at a time and awaited each, so the first failure abandoned the rest with their handles open, and a `close()` that threw synchronously escaped the loop entirely. All watchers are now closed together, failures are collected rather than thrown at the first one, and any whose close failed is retried after the mutation queue drains - the queue is drained until it stops growing, since a mutation in flight can start another - with what still failed reported as one error at the end
- Recover from a watcher that fails to start rather than leaving half a session running: a failure part-way through startup left the watchers already created running with nothing to stop them, a ready promise that rejected before the startup routine awaited the set became an unhandled rejection, and a `public/` watcher that failed to become ready leaked its handle and its listeners. Startup now stops everything it had created before reporting the failure, every ready promise gets its handler the moment it is created, and a failed `public/` watcher is detached, closed, and cleared. A request to restart that watcher while a previous start is still in flight is now queued and run afterwards instead of being dropped, so a `public/` directory deleted and recreated in quick succession ends up watched
- Emit a correct category slug from the generated navigation utility: the `\s` in `categoryName.toLowerCase().replace(/\s+/g, "-")` lost its escape when the template was reformatted in 0.0.64, so every generated site has since carried `replace(/s+/g, "-")`, which replaces runs of the letter "s" and leaves the spaces alone - "Getting Started" became `getting -tarted` rather than `getting-started`. The sidebar renders each category from its label, so the value never reached the page, but it was written into every site's navigation data. A template test now asserts the emitted regex so a future formatting pass cannot quietly eat the backslash again
- Continue the generator split: page publication, section index redirects, MDX pass construction, and OpenAPI refresh coordination move out of the facade into their own services, and the single generator regression suite becomes five files grouped by behavior (MDX reconciliation, OpenAPI, watching, assets, and source safety) sharing one fixture cleanup helper that stays out of production builds. Regression coverage grows to 297 tests, and CONTRIBUTING's project structure is corrected to the post-0.0.141 layout it had stopped describing

## 0.0.145

- Keep the last successfully generated site on disk when a watch refresh fails: a page, its RSS feed route, the artifact manifest, and the site-wide aggregates were applied in sequence with no way back, so an error part-way through could leave a rewritten `page.tsx` beside a feed route that was never updated, or a manifest claiming routes that had not been rendered. Every generated page - MDX pages, section index pages, the homepage, and API reference pages - is now written through a commit that captures the previous file and feed route first and rolls both back if a later step in the same batch fails, and a failure after the batch commits restores the previous pages, route ownership, inferred sections, sitemap, navigation, and LLMS/MCP content from the last successful state rather than leaving the site half-updated. A page that has never generated successfully stays absent instead of appearing broken, and regression coverage grows to 277 tests that drive these paths under injected write failures
- Recover from a route collision without a restart: two MDX sources that resolve to one route (`guide.mdx` and `guide/index.mdx`, say) reject the whole catalog pass, and because nothing on disk changed when the collision was resolved, every other edit made during that pass stayed unapplied until each file was saved again. The generator now records which sources a collision blocked, keeps the last successful pages and metadata in place while it lasts, and retries the blocked sources - along with any other MDX change that could not be applied - as soon as one of the colliding files is moved, renamed, or deleted
- Read every MDX source once per pass so a file saved mid-generation cannot leak half of itself into the site: the page renderer, the section discovery pass, the page catalog, and the aggregate content (`llms.txt`, the Markdown mirrors, and the MCP manifest) each re-read the file from disk, so a save between two of those reads produced a page built from one version and navigation built from another. Each pass now snapshots its file set once and every derived step reads from that snapshot, and the aggregates read the content that actually produced the page rather than whatever happens to be on disk when they run
- Load an OpenAPI reference against a stable view of its sources and watch all of them: only the root document was watched, so editing a schema file it pulls in through `$ref` changed nothing until the root was touched, and a spec edited while it was being read could produce a reference assembled from two versions of itself. Each load now records every local file the reference graph reaches with its size, identity, and content hash, retries the parse until the state observed after the read matches the state before it, and points the watcher at every discovered file rather than the root alone. Because adding or retargeting a `$ref` changes the watched set, the refresh re-checks its sources once the new watcher is live and replays a change that an `ignoreInitial` watcher could not have reported
- Persist route ownership before it takes effect in memory: `.doccupine-artifacts.json` was updated in memory and written afterwards, so a failed write left the process believing it owned routes the manifest did not record, and the next run cleaned up against the wrong set. Ownership changes now write the manifest first and become the live set only when that write succeeds, and a stale route that cannot be removed is remembered and retried on the next pass instead of being dropped from the manifest with its files still on disk
- Read and write `doccupine.json` through the same path guarantees the rest of the generator already uses: the file was read with a plain read and rewritten in place, so a symlink anywhere between the project root and the file could redirect either operation outside the project, and an interrupted write left a truncated configuration behind. Every component of the path is now checked for symlinks from the project root down, the read opens with `O_NOFOLLOW` and verifies the file's identity and timestamps before and after, and the write goes to a random exclusive temporary file in the same directory - keeping the existing mode, flushed to disk - that atomically replaces the original. A save failure now fails the command rather than only printing an error, since everything after it assumed the configuration on disk had changed
- Create the starter documents without a window in which their path can be swapped: the emptiness check, the path validation, and the write were three separate steps against a root that could be replaced between them. The documentation root is now pinned by identity and re-verified before every file, each starter file is created with `O_CREAT | O_EXCL | O_NOFOLLOW` so an existing file or a link can never be written through, the parent directory's identity is confirmed between opening the file and writing to it, and a failed write removes only the file this run created
- Generate the first build from one snapshot of the project's configuration: `config.json`, `theme.json`, `navigation.json`, `sections.json`, `fonts.json`, and `analytics.json` were each read several times during startup - once to copy, once to parse, once to derive the site metadata - so an edit inside that window produced a site assembled from two configurations and a watcher baseline that did not match what had been generated. All of them are captured once before any output is written, every consumer reads from that capture, and the baseline records the exact states used, so the catch-up pass at the end of startup regenerates precisely what changed. Starter documents are now written before the baseline is taken and the OpenAPI reference is loaded before sections are resolved, which removes the second section pass startup used to need
- Stop the cleanup passes removing a page they no longer own: a stale section index redirect was identified by reading the generated file back and looking for `function SectionIndex()` inside it, which is a guess about content rather than a fact about ownership, and stale MDX cleanup could remove a route that OpenAPI had taken over in the same pass. Both passes now compare against the slugs the current page set occupies, so a slug claimed by a real page or by a generated endpoint page is left alone, and a route moving from MDX to OpenAPI keeps its page and loses only its feed route
- Describe the new behavior in the generated starter documentation: Commands gains sections on watch mode, route collisions and recovery, live-reloading `doccupine.json`, and the file-system constraints on sources, public assets, and output paths; API Playground explains that the root spec and its recursive local `$ref` files are read as one snapshot and watched individually, and that a hand-written page wins a route it shares with a generated one; Media and assets warns that `public` and everything beneath it must be real files rather than symlinks; and What is Doccupine sets out which generated paths stay generator-managed while you keep running Doccupine, and which files reload live
- Update generated app dependency @langchain/core to ^1.2.4

## 0.0.144

- Validate `fonts.json` and `analytics.json` before any of their values reach generated source, and write those values as data rather than as hand-quoted text: a Google font name, a weight, a local font path, a PostHog project key, and a PostHog host were each interpolated inside the quotes of a string literal in the generated `layout.tsx`, `next.config.ts`, and `proxy.ts`, so a value carrying a quote could close that literal and have the rest of itself compiled as code by the next `next build`. A new configuration validator now requires `fonts.json` to declare exactly one of `googleFont` or `localFonts`, restricts `googleFont.fontName` to a valid identifier because it becomes an import, checks `subsets`, `weight`, and every `localFonts.src` entry, limits `posthog.key` to letters, numbers, underscores, and hyphens, and requires `posthog.host` to be an HTTP(S) URL with no credentials, query, or fragment, failing with a message that names the offending field. What passes is emitted through `JSON.stringify` at every site, replacing both the quote-and-interpolate pattern and the regex that used to strip quotes off local font keys, and `FontConfig`'s `[key: string]: any` gives way to real types so the compiler can see what is being written
- Shut `doccupine watch` down completely instead of leaving the dev server behind: Ctrl+C killed only the immediate child - the package manager's `run dev` wrapper - and then called `process.exit(0)` without waiting, so the Next.js process that wrapper had spawned frequently survived and kept holding the port, and the command reported success however it ended. The dev server now runs in its own process group, `SIGINT` and `SIGTERM` signal the whole tree with `SIGTERM`, wait up to five seconds for it to close, then escalate to `SIGKILL` with a one second grace period, generator watchers stop in parallel with it, and the process exits 130 or 143 to match the signal it received. A dev server that fails to spawn or exits on its own now stops the generator and fails with a real error rather than printing one and leaving the watchers running
- Pick up source edits made before the file watchers were ready: chokidar reports readiness some time after it is asked to watch, and a file changed between the initial generation and that moment went unnoticed until something touched it again, so a save during startup could leave the site missing a page. The generator now snapshots every watched source before watching begins - MDX files, the companion JSON config files, `fonts.json`, the OpenAPI specs, and the `public/` tree - re-reads them once the watchers are ready, and regenerates only what actually differs, so an unchanged project does no extra work and a changed one catches up. Watching also starts before the dev server is spawned, and a `public/` directory that is replaced rather than edited in place gets a fresh watcher instead of a dead one
- Prune generated copies of `public/` files that were deleted while Doccupine was not running: the artifact manifest records the public files it copied (schema version 2), so a file you remove from your own `public/` directory between sessions is removed from the generated site on the next start instead of surviving as an orphan the site still serves
- Stop a long conversation being rejected by the docs' own chat route: the RAG route capped a request body at 32 KB while the schema behind it accepts a whole conversation, so a reader deep in a session got a "request too large" failure rather than an answer. The cap rises to 512 KB, still a hard ceiling rather than an open door, and the chat client now sends only the last twenty messages with each one truncated to 4000 characters, so a session stays comfortably inside the limit however long it runs
- Build the MCP server's embedding index on first authorized use instead of at module load: the build started as soon as the module was imported whenever an LLM was configured, so every cold start paid for embeddings whether or not a request ever arrived, and the work began ahead of any authentication. The existing `ensureDocsIndex` path now triggers it, which already caches the result and reports a genuine error to the caller when a build fails
- Split the generator engine into eleven focused modules under `src/generator/` - secure source reads, app scaffolding, project configuration, section resolution, the page catalog and renderer, generated routes, the API reference, public assets, site artifacts, and watch coordination - taking `mdx-to-nextjs-generator.ts` from roughly 2760 lines to 1180 with no change in behavior, continuing the split 0.0.141 began with the CLI entry point. Regression coverage grows to 228 tests, adding the watch lifecycle, configuration validation, and the watcher catch-up and public-pruning paths
- Declare the Node.js floor the CLI actually needs: `engines` moves from `>=22` to `>=22.12.0`, and the README's quick start with it, since several of the CLI's own dependencies already require that version. An install on Node 22.0 through 22.11 now fails the engine check up front rather than part-way through a run
- Render the generated docs' `Accordion` header as a plain `button` rather than the styling library's `Button` with a reset layered over it: the header already reimplemented the entire reset inline - appearance, border, background, font, cursor - so the wrapper only supplied defaults for that inline reset to fight
- Update generated app dependencies posthog-js to ^1.409.0 and posthog-node to ^5.47.0

## 0.0.143

- Give `Space` the same prop names as every other component you author with, so a gap is written `<Space size={60} md={80} />` rather than `<Space $size={60} $md={80} />`. Space was the one component handed to MDX straight from the styling library, whose `$` prefix marks a prop transient - the mechanism styled-components uses to keep it off the DOM node - and means nothing in a document. A generated `components/layout/Space.tsx` now wraps it and maps each plain name onto the prefixed one, `size`, `xs` through `xxxl`, and `horizontal` are documented without the prefix, and the `$` form stays accepted so pages already written against it keep their gaps rather than silently losing them on upgrade. Because a prop name that never reaches the styling layer renders an empty span instead of raising an error, the generated-site smoke build now renders both forms and reads the resulting gaps back out of the prerendered HTML

## 0.0.142

- Restore `next`, `react`, and `react-dom` to the CLI's own dependencies. 0.0.141 dropped them on the grounds that they belong to the generated app's `package.json` rather than the CLI runtime, but hosting platforms decide which framework a project uses by reading the `package.json` at the deployment's root directory, so a repository that deploys from the CLI's own manifest stopped being recognized as a Next.js project and its builds failed with "No Next.js version detected". The three packages return at the versions the generated app already pins - `next` 16.2.12 with `react` and `react-dom` 19.2.8 - so the CLI and the site it produces stay on one Next.js and one React release

## 0.0.141

- Make generated output safe to update in long-running and automated workflows: Doccupine now claims an output directory before touching it, refuses unrelated non-empty projects and replaced or symlinked roots, validates every generated path stays inside the claimed directory, and writes files through random exclusive temporary files before atomically replacing their destinations. MDX, OpenAPI, and public sources are read through validated no-follow paths, while configuration, font, analytics, and public copies atomically replace their destinations, so symlinks, hard links, path swaps, and escaping sources cannot redirect generated reads or writes outside their intended roots
- Track generated ownership explicitly in `.doccupine-artifacts.json`: MDX routes, OpenAPI routes, and Markdown mirrors are recorded by source, so watch-mode renames, section moves, and deletes remove only artifacts Doccupine owns instead of guessing from the current filename. User-authored `public/` files continue to win over generated `llms.txt`, `llms-full.txt`, `skill.md`, Markdown mirrors, and MCP discovery files, including mixed-case paths, and deleting an override restores the generated version on the next refresh
- Validate the complete configuration and route set before changing output: malformed ports and OpenAPI entries, overlapping watch/output directories, unsafe section slugs, duplicate section directories, and route collisions now fail with actionable errors rather than producing a partial site. Hot `doccupine.json` reloads build the next registry first and roll back routes, watchers, aggregates, and configuration when regeneration fails, while watcher mutations run through one queue so concurrent file events cannot race shared layout, sitemap, navigation, or agent-facing files
- Improve non-interactive generation and dependency installation: `doccupine generate` is now an alias for `build`, `--skip-install` lets CI or an existing workspace manage packages itself, and dependency installs are skipped when the package manager and generated `package.json` fingerprint have not changed. Sitemap and robots routes are always emitted, `NEXT_PUBLIC_SITE_URL` can provide the deployment URL, and OpenAPI projects gain an `/api-reference` index grouped by specification and tag
- Harden OpenAPI ingestion and rendering from source to page: remote references, path escapes, symlink escapes, dotfiles, unsupported reference formats, and recursive `$ref` files outside the configured root spec directory are rejected before parsing, then the accepted graph is snapshotted before dereferencing so later file changes cannot alter the build mid-read. Specification-controlled prose, headings, schemas, and examples are emitted as inert JSX text rather than executable MDX, and JSON schemas and response examples render through the shared syntax-highlighted `Code` component
- Protect every generated content API at the route itself instead of relying only on middleware: RAG, search, playground, and MCP handlers now recheck the site-gate session or API key, `RAG_API_KEY` supports authenticated server-to-server chat access on otherwise public sites, and MCP falls back to the site gate when `DOCS_API_KEY` is not configured. Gate, playground, RAG, and MCP requests share an abort-aware bounded JSON reader, the playground separately caps decoded UTF-8 and base64 payloads, secrets use timing-safe comparisons, and rate limits derive client identity only from headers overwritten by recognized hosting platforms
- Tighten the playground proxy and AI/MCP resource boundaries: SSRF checks parse complete IPv4 and IPv6 addresses, including mapped, translated, and NAT64 forms, pin connections to validated DNS results, and keep loopback access development-only. RAG and MCP propagate request cancellation through route, search, and tool operations, while MCP limits body size, protocol batches, tool arguments, result sizes, and search counts; documentation content is loaded from one generated manifest instead of scanning generated source paths at runtime
- Give generated search, chat, tabs, accordions, and navigation complete interaction semantics: search is a dialog with a combobox/listbox model, focus containment, result announcements, and opener restoration; mobile chat is a real modal with focus containment, inert background content, near-bottom-aware autoscroll, and reduced-motion support. Chat and search now close one another before opening so their focus traps cannot compete, horizontal tabs implement Arrow/Home/End navigation with roving focus, and collapsed accordion and sidebar regions are inert and linked to their controls
- Eliminate the remaining light-theme frame when a dark page loads: the blocking initialization script resolves `data-theme` before first paint, every painted theme token is backed by a CSS custom property shared by the server and client theme objects, and later toggles synchronize the attribute, `color-scheme`, and `theme-color` without hiding the body or waiting for hydration. Generated projects now require `cherry-styled-components` 0.2.12, whose CSS-variable color handling removes the temporary polished compatibility shim
- Expand the generated starter and platform documentation: add the `Space` component reference and a platform authentication guide, explain publishing validation and granular discards, document navigation slug rules and API-playground requirements, and rename and expand Self-updating Docs as Agent Sync with setup, automatic linking, and repository workflow guidance. The chat close animation, inline code sizing, prompt typography, OpenAPI JSON presentation, and similarly prefixed documentation routes also receive targeted visual and routing fixes
- Verify the package and a real generated site before release: CI now builds before tests, checks formatting, packs the actual npm tarball, validates its exact contents, installs it without development dependencies in an isolated project, imports the package, executes the installed binary, and generates a fixture that must pass TypeScript, ESLint, and a Next.js production build. CLI wiring and the generator engine are split into focused modules, with regression coverage expanded to 204 tests across output safety, OpenAPI, configuration, accessibility, generated-route security, packaging, and watch-mode ownership

## 0.0.140

- Keep one broken page from failing the whole site's build: doc pages are statically prerendered, so a single authoring mistake in any MDX body - an orphaned closing tag, an unclosed `<Card>`, a stray `{expression}` - used to throw during `next build` and abort the deployment for every page. The generated `Docs` component now compiles the body through `compileMDX` inside a try/catch and, when compilation fails, renders a danger `Callout` naming the source file, explaining that the rest of the site still builds, and showing the compiler's message, so the author knows exactly what to fix. Because a JS expression in the body only runs when the compiled component renders - which would escape the guard and still fail the build - the compiled component is invoked once inside the try/catch so a `{placeholder}` typo surfaces as the same inline panel, and new template tests pin the guarded shape so a refactor cannot silently reintroduce the unguarded render path
- Survive malformed frontmatter the same way in the CLI: every frontmatter parse now goes through a new `safeMatter` helper that catches broken YAML (an unclosed quote, say), warns with the offending file's name, and treats the file as having no frontmatter with the broken block stripped from the body, so one typo between `---` delimiters can no longer crash a build or a site-wide aggregation pass - the page still generates under its filename-derived slug with its body intact
- Render the generated app's error messages through the shared `Callout` component instead of ad-hoc styled boxes: the chat panel's error, the API playground's request error, and the missing-component placeholder now all use the danger `Callout`, so every error surface shares one look. The chat's SSE reader now guards only the JSON parse - a malformed frame is logged and skipped, while a server-sent `error` event throws past the loop to the handler that shows it in the callout instead of being swallowed by the same catch
- Stop the chat's RAG route leaking server details to visitors: a provider or stream failure used to be forwarded to the client verbatim, and raw provider errors can carry API-key fragments, organization ids, and billing URLs, while a configuration failure echoed messages naming environment variables. The route now logs the full error server-side and sends the client one of four fixed, visitor-safe messages (rejected API key, rate limiting, unreachable provider, or a generic fallback), and a configuration failure returns a fixed "not configured" message pointing the site owner at the server logs
- Update generated app dependency posthog-js to ^1.407.8

## 0.0.139

- Enforce a minimum height on rendered Mermaid diagrams so a wide diagram scaled down to fit the content column no longer collapses into a short, hard-to-read strip: the diagram SVG now carries a 320px floor, and since it keeps its `viewBox` the drawing stays in proportion and centers vertically in the roomier box. The threshold for auto-showing the pan/zoom controls rises with it (120px to 420px) so a small diagram sitting on the floor does not pick up controls it has no use for, while an explicit `actions` property on the fence still overrides the default in either direction; the Mermaid docs page now describes the default as showing controls on larger diagrams rather than naming the old 120px cutoff
- Lay out `Card` content as a flex column with a 12px gap so a card's icon, title, and body are evenly spaced in both the plain and linked (`href`) variants, completing the 0.0.133 cleanup that removed the title's stray margins: spacing inside a card now comes from its padding and the column gap alone

## 0.0.138

- Make every generated docs site agent-ready, so an AI agent that lands on it can discover what exists and fetch it in the shape it wants: `llms.txt` now always opens with an H1 and a blockquote summary (falling back to `Documentation for {name}.` when `config.json` carries no description), points its page links at the per-page markdown mirrors rather than the HTML pages - the homepage at `/index.md` - and advertises `llms-full.txt`, the new agent skill, and the MCP server up front, while each `{slug}.md` mirror carries a blockquote near its top pointing back at `llms.txt`, so the index is reachable from any page an agent enters through
- Serve markdown to agents that ask for it: a `GET` request carrying `Accept: text/markdown` on any extensionless page path is rewritten in the middleware to the page's static `.md` mirror, so the same URL a reader shares hands an agent clean markdown. The rewrite runs after the `SITE_PASSWORD` gate, so a protected site never hands out markdown around the login screen (gated responses keep the `X-Robots-Tag` backstop), it skips assets, API routes, and the `/mcp` alias, and it sets no `Vary` header - the rewrite target is part of the CDN cache key - so pages stay edge-cacheable
- Publish an agent skill at `/skill.md` that teaches an agent how to read the docs - the `llms.txt` index, the append-`.md` mirror rule, and the MCP server's `search_docs`, `get_doc`, and `list_docs` tools - and lists the first eight pages in navigation order as entry points. A `skill.md` you author in your own `public/` directory wins over the generated one, since public assets are copied after generation
- Advertise the MCP server where agents look for it: a `.well-known/mcp.json` discovery manifest is generated whenever `config.json` declares a site `url` (and pruned when the `url` is removed), and `/mcp` now rewrites to `/api/mcp` as a discovery alias, with the middleware's `DOCS_API_KEY` check widened to match `/mcp` so the alias cannot bypass authentication. The skill's frontmatter `name` and the manifest's server key derive from one shared rule that appends `-docs` only when the site name's slug does not already end in it, so a site named "Acme Docs" identifies as `acme-docs` rather than the stuttering `acme-docs-docs`
- Help extractors and assistive technology find the article: the `<main>` landmark now wraps only the page content, leaving the sidebar, page navigation, and footer outside it; a visually hidden directive rendered as the layout's first element links `/llms.txt` and `/llms-full.txt` and states the `.md` mirror rule for crawlers reading the HTML; and the action bar, the "On this page" list, and the chat panel and its input form are marked `data-markdown-ignore` so HTML-to-markdown extractors skip the site chrome
- Add a "View as Markdown" link to the action bar that opens the current page's `.md` mirror, an icon pill sharing the view toggle's 30px geometry through an extracted style helper, and reduce the RSS pill's vertical padding from 6px to 2px for a flatter profile, keeping its 8px horizontal padding

## 0.0.137

- Add a `SidePanel` component to the generated docs for pinning supplementary content - a note, a related link, a quick reference - to the right rail: whatever you put inside it renders in the column that normally holds the "On this page" table of contents, and a page carrying a panel drops that table of contents rather than stacking the two. Detection reuses the page's existing component scan, which already ignores fenced and inline code, so documenting the component in a code sample never hides a page's own table of contents. From `lg` the panel is fixed to the rail at the navigation sidebar's width, which is exactly the room the content column already reserved, so nothing shifts and a page with a panel lays out identically to one without; from `xl`, where there is space to spare, it widens to the AI chat panel's width and the content column, previous/next buttons, footer links, and footer all shift left to make room, the same way they already do for an open chat. Below `lg` the panel renders inline in the document flow at the position it was authored, so a phone reader gets the content rather than losing it. The columns follow the panel through a `body:has([data-side-panel])` rule rather than React state, because the navigation buttons and the footer are rendered by the layout, above the page that owns the panel: the page stays fully static and the layout is right on first paint with no client work. A new Side Panel documentation page covers the behavior and demonstrates it, since it uses a panel and therefore has no table of contents
- Add a focus mode to the generated docs for distraction-free reading: a new icon button in the sidebar footer row, beside the theme toggle, slides both the navigation sidebar and the right rail out of view and lets the content column, previous/next buttons, and footer take the full width, with Cmd/Ctrl+B toggling it from the keyboard. The button is fixed rather than part of the sidebar it hides, so the way back out stays on screen once both rails are gone, and the shortcut is ignored while the reader is typing in the search or chat input and inert whenever the button itself is hidden, which ties it to the same desktop breakpoint as the button without repeating the breakpoint in JavaScript. The mode rides on a `data-focus-mode` attribute on the root element so the sidebar, the two rails, and the content columns - which sit in separate subtrees - can all react in CSS; an open chat panel keeps the room it needs, and the preference lasts for the session rather than being persisted
- Update generated app dependencies @modelcontextprotocol/sdk to ^1.30.0 and posthog-js to ^1.407.3

## 0.0.136

- Publish an RSS feed for a homepage built from `<Update>` entries: the feed support added in 0.0.135 ran only in the per-file page generator, and the homepage is produced by its own pass, so an `index.mdx` holding the changelog published no feed at all. The homepage pass now parses its `<Update>` entries, shows the action-bar RSS button behind the same `rss: true` frontmatter, advertises the feed via autodiscovery metadata, and serves it from the site root at `/rss.xml`, removing the route again when the entries or `index.mdx` itself go away. The shared feed builder now joins URLs through a page prefix that is empty for the homepage, so its feed and item links can no longer start with `//`, which a feed reader would resolve as a protocol-relative URL pointing at the wrong host
- Stop section index pages losing their RSS button on every build: a section landing page is generated twice, and the second pass (which applies the section navigation) overwrote the page the first pass had just written without the RSS button or the feed autodiscovery link, so the feed route existed with nothing on the page linking to it. The section pass now re-derives the page's RSS state and emits the same buttoned markup, pre-wrapped so the generated file stays Prettier-clean

## 0.0.135

- Add four components to the generated docs, each with its own documentation page: `Badge` for inline labels (15 colors, four sizes, stroke, solid, and mono variations), `Prompt` for copyable AI prompts with a Cursor deeplink, `Tooltip` for contextual definitions with viewport-aware placement, and `Tree` (alias `FileTree`) for keyboard-navigable file trees authored as `<Tree.Folder>`/`<Tree.File>` markers or plain markdown lists. The sidebar and API playground HTTP-method chips now render through `Badge`, so every surface colors verbs identically
- Publish a subscribable RSS 2.0 feed at `{page-url}/rss.xml` for any docs page containing `<Update>` entries: feed items deep-link to each entry's anchor on the page, `rss: true` frontmatter adds an RSS button to the action bar, an optional `rss` prop supplies feed-only text for entries made mostly of components, and pages advertise their feed via autodiscovery metadata. Password-protected sites expose no feeds
- Apply `doccupine.json` edits without a restart: changing the `openapi` spec set mid-session now regenerates the API reference pages, request allowlist, navigation, and section redirects (removing those whose spec was dropped), invalid or half-written JSON keeps the current configuration, and `watchDir`/`outputDir` changes log a restart hint
- Rename the "Images and Embeds" page slug from `image-and-embeds` to `images-and-embeds` so it matches the page title
- Update CLI dependency chalk to ^6.0.0 and generated app dependency globals to ^17.8.0

## 0.0.134

- Generate an interactive API reference from your OpenAPI specs: point the new `openapi` key in `doccupine.json` at one spec (a single path), several (`string[]`), or named `{ name, file }` objects, and Doccupine dereferences each with `@readme/openapi-parser` at build time and emits one page per operation into an auto-created top-level "API Reference" section. Operations are grouped into sidebar categories by their first tag (honoring the spec's own `tags` order) and carry a color-coded HTTP-method badge. All three config forms normalize to a uniform spec list with de-duplicated route namespaces (each spec namespaced under its name when more than one is configured), and spec paths are rewritten project-relative so `doccupine.json` stays portable across machines and CI. The specs are watched live - editing one reparses it and regenerates the reference pages, request allowlist, navigation, sitemap, and llms output - and the interactive setup prompt gains an optional OpenAPI-spec question
- Embed a single endpoint's playground inline in any hand-written page with an `openapi: <METHOD> <path>` (or `openapi: <operationId>`) frontmatter field - the homepage `index.mdx` included - so the live widget renders in the content column alongside your own prose, and the page also picks up the method badge in the sidebar. An unknown reference is logged but degrades gracefully: the page still renders its prose without the playground
- Let readers send real requests straight from the docs: a compact "Try it" bar opens a modal where they fill in path, query, header, and cookie parameters and an editable request body (pre-populated from the spec's example), enter credentials for the endpoint's declared security schemes (`apiKey` in header or query, HTTP `bearer`, and HTTP `basic`, masked as password fields with a Show/Hide secrets toggle), and press Send to see the live response - a status pill, round-trip time, byte size, and a truncation flag, with the body rendered as syntax-highlighted code or as an inline image/video/audio player or a download link for binary payloads. Copy-pasteable cURL, JavaScript `fetch`, and Python `requests` snippets are generated for the exact request in tabbed code blocks, with secret header values redacted from the snippets unless secrets are shown. A proxy/direct mode toggle picks whether the call is executed server-side or straight from the browser, and mixed-content or CORS failures in direct mode surface a one-click "Retry via proxy"
- Route playground requests through an SSRF-guarded server-side proxy (`app/api/playground/route.ts`, Node runtime) that is deliberately not an open forwarder. Every target is first gated by a build-time allowlist derived from the union of the specs' `servers` (matched on scheme + host + effective port + optional base-path prefix), embedded URL credentials are rejected outright, and the same matcher runs client-side only as a pre-flight - the server is the hard gate. Before any socket opens, the guard resolves the host over DNS, rejects any address in a private, loopback, link-local, CGNAT, metadata, multicast, or reserved range (IPv4 and IPv6, including IPv4-mapped forms), and pins the connection to the pre-validated IPs so DNS rebinding between check and connect cannot redirect it to an internal host - private ranges are permitted only when the spec's own server is a local-dev host. It strips hop-by-hop and identity-leaking request headers (`cookie`, `host`, `origin`, `referer`, and the `x-forwarded-*` family) before forwarding and echoes back only a safe subset of response headers, dropping `set-cookie`, `authorization`, and `www-authenticate`. Requests are Zod-validated, per-IP rate-limited (`429`), capped at a 1 MB request and 5 MB response body with a 30s timeout, and the proxy logs no URLs, headers, or bodies so reader secrets never reach the logs
- Reorganize the starter documentation's navigation so a fresh scaffold reads better: split the overloaded Configuration category into Configuration, AI & Integrations, and Deployment; fix the Getting Started order (Introduction, What is Doccupine, Commands); and reorder the Components gallery, adding an API Playground entry. The components index cards and the sample `navigation.json` are updated to match
- Drop the filled background from the generated docs' `Steps` component so steps sit flush on the page instead of reading as cards (their border radius and padding are unchanged), and mute the `<Update>` body text to the theme's `gray` so an update's label, description, and body now share one muted color
- Expand and reorganize the starter platform documentation: add "Import from GitHub" and "Self-updating docs" pages, rename the "External Links" page and its settings section to "Footer Links", and reorder the platform docs navigation
- Update the CLI dependency next to ^16.2.12, and generated app dependencies next, `@next/env`, and `@next/eslint-plugin-next` to 16.2.12, @langchain/anthropic to ^1.5.2, langchain to ^1.5.4, and lucide-react to ^1.27.0

## 0.0.133

- Render diff code blocks in the generated docs as full-bleed rows tinted from the site's own palette instead of GitHub's fixed green and red: an added or removed line now spans the full width of the code window with a 3px accent bar in the theme's `success` or `error` color down its left edge, and the tint mixed from that same token (12% over the light surface, 16% over the darker one) so a custom `theme.json` palette carries through. The line keeps the normal code foreground rather than GitHub's green-on-green and red-on-red, so a changed line reads as legibly as the rest of the block. Reaching the window edge meant moving the block's horizontal gutter off the scrolling body and onto the `<code>` element inside it so the gutter travels with the content and a diff row can extend back through it with a negative margin: the row now bleeds edge to edge, covers the full scroll width of a long line, and keeps its right-hand gutter when scrolled to the end, while the accent bar plus its padding add back the same 20px so changed lines stay aligned with untouched ones
- Restyle the reader's own message in the generated docs chat as a speech bubble: an asymmetric `16px 16px 4px 16px` radius with tighter `9px 14px` padding and a `min(560px, 88%)` cap, plus `white-space: pre-wrap` and `overflow-wrap: anywhere` so a multiline question keeps its line breaks and a long unbroken token like a URL or path wraps instead of pushing the panel wider. The assistant's answer is unaffected: its override resets `white-space` and `font-weight` so rendered MDX still lays out normally, and every color still comes from a theme token
- Remove the 5px top and bottom margin from the `Card` title, which the component had carried since it was introduced and which stacked on top of the card's own 20px padding, leaving the icon, title, and body text unevenly spaced. Spacing inside a card now comes from its padding and the shared text styles alone
- Update CLI dependency fs-extra to ^11.4.0, and generated app dependencies lucide-react to ^1.26.0, posthog-js to ^1.407.2, and posthog-node to ^5.46.1

## 0.0.132

- Add a `Frame` component to the generated docs for presenting images, videos, diagrams, and other visual content as deliberate figures rather than stray images: the content is centered inside a bordered, tinted `figure`, an optional `caption` renders as a `figcaption` beneath it, and an optional `hint` renders as a line of text above the frame. Captions and hints accept a small inline-Markdown subset - links, bold, italic, and inline code - parsed into React elements rather than injected as HTML, with link targets restricted to an allowlist (`http(s):`, `mailto:`, and site-relative, anchor, and relative paths) so a `javascript:` or `data:` URL renders as literal text instead of becoming a link; internal paths route through `next/link`, and external ones open in a new tab with `rel="noopener noreferrer"`. A `video` child carrying `autoPlay` is given `muted`, `loop`, and `playsInline`, since browsers refuse to autoplay a video with sound and iOS otherwise takes it fullscreen, while any of those attributes set explicitly by the author wins and a video without `autoPlay` is left untouched. A new Frames documentation page covers the props, the caption formatting, and the video behavior
- Emit Prettier-clean output from the middleware template so generated sites with analytics enabled no longer produce a formatting-only diff: the `distinct_id` guard was emitted as a single 82-character line, two past Prettier's default width, so every `prettier --write .` in such an app rewrote `proxy.ts`. That branch is only emitted when PostHog is configured, which is why a default scaffold never surfaced it

## 0.0.131

- Fix generated sites failing `next build` when a page sets an `image` override in its frontmatter: the JSON-LD block emitted that override as the first term of an `image || config.icon || <default favicon>` chain, and because a string literal is statically known to be truthy, TypeScript rejected the unreachable rest of the chain with "This kind of expression is always truthy" and failed the build - so one page carrying an `image` was enough to break a deployment. The override always wins anyway, so it is now emitted as the whole expression with the dead fallback terms dropped. This is the sibling of the 0.0.89 fix, which removed the same defect from the branch where no override is set
- Emit Prettier-clean output from the PostHog provider template so generated sites no longer produce a formatting-only diff: the `uiHost` declaration was hand-wrapped by breaking before `.replace(...)`, where Prettier instead breaks inside the parenthesized expression, so every `prettier --write .` in a generated app rewrote the file
- Update CLI dependencies next to ^16.2.11, and react and react-dom to ^19.2.8

## 0.0.130

- Stop filing a returning reader's first pageview under a session that expired days earlier in generated sites with analytics enabled. The middleware read posthog-js's `$sesid` cookie and forwarded `$sesid[1]` (the session id) while ignoring `$sesid[0]` (last activity) and `$sesid[2]` (session start) - the two fields posthog-js itself checks before deciding a session is still alive - so a document-load pageview went out stamped with a dead session: that stretched the dead session's duration, and the real new session then began with no pageview in it, losing the landing page for the visit. Both are direct inputs to bounce rate and entry-path reports, and because this is a template the bug shipped into every generated site and affected every returning reader. The middleware now owns session identity, rotating on the same rules posthog-js uses (30 minutes idle, 24 hour hard cap) backed by a `dcp_sid` cookie holding `id.startTs.lastTs`, and posthog-js adopts that id through `bootstrap.sessionID`, so there is one authority rather than two that disagree; the `$sesid` read is removed entirely. A prefetch is the router speculating rather than the reader acting, so it neither counts as a pageview nor extends a session, while a soft navigation keeps the session alive without being counted. Unlike `dcp_anon_id`, `dcp_sid` is deliberately not `httpOnly`, because the browser has to read it to bootstrap; it grants no privilege, and posthog-js already keeps an equivalent id in a readable cookie of its own
- Keep doc pages cacheable while sessions stay fresh. A response carrying `Set-Cookie` is not cacheable by Vercel's CDN, so refreshing the session cookie's last-activity from the middleware - roughly once a minute per active reader - would have put a `Set-Cookie` on nearly every page an engaged reader loads, defeating the point of serving prerendered pages from the edge. The upkeep is now split by who can do it cheaply: the middleware writes `dcp_sid` only when it mints a new session (a live session is adopted, not rewritten, so ordinary doc-page responses carry no `Set-Cookie`), and the browser advances `lastTs` through `document.cookie`, which sets no response header at all. The client syncs at init, on `posthog.onSessionId` (first appearance and every rotation), and on each soft-navigation pageview - that last one because `onSessionId` does not fire when the id is unchanged, and without it a reader who browses only via client-side links would look idle to the next document load. `startTs` is carried forward while the id is unchanged, so the 24 hour cap still measures from when the session really began. One known consequence: if an ad blocker stops posthog-js, nothing refreshes `lastTs`, so that reader's sessions become fixed ~30-minute windows rather than idle-based - coarser, but still correct, unlike the original bug
- Keep the `onSessionId` subscription alive under React StrictMode: the init guard wrapped the subscription, so under StrictMode's development double-invoke the effect ran, was cleaned up (unsubscribing), then ran again and hit the early return without re-subscribing, leaving no session-id listener at all. Production was unaffected, since the double-invoke is development-only - which is the worse failure mode, because development is exactly where you would go to check the session handshake works. The provider now initializes once and subscribes on every run

## 0.0.129

- Thank you to [@arditgjeloshaj](https://github.com/arditgjeloshaj), Doccupine's first outside contributor, who reported and fixed the config-path issue below in [#11](https://github.com/doccupine/cli/pull/11)
- Store `doccupine.json`'s `watchDir` and `outputDir` relative to the project root instead of as absolute paths. The file is auto-generated in your project root and is not gitignored, so it gets committed with entries like `/Users/you/Developer/my-docs/docs`, which breaks the build for every other contributor and for CI, Docker, and Vercel, and leaks your local username and directory layout into a public repo. The read side already resolved relative values against the working directory, so nothing else had to change: an existing config is migrated in place the next time any command loads it (a one-line diff, no action required), absolute paths still resolve on read, and a watch directory that genuinely lives outside the project tree is stored unchanged. Stored paths are normalized to POSIX separators so a config written on Windows still resolves on macOS and Linux
- Stop the CLI from starting a `watch` run when its entry module is merely imported: `program.parse()` ran at import time, so importing `src/index.ts` for its helpers (as the test suite does) fell through to the default command, leaving the suite one step away from writing a `doccupine.json` into the repo root and starting file watchers. Argument parsing now runs only when the module is the process entrypoint, comparing real paths so the npm-installed bin symlink (`node_modules/.bin/doccupine` pointing at `dist/index.js`) still counts as a match and `npx doccupine` keeps working
- Update CLI dev dependency prettier to ^3.9.6

## 0.0.128

- Stop counting every pageview twice in generated sites with analytics enabled. The client tracker captured a `$pageview` on mount and on every route change, while the middleware independently captured one on every request the client had already counted - including the initial document load and, because only prefetches were filtered, the RSC requests behind client-side navigations. Both events were plain `$pageview`s distinguished solely by a `_server_side` property that nothing dedupes on, so default dashboards reported roughly double the real traffic. The two layers now cover disjoint navigation types: the middleware skips any request carrying the `RSC` header and so owns document loads, and the client tracker skips its first effect run and so owns soft navigations. **Expect pageview and session counts to fall by roughly half after upgrading - that is the correction, not a regression.** Historical data before the upgrade remains inflated
- Stop inventing a new anonymous person on every request from a reader whose PostHog cookie is missing. The middleware fell back to `crypto.randomUUID()` whenever it could not read `ph_<key>_posthog`, which is the case for every ad-blocked reader on every request and for every reader's very first request - so a single person browsing ten pages could appear as ten unique visitors, inflating unique counts and the billable person volume on your PostHog project. Readers now get a stable first-party `dcp_anon_id` cookie (httpOnly, one year, `SameSite=Lax`), so one anonymous reader is one person for as long as the cookie survives. The cookie is written on every middleware exit path, including the password gate's rewrite and redirect, so a reader held at the gate cannot loop minting fresh ids. Note this means an analytics-enabled site now sets a first-party cookie where it previously set none; the analytics documentation has been updated to say so
- Forward the reader's PostHog session and device ids from the client cookie onto server-captured pageviews, so a server event joins the session the browser already started instead of appearing outside every session
- Point `ui_host` at the PostHog dashboard rather than the ingestion endpoint. It was being handed the `host` value from `analytics.json` (`https://eu.i.posthog.com`), so the toolbar and "view in PostHog" links pointed at an ingestion origin that serves no UI; it is now derived by dropping the `.i.` segment, leaving self-hosted instances (which serve both from one origin) untouched
- Correct the analytics documentation, which described the tracking model inaccurately in two directions. The platform analytics page claimed page views are tracked client-side and that "no data is sent directly to PostHog", both of which were false - server-side capture exists, and it posts straight from your server to PostHog, since the `/ingest` proxy only ever covered the browser. The CLI analytics page documented both layers but presented the duplication as a feature ("two layers of tracking") without noting counts were doubled, and repeated a "no third-party domains appear in network requests" claim true only of the browser half
- Drop `@posthog/react` from generated sites' dependencies. It was declared but never imported by any generated file

## 0.0.127

- Emit a per-page markdown counterpart for the home page, the only doc page that never got one: the generator writes a `.md` file per page into the generated app's `public/` directory alongside `llms.txt` and `llms-full.txt`, but `generateSlug()` returns an empty string for `index.mdx`, which would have produced the filename `.md` (a dotfile), so the home page was skipped outright. Its counterpart is now named `index.md` and served at `/index.md`. Every other page keeps its existing name, so a directory index still collapses to its parent slug (`platform/index.mdx` still writes `public/platform.md`), and the new file is registered in the stale-file manifest so rename and delete cleanup applies to it like any other page
- Document the File Editor's component insertion, live preview, and media directories on the platform documentation page: how the toolbar menu, the `/` shortcut, and `<` autocomplete insert components (and why nested-only components stay out of the menu), how the Code, Split, and Preview modes render components, repository images, and Mermaid diagrams, and how directory browsing, directory-scoped uploads, and copy path work, including the hidden placeholder file Git requires to track an otherwise empty directory
- Drop the blank line between the closing frontmatter delimiter and the first heading across all 49 starter MDX documentation templates, so scaffolded docs open directly on their first heading; frontmatter parsing is unaffected, leaving the generated pages and navigation identical
- Update generated app dependencies lucide-react to ^1.25.0, posthog-js to ^1.404.1, posthog-node to ^5.45.2, and styled-components to ^6.4.4

## 0.0.126

- Render Mermaid diagrams in the generated docs: a `mermaid` fenced code block now becomes a themed SVG diagram, with properties set on the opening fence - `placement` puts the interactive controls in any corner (`top-left`, `top-right`, `bottom-left`, `bottom-right`; default `bottom-right`) and `actions` shows or hides them, overriding the default of appearing only once a diagram is taller than 120px. Readers can zoom, pan, drag the diagram with the mouse, reset the view, and open it full screen. Diagrams are rendered at build time by `beautiful-mermaid` inside a `server-only` module, so pages stay `force-static` and neither the library nor its elkjs layout engine reaches the browser (they would otherwise add roughly 537 KB gzip to the client bundle); the client ships only the zoom/pan chrome. Diagram colors resolve through new `--mermaid-*` CSS custom properties derived from the site palette, so one build-time render serves both modes and the theme toggle recolors diagrams through the cascade with no re-render, and any of them can be overridden to restyle diagrams without touching the palette
- Support six Mermaid diagram types - flowchart, sequence, state, class, entity relationship, and XY chart - and degrade the rest gracefully: `beautiful-mermaid` is an independent implementation rather than a Mermaid wrapper, so `pie`, `gantt`, `mindmap`, `journey`, and `gitGraph` are unsupported and throw, as does any syntax error. Because doc pages are statically rendered, an uncaught throw would fail the whole page's build, so an unrenderable diagram now falls back to a plain code block showing its source and logs a warning naming the offending file, letting a build always finish. ELK is the layout engine for every diagram, and a `%%{init: ...}%%` directive is read as a comment and ignored rather than erroring, so diagrams ported from other tools still render. A new Mermaid documentation page covers the syntax, the supported types, the properties, and the theming variables
- Carry a fenced code block's meta string (the text after the language on the opening fence) through to the component that renders it: `mdast-util-to-hast` drops it when building `<pre><code>`, so a new rehype plugin copies it onto the code element, where MDX passes it through as a plain string that is parsed rather than evaluated
- Redesign the generated site's header logo as a white mascot on a solid blue circle, and keep the rest of a logo correctly themed: the header's fill override now targets any element carrying a `fill` attribute instead of only `path`, so non-path SVG shapes (`circle`, `rect`, `g`) also pick up the primary theme color, while the mascot artwork is marked `ignore-fill` and excluded from that override so it stays white rather than being recolored
- Add a "What is Doccupine" page to the Getting Started section of the starter documentation
- Add generated app dependency beautiful-mermaid ^1.1.3, and update @langchain/core to ^1.2.3, posthog-js to ^1.403.0, posthog-node to ^5.45.1, @typescript-eslint/eslint-plugin and @typescript-eslint/parser to ^8.64.0, and tsx to ^4.23.1

## 0.0.125

- Keep each `<Update>` entry's sidebar (its label and description) pinned in view while its content scrolls past: at the `lg` breakpoint, where the update renders as a two-column row, the sidebar is now `position: sticky` at `top: 80px` (matching the site's `scroll-padding-top` header offset) with `align-self: flex-start` so the flex row no longer stretches it to full height and leaves it room to travel. Below `lg` the layout still stacks, so the sticky behavior applies only to the desktop two-column view

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
