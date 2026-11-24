// Page geometry of the generated site, in one module per design. Every chrome
// file (content column, navigation rail, table of contents, side panel, pager,
// footer, header offsets) reads these instead of hard-coding pixel values, so
// a design can change the frame by shipping its own copy of this file. Values
// are unitless pixel numbers, interpolated into the styled-components CSS.
export const designTokensTemplate = `// Page geometry of this design, in pixels. The chrome components (content
// column, navigation rail, table of contents, side panel, pager, footer) read
// these instead of hard-coding sizes.

/** Width of the left navigation rail from "lg" up. */
export const SIDEBAR_WIDTH = 280;

/** Width of the right rail: the table of contents, or a side panel below "xl". */
export const TOC_WIDTH = 280;

/** Width of the chat panel, and of a side panel from "xl" up. */
export const CHAT_WIDTH = 420;

/** Space between a rail and the content column, and the column's own side
    padding on small screens. */
export const COLUMN_GUTTER = 20;

/** Maximum width of the content column (article, pager, footer, links). */
export const CONTENT_WIDTH = 640;

/** Height of the header below "lg", where the sidebar opens under it, without
    and with the section bar. */
export const HEADER_HEIGHT = 62;
export const HEADER_HEIGHT_WITH_SECTIONS = 104;

/** Top padding of the fixed rails, clearing the header. */
export const RAIL_TOP_OFFSET = 82;

/** scroll-padding-top of the page, so anchor targets land below the header. */
export const SCROLL_PADDING_TOP = 80;
`;
