export const updateTemplate = `"use client";
import styled from "styled-components";
import { styledSmall } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import { slugify } from "@/components/layout/Slug";

const StyledUpdate = styled.div<{ theme: Theme; $columns?: number }>\`
  position: relative;
  display: flex;
  gap: 20px;
  flex-direction: column;

  \${mq("lg")} {
    margin: 20px 0;
    flex-direction: row;
  }
\`;

const StyledUpdateLabel = styled.a<{ theme: Theme }>\`
  display: inline-block;
  width: fit-content;
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
  color: \${({ theme }) => theme.colors.primary};
  padding: 2px 4px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  font-weight: 600;
  text-decoration: none;
  \${({ theme }) => styledSmall(theme)};

  &:hover {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 35%, transparent)\`};
  }
\`;

const StyledUpdateDescription = styled.div<{ theme: Theme }>\`
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme }) => theme.colors.gray};
\`;

const StyledUpdateSidebar = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 10px;

  \${mq("lg")} {
    min-width: 160px;
  }
\`;

const StyledUpdateChildren = styled.div\`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
\`;

interface UpdateProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label: string;
  description: string;
}

function Update({ children, label, description, id }: UpdateProps) {
  // MDXComponents injects a de-duplicated id from the shared slugger so the
  // index sidebar anchor resolves here; fall back to a plain slug when used
  // outside the MDX pipeline. The label doubles as an anchor so readers can
  // right-click to copy the deep link (native #anchor jump is offset by the
  // global scroll-padding-top).
  const anchor = id ?? slugify(label);
  return (
    <StyledUpdate id={anchor}>
      <StyledUpdateSidebar>
        <div>
          <StyledUpdateLabel href={\`#\${anchor}\`}>{label}</StyledUpdateLabel>
        </div>
        <StyledUpdateDescription>{description}</StyledUpdateDescription>
      </StyledUpdateSidebar>
      <StyledUpdateChildren>{children}</StyledUpdateChildren>
    </StyledUpdate>
  );
}

export { Update };
`;
