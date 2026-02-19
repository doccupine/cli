export const platformProjectSettingsMdxTemplate = `---
title: "Project Settings"
description: "Rename or delete your documentation project."
date: "2026-02-19"
category: "Account"
categoryOrder: 4
order: 2
section: "Platform"
---
# Project Settings
The Project settings page provides basic project management options including renaming and deletion.

## Renaming a project
Enter a new name for your project and click **Save**. The project name is used in the dashboard and sidebar - it does not affect your site's URL or domain.

## Deleting a project

<Callout type="warning">
  Deleting a project is permanent and cannot be undone.
</Callout>

To delete a project:

1. Navigate to the **Project** settings page.
2. In the **Danger Zone** section, click **Delete Project**.
3. Type your project's name to confirm.
4. Click **Delete**.

Deletion removes:
- The GitHub repository (if managed by Doccupine)
- The hosted deployment
- All pending changes
- All team member associations
- The project record

If you're using a user-connected GitHub repository, the repo in your GitHub account is preserved - only the Doccupine project and its deployment are removed.`;
