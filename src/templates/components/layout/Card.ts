export const cardTemplate = `import Link from "next/link";
import { Icon, IconProps } from "@/components/layout/Icon";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  icon?: IconProps;
  href?: string;
}

function Card({ children, title, icon, href }: CardProps) {
  const content = (
    <>
      {icon && <Icon name={icon} />}
      {title && <p className="dcp-card__title">{title}</p>}
      {children}
    </>
  );

  if (href) {
    const isExternal = /^(https?:)?\\/\\//i.test(href);
    return (
      <Link
        className="dcp-card"
        data-link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {content}
      </Link>
    );
  }

  return <div className="dcp-card">{content}</div>;
}

export { Card };
`;
