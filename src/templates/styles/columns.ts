import type { DesignStyles } from "./index.js";

// <Columns cols={n}> (components/layout/Columns.tsx): one column on small
// screens, two from "lg" when three or more are asked for (data-wide), and
// the requested count (--dcp-columns) from "xl".
export const columnsStyles: DesignStyles = {
  shared: `.dcp-columns {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media screen and (min-width: 992px) {
  .dcp-columns:where([data-wide]) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (min-width: 1200px) {
  .dcp-columns {
    display: grid;
    grid-template-columns: repeat(var(--dcp-columns, 1), 1fr);
  }
}`,
};
