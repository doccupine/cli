export const calloutTemplate = `import { Icon, IconProps } from "@/components/layout/Icon";

export type CalloutType = "note" | "info" | "warning" | "danger" | "success";

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  icon?: IconProps;
  type?: CalloutType;
}

function Callout({ children, type, icon }: CalloutProps) {
  const iconType =
    type === "note"
      ? "CircleAlert"
      : type === "info"
        ? "Info"
        : type === "warning"
          ? "TriangleAlert"
          : type === "danger"
            ? "OctagonAlert"
            : type === "success"
              ? "Check"
              : (icon as IconProps);
  return (
    <div className="dcp-callout" data-type={type}>
      {iconType ? <Icon name={iconType} size={16} /> : null}
      <span className="dcp-callout__body">{children}</span>
    </div>
  );
}

export { Callout };
`;
