# Contributing to Doccupine

## Setup

```bash
git clone https://github.com/doccupine/cli.git
cd cli
pnpm install
```

## Development

```bash
pnpm dev            # Watch mode (recompiles on changes)
pnpm build          # One-time compile
pnpm test           # Run tests
pnpm format:check   # Verify formatting
pnpm test:package   # Verify the npm package contents
pnpm smoke:generated # Generate, lint, type-check, and build a fixture site
```

To test your changes locally:

```bash
pnpm build
mkdir /tmp/test-project && cd /tmp/test-project
node /path/to/cli/dist/index.js watch
```

## Project Structure

`src/index.ts` is the bin entry point and public export surface; the CLI commands live in `src/cli.ts`. Generation is driven by the `MDXToNextJSGenerator` facade in `src/mdx-to-nextjs-generator.ts`, which delegates to focused services under `src/generator/` (secure source reads, app scaffolding, project configuration, sections, the page catalog and renderer, generated routes, the API reference, public assets, site artifacts, and watch coordination). Stateless helpers live under `src/lib/`, while template files under `src/templates/` are string constants written into the generated Next.js app. The output layout is registered centrally in `src/lib/structures.ts`.

When adding a new template:

1. Create the template file in the appropriate `src/templates/` subdirectory
2. Export a named constant with the `Template` suffix (e.g., `export const myComponentTemplate = ...`)
3. Import it in `src/lib/structures.ts` and add it to the `structure` object

## Code Conventions

- **ES Modules** - all imports use `.js` extensions (e.g., `import { foo } from "./bar.js"`)
- **TypeScript strict mode** - no `any` types unless unavoidable
- **Template naming** - `camelCaseTemplate` (e.g., `headerTemplate`, `mcpServerTemplate`)

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes and ensure `pnpm build && pnpm test && pnpm format:check && pnpm test:package` passes
3. Write a clear PR description explaining the change and why
4. Keep PRs focused - one feature or fix per PR

## Releasing

Releases are published by GitHub Actions. To ship a version:

1. Bump `version` in `package.json`
2. Add a matching `## <version>` section to `CHANGELOG.md`
3. Commit as `chore: release <version>` and push to `main`

`.github/workflows/release.yml` compares `package.json` against the registry on every push to `main`. A version that is already published is skipped, so an ordinary push costs one registry lookup. An unpublished one runs the full check suite, publishes to npm, and creates the `v<version>` tag and a GitHub release whose notes are that changelog section. A version bump that arrives through a pull request is checked for its changelog entry by CI, since the release itself refuses to publish without one.

Publishing uses npm trusted publishing over OIDC, so no npm token exists in the repository and every release carries a provenance attestation. The trust is registered on npmjs.com against `doccupine/cli` and the workflow filename `release.yml`; renaming or moving that file stops publishing until the trusted publisher is updated to match.

A prerelease publishes under a dist-tag taken from its own version, so `1.0.0-beta.1` lands on `beta` and never becomes `latest`. Name the channel in the version: a bare numeric prerelease such as `1.0.0-1` has no valid dist-tag and fails the guard before anything is published.

If a release fails part way through, fix the cause and re-run the workflow from the Actions tab. Once the version is on the registry the workflow is a no-op, so a rerun cannot double-publish.

## Code of Conduct

By participating in this project you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Found a vulnerability? Please report it privately as described in the [Security Policy](SECURITY.md). Do not open a public issue for security reports.
