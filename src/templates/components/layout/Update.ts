export const updateTemplate = `"use client";
import styled from "styled-components";
import { mq, styledSmall, Theme } from "cherry-styled-components";
import { rgba } from "polished";

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

const StyledUpdateLabel = styled.span<{ theme: Theme }>\`
  background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.2)};
  color: \${({ theme }) => theme.colors.primary};
  padding: 2px 4px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  font-weight: 600;
  \${({ theme }) => styledSmall(theme)};
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

export interface UpdateProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label: string;
  description: string;
}

function Update({ children, label, description }: UpdateProps) {
  return (
    <StyledUpdate>
      <StyledUpdateSidebar>
        <div>
          <StyledUpdateLabel>{label}</StyledUpdateLabel>
        </div>
        <StyledUpdateDescription>{description}</StyledUpdateDescription>
      </StyledUpdateSidebar>
      <StyledUpdateChildren>{children}</StyledUpdateChildren>
    </StyledUpdate>
  );
}

export { Update };
`;
