import type { DesignStyles } from "./index.js";

// The "On this page" rail (components/DocsSideBar.tsx). The scroll-spy and
// smooth scrolling stay in the component.
//
//   .dcp-toc           the fixed right rail (<ul>), hidden below "lg"; in
//                      focus mode it slides out to the right
//   .dcp-toc__label    the "On this page" label
//   .dcp-toc__space    the gap under the label
//   .dcp-toc__item     an entry (<li>), data-active on the current heading
//   .dcp-toc__link     the entry's link, data-active on the current heading
export const tocStyles: DesignStyles = {
  shared: `/* The table of contents' nav landmark: no box of its own, so the list lays
   out exactly as without it. */
.dcp-toc-nav {
  display: contents;
}

.dcp-toc {
  display: none;
  list-style: none;
  margin: 0;
  position: fixed;
  top: 0;
  right: 0;
  width: var(--layout-toc-width);
  height: 100dvh;
  overflow-y: auto;
  z-index: 1;
  -webkit-overflow-scrolling: touch;
}

.dcp-toc::-webkit-scrollbar {
  display: none;
}

@media screen and (min-width: 992px) {
  .dcp-toc {
    display: block;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }

  html[data-focus-mode] .dcp-toc {
    transform: translateX(100%);
    opacity: 0;
    pointer-events: none;
  }

  html[data-focus-mode] .dcp-toc {
    visibility: hidden;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease,
      visibility 0s linear 0.3s;
  }
}

.dcp-toc__space {
  display: block;
  min-height: 15px;
  max-height: 15px;
}

.dcp-toc__item::before {
  content: "";
  display: block;
  position: absolute;
}`,
  classic: `.dcp-toc {
  padding: var(--layout-rail-top) 20px 20px 20px;
  background: var(--color-light);
  border-left: solid 1px var(--color-grayLight);
}

.dcp-toc li {
  padding: 5px 0;
}

.dcp-toc__label {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-grayDark);
}

@media screen and (min-width: 992px) {
  .dcp-toc__label {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-toc__item::before {
  left: 0;
  height: 20px;
  width: 1px;
  background: transparent;
  transition: all 0.3s ease;
}

.dcp-toc__item[data-active]::before {
  background: var(--color-primary);
}

.dcp-toc__link {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-dark);
  font-weight: 400;
  text-decoration: none;
  transition: all 0.3s ease;
}

.dcp-toc__link[data-active] {
  color: var(--color-primary);
  font-weight: 600;
}

@media screen and (min-width: 992px) {
  .dcp-toc__link {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-toc__link:hover {
  color: var(--color-primary);
}`,
  modern: `.dcp-toc {
  padding: var(--layout-rail-top) 24px 24px 12px;
  background: transparent;
}

.dcp-toc li {
  position: relative;
  padding: 4px 0;
}

.dcp-toc__label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--color-dark);
}

/* Lucide's "text-align-start" glyph, drawn through a mask so it takes the
   label's color in both modes. */
.dcp-toc__label::before {
  content: "";
  width: 13px;
  height: 13px;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 5H3'/%3E%3Cpath d='M15 12H3'/%3E%3Cpath d='M17 19H3'/%3E%3C/svg%3E")
    center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 5H3'/%3E%3Cpath d='M15 12H3'/%3E%3Cpath d='M17 19H3'/%3E%3C/svg%3E")
    center / contain no-repeat;
}

/* The active dot, centered under the label icon and on the entry's first
   line. */
.dcp-toc__item::before {
  left: 4px;
  top: 13.5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: transparent;
  transition: background-color 0.2s ease;
}

.dcp-toc__item[data-active]::before {
  background: var(--color-accent);
}

.dcp-toc__link {
  display: block;
  margin-left: 20px;
  font-size: 14px;
  line-height: 24px;
  color: var(--color-grayDark);
  font-weight: 400;
  text-decoration: none;
  transition: color 0.2s ease;
}

.dcp-toc__link:hover {
  color: var(--color-dark);
}

.dcp-toc__link[data-active],
.dcp-toc__link[data-active]:hover {
  color: var(--color-accent);
  font-weight: 500;
}`,
};
