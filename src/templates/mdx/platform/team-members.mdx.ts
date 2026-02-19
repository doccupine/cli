export const platformTeamMembersMdxTemplate = `---
title: "Team Members"
description: "Invite collaborators and manage roles for your documentation project."
date: "2026-02-19"
category: "Account"
categoryOrder: 4
order: 0
section: "Platform"
---
# Team Members
The Members settings page lets project owners invite collaborators and manage their access levels. Team members can view, edit, or manage billing depending on their assigned role.

## Inviting members
1. Navigate to your project's **Members** settings.
2. Enter the collaborator's email address.
3. Select a role.
4. Click **Add Member**.

The invited user will see the project under **Shared Projects** on their dashboard.

## Roles

### Viewer
Can browse files and view the project, but cannot make edits or publish changes. Useful for stakeholders who need read access.

### Editor
Can edit files and publish changes. Can also modify site configuration (theme, navigation, fonts, etc.). Cannot manage team members or billing.

### Billing
Can access the billing management page and Stripe billing portal. Cannot edit files or site configuration.

<Callout type="note">
  The project **owner** has full access to everything - editing, publishing, configuration, member management, billing, and project deletion.
</Callout>

## Member limits
The number of team members depends on your plan:

- **Pro** - up to 5 members
- **Enterprise** - unlimited members

The Members page shows your current count against your plan's limit.

## Removing members
Project owners can remove any member by clicking the remove button next to their name. Members can also remove themselves from a project by clicking **Leave Project**.`;
