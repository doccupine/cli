export const gitHubCardTemplate = `import { GitFork, Star } from "lucide-react";
import { DEFAULT_STRINGS, type UiStrings } from "@/utils/strings";

// Styles: app/styles/design.css (.dcp-card and .dcp-github-card, see
// src/templates/styles/github-card.ts in the CLI).

interface GitHubCardProps {
  /** The repository, as "owner/name". */
  repo: string;
  /** The page language's strings, for the counts' screen reader labels. */
  strings?: UiStrings;
}

interface RepoStats {
  description: string | null;
  stars: number;
  forks: number;
}

// GitHub's own rules: an owner is 1-39 letters, digits and single inner
// hyphens; a repository name is letters, digits, ".", "_" and "-". Only a
// slug that passes both is ever put in a URL.
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const NAME = /^[A-Za-z0-9._-]{1,100}$/;

const ONE_DAY = 60 * 60 * 24;
const TIMEOUT_MS = 5000;

export function parseRepo(
  value: unknown,
): { owner: string; name: string } | null {
  if (typeof value !== "string") return null;
  const parts = value.trim().split("/");
  if (parts.length !== 2) return null;
  const [owner, name] = parts;
  if (!OWNER.test(owner) || !NAME.test(name)) return null;
  if (name === "." || name === "..") return null;
  return { owner, name };
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

/**
 * The repository's description and counts, fetched while the page renders
 * on the server (at build time) and cached for a day, so the page refreshes
 * daily where the host supports it. GITHUB_TOKEN, when set, raises GitHub's
 * rate limit; it never leaves the server. Any failure (a timeout, a rate
 * limit, a private or missing repository) returns null and the card shows
 * without counts.
 */
async function fetchRepo(
  owner: string,
  name: string,
): Promise<RepoStats | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "doccupine-docs",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = \`Bearer \${token}\`;
  try {
    const response = await fetch(
      \`https://api.github.com/repos/\${owner}/\${name}\`,
      {
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: ONE_DAY },
      },
    );
    if (!response.ok) {
      console.warn(
        \`[doccupine] GitHubCard: GitHub answered \${response.status} for \${owner}/\${name}; showing the card without counts.\`,
      );
      return null;
    }
    const data = (await response.json()) as Record<string, unknown>;
    return {
      description:
        typeof data.description === "string" && data.description.trim()
          ? data.description.trim()
          : null,
      stars: count(data.stargazers_count),
      forks: count(data.forks_count),
    };
  } catch (error) {
    console.warn(
      \`[doccupine] GitHubCard: could not reach GitHub for \${owner}/\${name}; showing the card without counts.\`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// The GitHub mark, in the text color.
function GitHubMark() {
  return (
    <svg
      className="dcp-github-card__mark"
      viewBox="0 0 16 16"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/**
 * A card for a GitHub repository: its name, description, stars and forks,
 * linking to it on GitHub. Server only: no request ever leaves the reader's
 * browser for GitHub.
 */
async function GitHubCard({
  repo,
  strings = DEFAULT_STRINGS,
}: GitHubCardProps) {
  const parsed = parseRepo(repo);
  if (!parsed) {
    console.warn(
      \`[doccupine] GitHubCard: "\${String(repo)}" is not an "owner/name" repository; the card is not shown.\`,
    );
    return null;
  }
  const { owner, name } = parsed;
  const stats = await fetchRepo(owner, name);
  return (
    <a
      className="dcp-card dcp-github-card"
      data-link
      href={\`https://github.com/\${owner}/\${name}\`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="dcp-github-card__header">
        <GitHubMark />
        <span className="dcp-card__title dcp-github-card__name">
          {owner}/{name}
        </span>
      </span>
      {stats?.description && (
        <span className="dcp-github-card__description">
          {stats.description}
        </span>
      )}
      {stats && (
        <span className="dcp-github-card__stats">
          <span className="dcp-github-card__stat">
            <Star aria-hidden="true" />
            {compact.format(stats.stars)}
            <span className="dcp-visually-hidden"> {strings.githubStars}</span>
          </span>
          <span className="dcp-github-card__stat">
            <GitFork aria-hidden="true" />
            {compact.format(stats.forks)}
            <span className="dcp-visually-hidden"> {strings.githubForks}</span>
          </span>
        </span>
      )}
    </a>
  );
}

export { GitHubCard, type GitHubCardProps };
`;
