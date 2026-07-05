## Summary

<!-- What does this PR do and why? -->

## Related issues

<!-- e.g. Closes #123 -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Template or generated-output change
- [ ] Documentation
- [ ] Refactor / chore

## Checklist

- [ ] `pnpm build && pnpm test` passes locally
- [ ] I tested the change against a real generated app (`node dist/index.js watch` in a scratch directory) when it affects generation
- [ ] New templates follow the `camelCaseTemplate` naming convention and are wired into `createNextJSStructure()`
- [ ] Generated output is prettier-stable (no formatting churn introduced)
- [ ] I did not commit secrets or `.env` files
- [ ] The PR is focused on a single feature or fix
