export const commandsMdxTemplate = `---
title: "Commands"
description: "In this page, you can find all the commands available in Doccupine CLI."
date: "2026-02-19"
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

Doccupine records generated route and Markdown-mirror ownership in \`.doccupine-artifacts.json\` inside the generated app. Watch-mode renames and deletes use that registry rather than guessing routes from filenames, so section moves remove only files owned by the changed source.

## Dependency installation

The first run installs the generated app's dependencies. After that, Doccupine records a fingerprint of the generated \`package.json\` and the package manager in \`.doccupine-install\` and reinstalls only when that fingerprint changes or \`node_modules\` is missing - later runs start the dev server straight away. Pass \`--skip-install\` to skip the check entirely, for example when you manage dependencies yourself.

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
