export const gatePageTemplate = `import type { Metadata } from "next";
import { SiteGate } from "@/components/layout/SiteGate";
import { verifyBrandingKey } from "@/utils/branding";

// The gate screen is never indexed. The middleware also sets X-Robots-Tag and
// robots.txt disallows everything while SITE_PASSWORD is active.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// The login form is identical for every visitor, so it can render statically.
// The middleware (proxy.ts) decides who is shown this screen by rewriting
// locked requests here; unlocked visitors are redirected back to the site.
export const dynamic = "force-static";
export const revalidate = false;

export default function GatePage() {
  const hideBranding = verifyBrandingKey();
  return <SiteGate hideBranding={hideBranding} />;
}
`;
