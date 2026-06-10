export const pnpmWorkspaceTemplate = `allowBuilds:
  core-js: false
  protobufjs: false
  sharp: false
  unrs-resolver: false
minimumReleaseAgeExclude:
  - '@next/env@16.2.9'
  - '@next/eslint-plugin-next@16.2.9'
  - '@next/swc-darwin-arm64@16.2.9'
  - '@next/swc-darwin-x64@16.2.9'
  - '@next/swc-linux-arm64-gnu@16.2.9'
  - '@next/swc-linux-arm64-musl@16.2.9'
  - '@next/swc-linux-x64-gnu@16.2.9'
  - '@next/swc-linux-x64-musl@16.2.9'
  - '@next/swc-win32-arm64-msvc@16.2.9'
  - '@next/swc-win32-x64-msvc@16.2.9'
  - '@posthog/core@1.31.1'
  - '@posthog/types@1.384.1'
  - baseline-browser-mapping@2.10.35
  - eslint-config-next@16.2.9
  - next@16.2.9
  - posthog-js@1.384.1
  - posthog-node@5.36.10
  - prettier@3.8.4
`;
