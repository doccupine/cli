import type { AnalyticsConfig, FontConfig } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateFontConfig(value: unknown): FontConfig {
  if (!isRecord(value)) {
    throw new Error("fonts.json must contain a JSON object.");
  }

  const hasGoogleFont = value.googleFont !== undefined;
  const hasLocalFonts = value.localFonts !== undefined;
  if (hasGoogleFont === hasLocalFonts) {
    throw new Error(
      "fonts.json must define exactly one of googleFont or localFonts.",
    );
  }

  if (hasGoogleFont) {
    if (!isRecord(value.googleFont)) {
      throw new Error("fonts.json googleFont must be an object.");
    }
    const fontName = value.googleFont.fontName;
    if (
      !nonEmptyString(fontName) ||
      !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(fontName)
    ) {
      throw new Error(
        "fonts.json googleFont.fontName must be a valid exported font identifier.",
      );
    }

    const subsets = value.googleFont.subsets;
    if (
      subsets !== undefined &&
      (!Array.isArray(subsets) || !subsets.every(nonEmptyString))
    ) {
      throw new Error(
        "fonts.json googleFont.subsets must be an array of non-empty strings.",
      );
    }

    const weight = value.googleFont.weight;
    if (
      weight !== undefined &&
      !nonEmptyString(weight) &&
      (!Array.isArray(weight) ||
        weight.length === 0 ||
        !weight.every(nonEmptyString))
    ) {
      throw new Error(
        "fonts.json googleFont.weight must be a non-empty string or string array.",
      );
    }

    return {
      googleFont: {
        fontName,
        ...(subsets !== undefined ? { subsets: [...subsets] } : {}),
        ...(weight !== undefined
          ? { weight: Array.isArray(weight) ? [...weight] : weight }
          : {}),
      },
    };
  }

  if (nonEmptyString(value.localFonts)) {
    return { localFonts: value.localFonts };
  }
  if (!isRecord(value.localFonts) || !Array.isArray(value.localFonts.src)) {
    throw new Error(
      "fonts.json localFonts must be a non-empty path or an object with a src array.",
    );
  }
  if (value.localFonts.src.length === 0) {
    throw new Error("fonts.json localFonts.src must not be empty.");
  }

  const src = value.localFonts.src.map((entry, index) => {
    if (
      !isRecord(entry) ||
      !nonEmptyString(entry.path) ||
      (entry.weight !== undefined && !nonEmptyString(entry.weight)) ||
      (entry.style !== undefined && !nonEmptyString(entry.style))
    ) {
      throw new Error(
        `fonts.json localFonts.src entry ${index + 1} needs a string path and optional string weight/style values.`,
      );
    }
    return {
      path: entry.path,
      ...(entry.weight !== undefined ? { weight: entry.weight } : {}),
      ...(entry.style !== undefined ? { style: entry.style } : {}),
    };
  });

  return { localFonts: { src } };
}

export function validateAnalyticsConfig(value: unknown): AnalyticsConfig {
  if (!isRecord(value) || value.provider !== "posthog") {
    throw new Error('analytics.json provider must be "posthog".');
  }
  if (!isRecord(value.posthog)) {
    throw new Error("analytics.json posthog must be an object.");
  }

  const key = value.posthog.key;
  if (!nonEmptyString(key) || !/^[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error(
      "analytics.json posthog.key must contain only letters, numbers, underscores, and hyphens.",
    );
  }

  const configuredHost = value.posthog.host;
  let host: string | undefined;
  if (configuredHost !== undefined) {
    if (!nonEmptyString(configuredHost)) {
      throw new Error("analytics.json posthog.host must be a non-empty URL.");
    }
    const trimmedHost = configuredHost.trim();
    let parsed: URL;
    try {
      parsed = new URL(trimmedHost);
    } catch {
      throw new Error("analytics.json posthog.host must be a valid URL.");
    }
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        "analytics.json posthog.host must be an HTTP(S) URL without credentials, query, or fragment.",
      );
    }
    host = trimmedHost.replace(/\/+$/, "");
  }

  return {
    provider: "posthog",
    posthog: { key, ...(host ? { host } : {}) },
  };
}
