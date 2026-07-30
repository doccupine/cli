import { describe, expect, it } from "vitest";

import { rootLayoutTemplate } from "./layout.js";
import {
  validateAnalyticsConfig,
  validateFontConfig,
} from "./project-config.js";
import type { AnalyticsConfig, FontConfig } from "./types.js";
import { nextConfigTemplate } from "../templates/next.config.js";
import { proxyTemplate } from "../templates/proxy.js";

describe("project configuration", () => {
  it("accepts supported Google and local font shapes", () => {
    expect(
      validateFontConfig({
        googleFont: {
          fontName: "Work_Sans",
          subsets: ["latin"],
          weight: ["400", "700"],
        },
      }),
    ).toEqual({
      googleFont: {
        fontName: "Work_Sans",
        subsets: ["latin"],
        weight: ["400", "700"],
      },
    });
    expect(validateFontConfig({ localFonts: "../public/font.woff" })).toEqual({
      localFonts: "../public/font.woff",
    });
    expect(
      validateFontConfig({
        localFonts: { src: [{ path: "../public/font.woff" }] },
      }),
    ).toEqual({
      localFonts: { src: [{ path: "../public/font.woff" }] },
    });
  });

  it("rejects executable or malformed font configuration", () => {
    expect(() =>
      validateFontConfig({
        googleFont: { fontName: "Inter }; process.exit(1); //" },
      }),
    ).toThrow("valid exported font identifier");
    expect(() =>
      validateFontConfig({
        localFonts: { src: [{ path: "font.woff", weight: 400 }] },
      }),
    ).toThrow("optional string weight/style");
    expect(() => validateFontConfig({})).toThrow("exactly one");
  });

  it("serializes local font values as data and rejects unsafe identifiers", () => {
    const local = rootLayoutTemplate({
      localFonts: 'font"; process.exit(1); //',
    });
    expect(local).toContain('src: "font\\\"; process.exit(1); //"');

    const invalid = rootLayoutTemplate({
      googleFont: {
        fontName: "Inter }; process.exit(1); //",
      },
    } as FontConfig);
    expect(invalid).toContain('import { Inter } from "next/font/google"');
    expect(invalid).not.toContain("process.exit");
  });

  it("validates and normalizes PostHog configuration", () => {
    expect(
      validateAnalyticsConfig({
        provider: "posthog",
        posthog: {
          key: "phc_project-key",
          host: "  https://ph.example/  ",
        },
      }),
    ).toEqual({
      provider: "posthog",
      posthog: { key: "phc_project-key", host: "https://ph.example" },
    });

    expect(() =>
      validateAnalyticsConfig({
        provider: "posthog",
        posthog: { key: 'key"; process.exit(1); //' },
      }),
    ).toThrow("must contain only");
    expect(() =>
      validateAnalyticsConfig({
        provider: "posthog",
        posthog: { key: "key", host: "javascript:alert(1)" },
      }),
    ).toThrow("HTTP(S)");
  });

  it("encodes analytics values as TypeScript string literals defensively", () => {
    const config = {
      provider: "posthog",
      posthog: {
        key: 'key"; process.exit(1); //',
        host: 'https://example.com/"; process.exit(1); //',
      },
    } as AnalyticsConfig;

    const nextConfig = nextConfigTemplate(config);
    const proxy = proxyTemplate(config);
    expect(nextConfig).toContain(
      JSON.stringify(`${config.posthog.host}/:path*`),
    );
    expect(proxy).toContain(JSON.stringify(`ph_${config.posthog.key}_posthog`));
    expect(nextConfig).not.toContain(
      `destination: "${config.posthog.host}/:path*"`,
    );
  });
});
