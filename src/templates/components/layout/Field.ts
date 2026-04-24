export const fieldTemplate = `"use client";
import styled from "styled-components";
import { styledSmall, Theme } from "cherry-styled-components";

const StyledField = styled.div<{ theme: Theme; $columns?: number }>\`
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  padding: 0 0 20px 0;
  color: \${({ theme }) => theme.colors.grayDark};
\`;

const StyledFieldFlex = styled.div<{ theme: Theme }>\`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  \${({ theme }) => styledSmall(theme)};
  padding: 0 0 15px 0;
\`;

const StyledFieldValue = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.primary};
  font-family: \${({ theme }) => theme.fonts.mono};
  font-weight: 600;
\`;

const StyledFieldType = styled.span<{ theme: Theme }>\`
  background: \${({ theme }) => \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
  color: \${({ theme }) => theme.colors.dark};
  padding: 0 4px;
  font-family: \${({ theme }) => theme.fonts.mono};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
\`;

const StyledFieldRequired = styled.span<{ theme: Theme }>\`
  background: \${({ theme }) => \`color-mix(in srgb, \${theme.colors.error} 20%, transparent)\`};
  color: \${({ theme }) => theme.colors.error};
  padding: 0 4px;
  font-family: \${({ theme }) => theme.fonts.mono};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
\`;

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value: string;
  type: string;
  required?: boolean;
}

function Field({ children, value, type, required }: FieldProps) {
  return (
    <StyledField>
      <StyledFieldFlex>
        <StyledFieldValue>{value}</StyledFieldValue>
        <StyledFieldType>{type}</StyledFieldType>
        {required && <StyledFieldRequired>required</StyledFieldRequired>}
      </StyledFieldFlex>
      {children}
    </StyledField>
  );
}

export { Field };
`;
