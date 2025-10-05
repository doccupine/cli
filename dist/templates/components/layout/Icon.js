export const iconTemplate = `import { icons } from "lucide-react";

export type IconProps = keyof typeof icons;

interface Props {
  name: IconProps;
  color?: string;
  size?: number;
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

  return <LucideIcon color={color} size={size} className={className} />;
};

export { Icon };
`;
