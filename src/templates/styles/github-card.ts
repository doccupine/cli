import type { DesignStyles } from "./index.js";

// <GitHubCard> (components/layout/GitHubCard.tsx): a linked .dcp-card (its
// border, radius, padding and hover come from card.ts) with the repository's
// name, description and counts.
//
//   .dcp-github-card               the card (also .dcp-card, data-link)
//   .dcp-github-card__header       the GitHub mark and the name
//   .dcp-github-card__description  the repository's description
//   .dcp-github-card__stats        stars and forks, left out when GitHub
//                                  could not be reached
// The card is a flex column (card.ts) filling its cell, so in a row of
// <Columns> every card's stats sit on the same line at the bottom, however
// long each description is. Without counts (GitHub unreachable) nothing is
// pushed down and no gap is left.
const css = `.dcp-github-card {
  box-sizing: border-box;
  min-width: 0;
  height: 100%;
}

.dcp-github-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--color-dark);
}

.dcp-github-card__mark {
  flex-shrink: 0;
}

.dcp-github-card__name {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dcp-github-card__description {
  display: block;
  color: var(--color-grayDark);
}

.dcp-github-card__stats {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  line-height: 20px;
  color: var(--color-text-muted);
}

.dcp-github-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* svg.lucide outranks the article's own icon color (.dcp-docs .lucide). */
.dcp-github-card__stat svg.lucide {
  width: 14px;
  height: 14px;
  margin: 0;
  color: inherit;
}`;

export const githubCardStyles: DesignStyles = { classic: css, modern: css };
