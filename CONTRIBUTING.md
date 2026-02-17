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
```

To test your changes locally:

```bash
pnpm build
mkdir /tmp/test-project && cd /tmp/test-project
node /path/to/cli/dist/index.js watch
```

## Project Structure

All CLI logic lives in `src/index.ts`. Template files under `src/templates/` are string constants that get written into the generated Next.js app.

When adding a new template:

1. Create the template file in the appropriate `src/templates/` subdirectory
2. Export a named constant with the `Template` suffix (e.g., `export const myComponentTemplate = ...`)
3. Import it in `src/index.ts` and add it to the `structure` object in `createNextJSStructure()`

## Code Conventions

- **ES Modules** - all imports use `.js` extensions (e.g., `import { foo } from "./bar.js"`)
- **TypeScript strict mode** - no `any` types unless unavoidable
- **Template naming** - `camelCaseTemplate` (e.g., `headerTemplate`, `mcpServerTemplate`)

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes and ensure `pnpm build && pnpm test` passes
3. Write a clear PR description explaining the change and why
4. Keep PRs focused - one feature or fix per PR
