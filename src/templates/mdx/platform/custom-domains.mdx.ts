export const platformCustomDomainsMdxTemplate = `---
title: "Custom Domains"
description: "Connect your own domain to your documentation site with automatic HTTPS."
date: "2026-02-19"
category: "Infrastructure"
categoryOrder: 3
order: 0
section: "Platform"
---
# Custom Domains
By default, your documentation site is available at a \`.doccupine.app\` subdomain. You can connect your own custom domain for a branded experience.

## Adding a domain

1. Navigate to your project's **Domains** page from the sidebar.
2. Enter your custom domain (e.g., \`docs.yourcompany.com\`).
3. Click **Add Domain**.

Doccupine will provide DNS records that you need to configure with your domain registrar.

## DNS configuration
After adding your domain, you'll see the required DNS records. Typically this involves adding a **CNAME** record pointing to your Doccupine deployment.

Configure the records with your domain registrar (Cloudflare, Namecheap, GoDaddy, Route 53, etc.) and return to the Domains page to check verification status.

<Callout type="note">
  DNS changes can take up to 48 hours to propagate, though most resolve within a few minutes.
</Callout>

## Verification
Doccupine periodically checks whether your DNS records are configured correctly. The Domains page shows the current verification status. Once verified, your custom domain is active and serves your documentation with automatic HTTPS.

## Removing a domain
Click the remove button next to your domain to disconnect it. Your site will continue to be available at its \`.doccupine.app\` URL.`;
