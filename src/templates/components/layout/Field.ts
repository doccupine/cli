export const fieldTemplate = `"use client";
import styled from "styled-components";
import { styledSmall, Theme } from "cherry-styled-components/src/lib";
import { rgba } from "polished";

const StyledField = styled.div<{ theme: Theme; $columns?: number }>\`
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  padding: 0 0 20px 0;
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
  background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.2)};
  color: \${({ theme }) => theme.colors.dark};
  padding: 0 4px;
  font-family: \${({ theme }) => theme.fonts.mono};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
\`;

const StyledFieldRequired = styled.span<{ theme: Theme }>\`
  background: \${({ theme }) => rgba(theme.colors.error, 0.2)};
  color: \${({ theme }) => theme.colors.error};
  padding: 0 4px;
  font-family: \${({ theme }) => theme.fonts.mono};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
\`;

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
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

export { Field };`;
