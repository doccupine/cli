export const pnpmWorkspaceTemplate = `allowBuilds:
  core-js: false
  esbuild: false
  protobufjs: false
  sharp: false
  unrs-resolver: false
# Disable pnpm's minimum-release-age supply-chain gate for the generated app.
# The gate blocks freshly published versions, which trips installs whenever the
# pinned dependencies here are newer than the cutoff. Set to 0 to install any
# resolved version without waiting out the release-age window.
minimumReleaseAge: 0
`;
