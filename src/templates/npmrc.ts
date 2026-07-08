// Several ESLint plugins the generated app depends on (eslint-plugin-react,
// eslint-plugin-jsx-a11y, eslint-plugin-import) haven't published ESLint 10 in
// their peer ranges yet, even though they run fine under it. pnpm only warns on
// such peer mismatches,
// but npm (used by the Vercel build's `cd nextjs-app && npm install`) hard-fails
// with ERESOLVE. legacy-peer-deps tells npm to skip that strict check, matching
// pnpm's behavior. Remove once the plugins declare ESLint 10 support.
export const npmrcTemplate = `legacy-peer-deps=true
`;
