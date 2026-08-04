export const commandsMdxTemplate = `---
title: "Commands"
description: "In this page, you can find all the commands available in Doccupine CLI."
date: "2026-02-19"
updated: "2026-08-04"
category: "Getting Started"
categoryOrder: 0
order: 2
---
# Commands

In this page, you can find all the commands available in Doccupine CLI.

## Run Doccupine CLI

Create a new directory for your project and navigate to it in your terminal. Run the following command to create a new Doccupine project:

\`\`\`bash
npx doccupine
\`\`\`

Once you run the command, Doccupine will ask you to select a directory to store your MDX files. Choose the directory where you want to create your documentation files.
After selecting the directory, Doccupine will ask you to enter the name of the directory for the generated website. Enter the name of the directory where you want to create your website.
Finally, Doccupine will ask for an optional path to an OpenAPI document. Leave it blank to skip, or point it at a \`.yaml\`, \`.yml\`, or \`.json\` spec to generate an interactive [API Playground](/api-playground) from your API.

This will start the development server on port 3000. Open your browser and navigate to http://localhost:3000 to view your documentation.

## Options

| Flag                       | Description                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| \`--port <port>\`            | Port for the dev server (default: \`3000\`). Auto-increments if taken.        |
| \`--verbose\`                | Show all Next.js output including compilation details.                      |
| \`--reset\`                  | Re-prompt for watch/output directories and the OpenAPI spec path.           |
| \`--skip-install\`           | Always skip dependency installation before starting the development server. |
| \`--package-manager <name>\` | Use \`pnpm\` or \`npm\` for the generated app instead of auto-detection.        |

<Callout type="warning">
  The watch and output directories must not overlap. The output directory must be empty, contain only local metadata such as \`.DS_Store\` or \`.env.local\`, or already be owned by Doccupine. This prevents the generator from overwriting another project. If an older \`doccupine.json\` no longer validates, run \`doccupine config --reset\`. Generation also reports a validation error, instead of letting one page overwrite another, when two source files resolve to the same route.
</Callout>

Starter documentation is created only when the selected source directory contains no MDX files. Existing pages are never replaced just because \`index.mdx\` is missing. Frontmatter must use the normal YAML \`---\` delimiter; language-tagged executable frontmatter is rejected.

Doccupine marks its output directory with \`.doccupine-generated.json\` and records generated route, Markdown-mirror, and copied public-file ownership in \`.doccupine-artifacts.json\`. Treat both files as internal generator state. A fresh run recreates \`app\`, and later refreshes may rewrite other registered template paths, so keep durable changes in source MDX, project-root JSON files, and \`public\`.

## Watch mode

The default command watches MDX files, supported project-root JSON configuration, \`fonts.json\`, \`analytics.json\`, \`doccupine.json\`, public assets, and configured OpenAPI documents with their discovered local \`$ref\` files. Changes are processed serially. Once every watcher is ready, Doccupine compares the current sources with the versions used during initial generation and reconciles edits made while startup was still running.

## Route collisions and recovery

Two MDX sources cannot generate the same route. For example, \`guide.mdx\` and \`guide/index.mdx\` both resolve to \`/guide\`. A one-time build stops before either source can overwrite the other.

During watch mode, a collision keeps the last successfully generated page and site metadata in place. After you move, rename, or delete one of the colliding sources, Doccupine retries the blocked sources and any other MDX changes that could not be applied while the collision existed. A restart or manual resave is not required.

<Callout type="info">
  Failed watch refreshes keep or restore the last successful pages, route ownership, inferred sections, sitemap, and LLMS/MCP content. A new page with no successful version stays absent until it can be generated safely.
</Callout>

## Reloading doccupine.json

Changing the \`openapi\` field is applied live after the complete candidate reference validates and generates successfully. Invalid JSON, invalid configuration, a missing spec, or a failed generation keeps the current OpenAPI reference and watcher active. Changes to \`watchDir\`, \`outputDir\`, \`port\`, or \`packageManager\` require restarting Doccupine.

## File-system safety

Doccupine does not follow symlinked MDX files or nested directories beneath \`watchDir\`. Project-root configuration and public assets must also use real files and directories, and the \`public\` root cannot be a symlink. A stable symlink used as the \`watchDir\` root is supported, but links inside it are rejected.

The output directory must be a real directory, and generated paths cannot contain symlinks. OpenAPI root specs must resolve inside the project, while local references must remain inside the root spec's directory. These checks prevent generated reads, writes, and removals from being redirected elsewhere.

## Dependency installation

The first run installs the generated app's dependencies. After that, Doccupine records a fingerprint of the generated \`package.json\` and the package manager in \`.doccupine-install\` and reinstalls only when that fingerprint changes or \`node_modules\` is missing - later runs start the dev server straight away. Pass \`--skip-install\` to skip the check entirely, for example when you manage dependencies yourself.

## Browsing from another device

The dev server is reachable from other devices on your network, but Next.js only serves development resources such as the hot-reload socket to hosts it recognizes. Opened over a LAN IP or a Tailscale/VPN hostname, the page renders but never becomes interactive.

To allow additional hostnames, set \`ALLOWED_DEV_ORIGINS\` in the generated app's \`.env\` file and restart the dev server. Comma-separate multiple hostnames:

\`\`\`env
ALLOWED_DEV_ORIGINS=my-machine.tailnet-name.ts.net
\`\`\`

<Callout type="note">
  This only affects the development server. Production builds ignore the
  variable, and leaving it unset keeps Next's DNS-rebinding protection fully
  enabled.
</Callout>

## Verbose mode

\`\`\`bash
npx doccupine --verbose
\`\`\`

<Callout type="note">
  This will show Next.js output in the terminal, providing detailed logs useful for debugging during development.
</Callout>

## Generate the website

\`\`\`bash
npx doccupine build
\`\`\`

You can also use the equivalent \`npx doccupine generate\` command. These commands scaffold the Next.js app from your MDX files without installing dependencies or starting the development server. To produce a production build, install dependencies and run the generated app's \`build\` script.

## Show current configuration

\`\`\`bash
npx doccupine config --show
\`\`\`

This will show the current configuration for Doccupine.

## Reset configuration

\`\`\`bash
npx doccupine config --reset
\`\`\`

This will reset the current configuration for Doccupine.`;
