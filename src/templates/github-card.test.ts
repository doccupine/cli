import { describe, expect, it } from "vitest";

import { appStructure, startingDocsStructure } from "../lib/structures.js";
import { DEFAULT_UI_STRINGS } from "../lib/ui-strings.js";
import { docsTemplate } from "./components/Docs.js";
import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { gitHubCardTemplate } from "./components/layout/GitHubCard.js";
import { envExampleTemplate } from "./env.example.js";
import { componentsMdxTemplate } from "./mdx/components.mdx.js";
import { githubCardMdxTemplate } from "./mdx/github-card.mdx.js";
import { designStylesheet } from "./styles/index.js";

/** A regular expression literal declared in the template, as a RegExp. */
function templateRegExp(name: string): RegExp {
  const match = new RegExp(`const ${name} = /(.+)/;\\n`).exec(
    gitHubCardTemplate,
  );
  if (!match) throw new Error(`${name} not found`);
  return new RegExp(match[1]);
}

describe("GitHubCard", () => {
  it("only lets a valid GitHub owner/name into a URL", () => {
    const owner = templateRegExp("OWNER");
    const name = templateRegExp("NAME");
    for (const valid of ["doccupine", "a", "my-org", "A1-b2"]) {
      expect(owner.test(valid)).toBe(true);
    }
    for (const invalid of [
      "",
      "-org",
      "org-",
      "my--org",
      "a".repeat(40),
      "evil.com",
      "a/b",
      "x?y",
    ]) {
      expect(owner.test(invalid)).toBe(false);
    }
    for (const valid of ["cli", "next.js", "my_repo-2"]) {
      expect(name.test(valid)).toBe(true);
    }
    for (const invalid of [
      "",
      "a/b",
      "a b",
      "x#y",
      "%2e%2e",
      "r".repeat(101),
    ]) {
      expect(name.test(invalid)).toBe(false);
    }
    expect(gitHubCardTemplate).toContain(
      'if (name === "." || name === "..") return null;',
    );
  });

  it("fetches on the server only, with a timeout, a daily cache and an optional token", () => {
    expect(gitHubCardTemplate).not.toContain('"use client"');
    expect(gitHubCardTemplate).toContain("const TIMEOUT_MS = 5000;");
    expect(gitHubCardTemplate).toContain(
      "signal: AbortSignal.timeout(TIMEOUT_MS),",
    );
    expect(gitHubCardTemplate).toContain("next: { revalidate: ONE_DAY },");
    expect(gitHubCardTemplate).toContain(
      "const token = process.env.GITHUB_TOKEN;",
    );
    expect(gitHubCardTemplate).not.toContain("NEXT_PUBLIC_GITHUB");
    expect(envExampleTemplate).toContain("# GITHUB_TOKEN=");
  });

  it("falls back to a card without counts", () => {
    // Every failure path returns null stats, which renders the card's name
    // and link but no counts.
    expect(gitHubCardTemplate.match(/return null;/g)!.length).toBeGreaterThan(
      3,
    );
    expect(gitHubCardTemplate).toContain("{stats && (");
    expect(gitHubCardTemplate).toContain(
      "href={`https://github.com/${owner}/${name}`}",
    );
  });

  it("labels the counts for screen readers in the page's language", () => {
    expect(gitHubCardTemplate).toContain(
      '<span className="dcp-visually-hidden"> {strings.githubStars}</span>',
    );
    expect(DEFAULT_UI_STRINGS.githubStars).toBe("stars");
    expect(DEFAULT_UI_STRINGS.githubForks).toBe("forks");
    expect(docsTemplate).toContain(
      "<GitHubCard {...props} strings={strings} />",
    );
  });

  it("registers the component, styles and page", () => {
    expect(mdxComponentsTemplate).toMatch(/\n {4}GitHubCard,\n/);
    expect(appStructure["components/layout/GitHubCard.tsx"]).toBe(
      gitHubCardTemplate,
    );
    expect(startingDocsStructure["github-card.mdx"]).toBe(
      githubCardMdxTemplate,
    );
    expect(componentsMdxTemplate).toContain('href="/github-card"');
    expect(githubCardMdxTemplate).toContain('<Field value="repo"');
    expect(githubCardMdxTemplate).toContain("GITHUB_TOKEN");
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      // Side by side, every card's stats row sits at the bottom.
      expect(css).toMatch(/\.dcp-github-card \{[^}]*height: 100%;/);
      expect(css).toMatch(/\.dcp-github-card__stats \{\s*margin-top: auto;/);
    }
  });
});
