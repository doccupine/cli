import { describe, expect, it } from "vitest";
import { colorSwatchTemplate } from "./components/layout/ColorSwatch.js";
import { colorSwatchStyles } from "./styles/color-swatch.js";
import { colorSwatchesMdxTemplate } from "./mdx/color-swatches.mdx.js";

describe("ColorSwatchGroup cols", () => {
  it("accepts a cols prop, capped at six columns", () => {
    expect(colorSwatchTemplate).toContain("cols?: number | string;");
    expect(colorSwatchTemplate).toContain("const MAX_SWATCH_COLUMNS = 6;");
    expect(colorSwatchTemplate).toContain(
      "Number.isInteger(count) && count >= 1",
    );
  });

  it("caps the count at two and three columns on smaller screens", () => {
    expect(colorSwatchTemplate).toContain(
      '"--dcp-swatch-columns-sm": Math.min(columns, 2),',
    );
    expect(colorSwatchTemplate).toContain(
      '"--dcp-swatch-columns-md": Math.min(columns, 3),',
    );
    expect(colorSwatchTemplate).toContain(
      '"--dcp-swatch-columns-lg": columns,',
    );
  });

  it("keeps the default grid when cols is not set, in both designs", () => {
    for (const css of [colorSwatchStyles.classic, colorSwatchStyles.modern]) {
      expect(css).toContain("repeat(var(--dcp-swatch-columns-sm, 2), 1fr)");
      expect(css).toContain("repeat(var(--dcp-swatch-columns-md, 3), 1fr)");
      expect(css).toContain("repeat(var(--dcp-swatch-columns-lg, 3), 1fr)");
    }
  });

  it("documents the prop on the starter page", () => {
    expect(colorSwatchesMdxTemplate).toContain("<ColorSwatchGroup cols={4}>");
    expect(colorSwatchesMdxTemplate).toContain(
      '<Field value="cols" type="number">',
    );
  });
});
