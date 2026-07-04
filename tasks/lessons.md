# Lessons

## Generated output must be prettier-clean at the source

- The generated app runs `prettier --write .` and `public/` is intentionally NOT in `.prettierignore`. Never "fix" formatting drift by ignoring generated files; fix the templates so their output is already prettier-stable.
- Prettier's markdown parser rewrites two things that MDX sample templates can trip on:
  - Fences using more backticks than needed (```` -> ``` when the content has no triple backticks).
  - Multi-line JSX open tags: attribute-line indentation gets stripped. Keep live JSX examples in MDX templates on a single line (use `\n` escapes inside template-literal props for multi-line code strings).
- Verification recipe: render every `src/templates/mdx/*.mdx.ts` body through `llmsPageTemplate` and run `prettier --check` on the results before calling MDX template work done.
- `pnpm build` does not clean `dist/`; stale compiled files from renamed templates linger. `rm -rf dist && pnpm build` before dist-based checks.
