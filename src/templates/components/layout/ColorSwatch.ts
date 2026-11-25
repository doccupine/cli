export const colorSwatchTemplate = `function luminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((c) => parseInt(c, 16) / 255);

  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

interface ColorSwatchProps {
  token: string;
  value: string;
}

function ColorSwatch({ token, value }: ColorSwatchProps) {
  // White or black label, whichever contrasts more with the color (WCAG
  // ratio): the better of the two is at least 4.58:1 on any opaque color.
  const lum = luminance(value);
  const useLightText = 1.05 / (lum + 0.05) >= (lum + 0.05) / 0.05;

  return (
    <div className="dcp-swatch">
      <div
        className="dcp-swatch__color"
        data-light-text={useLightText || undefined}
        style={{ "--dcp-swatch-color": value } as React.CSSProperties}
      >
        {value}
      </div>
      <div className="dcp-swatch__label">
        <code className="token">{token}</code>
      </div>
    </div>
  );
}

interface ColorSwatchGroupProps {
  children: React.ReactNode;
  cols?: number | string;
}

// The widest grid a group can ask for; more columns than this leaves the
// swatches too narrow for their hex value in the article column.
const MAX_SWATCH_COLUMNS = 6;

function ColorSwatchGroup({ children, cols }: ColorSwatchGroupProps) {
  // cols arrives as a number (cols={4}) or a string (cols="4"); anything
  // that is not a whole number from 1 up keeps the default grid.
  const count = Number(cols);
  const columns =
    Number.isInteger(count) && count >= 1
      ? Math.min(count, MAX_SWATCH_COLUMNS)
      : undefined;

  return (
    <div
      className="dcp-swatch-group"
      style={
        columns
          ? ({
              "--dcp-swatch-columns-sm": Math.min(columns, 2),
              "--dcp-swatch-columns-md": Math.min(columns, 3),
              "--dcp-swatch-columns-lg": columns,
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}

export { ColorSwatch, ColorSwatchGroup };
`;
