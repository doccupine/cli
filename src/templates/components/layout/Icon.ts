export const iconTemplate = `import { icons } from "lucide-react";

export type IconProps = keyof typeof icons;

interface Props {
  name: string | IconProps;
  color?: string;
  size?: string | number;
  className?: string;
}

function transformIconName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

const Icon = ({ name, color, size, className }: Props) => {
  const IconName = transformIconName(name as string);
  const LucideIcon = icons[IconName as keyof typeof icons];
  if (!LucideIcon) return null;

  const numericSize = size != null ? Number(size) : undefined;

  return <LucideIcon color={color} size={numericSize} className={className} />;
};

export { Icon };
`;
