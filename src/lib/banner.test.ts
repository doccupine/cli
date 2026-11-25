import { describe, expect, it } from "vitest";

import { BANNER_MAX_LENGTH, bannerWarning } from "./banner.js";

describe("bannerWarning", () => {
  it("accepts a banner with content, and no banner at all", () => {
    expect(bannerWarning({})).toBeNull();
    expect(bannerWarning({ banner: { content: "Hi" } })).toBeNull();
    expect(
      bannerWarning({ banner: { content: "Hi", dismissible: true } }),
    ).toBeNull();
  });

  it("reports a value the site will drop", () => {
    expect(bannerWarning({ banner: "Hi" })).toMatch(/must be an object/);
    expect(bannerWarning({ banner: {} })).toMatch(/non-empty string/);
    expect(bannerWarning({ banner: { content: "  " } })).toMatch(
      /non-empty string/,
    );
    expect(
      bannerWarning({ banner: { content: "x".repeat(BANNER_MAX_LENGTH + 1) } }),
    ).toMatch(/at most 500 characters/);
    expect(
      bannerWarning({ banner: { content: "Hi", dismissible: "yes" } }),
    ).toMatch(/true or false/);
  });

  it("names unknown keys, which are ignored", () => {
    expect(bannerWarning({ banner: { content: "Hi", link: "/x" } })).toMatch(
      /unknown key "link"/,
    );
  });
});
