export const platformVersionsMdxTemplate = `---
title: "Versions"
description: "Freeze the current documentation as a version from the dashboard and keep older versions online."
date: "2026-09-08"
category: "Configuration"
categoryOrder: 2
order: 7
section: "Platform"
---
# Versions

The **Versions** page under a project's settings manages the project's \`versions.json\` and the version folders in its repository. It is the dashboard counterpart of the CLI's [Versions](/versions) feature, and it stages everything as pending changes for you to review and [publish](/platform/publishing).

## Enabling versions

Turn on **Enable versions** and give the current documentation a label, such as \`v2.0\`. Saving writes a \`versions.json\` with that single default entry. Nothing moves: the default version's pages stay at the root of the docs folder.

## Creating a version snapshot

Click **Create version snapshot**, enter the slug (\`v1\`) and label (\`v1.0\`) of the version you want to freeze, and confirm. The current pages of the default version are copied into the version folder, in every configured language, and the new entry is added to \`versions.json\`. Keep editing the root as the next release and change the default entry's label when it ships.

## Editing a version

The file explorer shows a version selector when versions are configured, so you work inside one version at a time. Pages inside a version folder are ordinary MDX files.

## Removing a version

Removing a version from the list asks whether its pages should be deleted too. The removal, the deleted pages, and the updated \`versions.json\` are staged together and appear in the Publish dialog.

## Rules

A version slug must be a lowercase URL segment and must not collide with a section slug, a language code, or a reserved route segment. The page refuses a collision when you save, and the Publish dialog refuses a change set that would stop the site build. The default entry cannot be removed or given a slug.
`;
