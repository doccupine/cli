export const iconTemplate = `import type { LucideIcon } from "lucide-react";

import { iconRegistry } from "@/components/layout/IconRegistry";

/**
 * A Lucide icon name: the kebab-case id ("arrow-right") or the PascalCase
 * export name ("ArrowRight"). Names resolve through IconRegistry.ts, which
 * Doccupine generates from the names used across the site, so the app bundles
 * only those glyphs. An unknown name renders nothing.
 */
export type IconProps = string;

interface Props {
  name: IconProps;
  color?: string;
  size?: string | number;
  className?: string;
}

// Lucide derives every PascalCase export from its kebab-case id by capitalising
// each segment ("arrow-down-a-z" -> "ArrowDownAZ"); the registry is keyed by
// that export name, so both spellings resolve to the same entry.
function toRegistryKey(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

const Icon = ({ name, color, size, className }: Props) => {
  if (!name) return null;
  const Glyph: LucideIcon | undefined = iconRegistry[toRegistryKey(name)];
  if (!Glyph) return null;

  const numericSize = size != null ? Number(size) : undefined;

  return <Glyph color={color} size={numericSize} className={className} />;
};

export { Icon };
`;
