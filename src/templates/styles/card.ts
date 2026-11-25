import type { DesignStyles } from "./index.js";

// <Card> (components/layout/Card.tsx), plain or linked.
//
//   .dcp-card             the card; a linked card is an <a> with data-link
//   .dcp-card__title      the title line
//
// The leading icon is tinted here rather than through lucide's color prop,
// because that becomes an SVG presentation attribute and CSS custom
// properties do not resolve in those.
export const cardStyles: DesignStyles = {
  classic: `.dcp-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  padding: 20px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-grayDark);
}

@media screen and (min-width: 992px) {
  .dcp-card {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-card > svg.lucide {
  color: var(--color-primary);
}

/* A linked card answers hover and focus like the other interactive
   surfaces (dcp-interactive), stated here so it wins over the card's own
   border. */
.dcp-card:where([data-link]) {
  transition: all 0.3s ease;
  box-shadow: 0 0 0 0px var(--color-primary);
  text-decoration: none;
}

.dcp-card:where([data-link]):hover {
  border-color: var(--color-primary);
}

.dcp-card:where([data-link]):focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primaryLight);
}

.dcp-card:where([data-link]):active {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* The site-wide link focus ring (base.css) rounds a focused link to 6px; it
   used to win over the card's own radius, so the card keeps that look. */
.dcp-card:where([data-link]):focus-visible {
  border-radius: 6px;
}

.dcp-card__title {
  font-weight: bold;
  margin: 0;
  color: var(--color-dark);
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-card__title {
    font-size: 16px;
    line-height: 1.7;
  }
}`,
  modern: `/* Hairline cards with a generous radius. Linked cards answer hover with a
   soft fill and a firmer border. */
.dcp-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  border: solid 1px var(--color-grayLight);
  border-radius: 16px;
  padding: 20px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-grayDark);
}

.dcp-card > svg.lucide {
  width: 20px;
  height: 20px;
  margin-bottom: 4px;
  color: var(--color-accent);
}

/* Doubled to outrank the article's own paragraph color. */
.dcp-card.dcp-card p {
  color: var(--color-grayDark);
}

.dcp-card:where([data-link]) {
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.dcp-card:where([data-link]):hover {
  border-color: var(--color-gray);
  background: color-mix(in srgb, var(--color-dark) 3%, transparent);
}

.dcp-card:where([data-link]):focus-visible {
  outline: none;
  /* The site-wide link focus ring (base.css) rounds a focused link to 6px;
     it used to win over the card's own radius, so the card keeps that look. */
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-card__title {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 600;
}

/* Outranks the card's own paragraph rule above. */
.dcp-card.dcp-card .dcp-card__title {
  color: var(--color-dark);
}`,
};
