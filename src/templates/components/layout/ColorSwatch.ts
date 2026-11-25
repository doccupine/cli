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
  const useLightText = luminance(value) < 0.4;

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
}

function ColorSwatchGroup({ children }: ColorSwatchGroupProps) {
  return <div className="dcp-swatch-group">{children}</div>;
}

export { ColorSwatch, ColorSwatchGroup };
`;
