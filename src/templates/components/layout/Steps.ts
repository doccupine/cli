export const stepsTemplate = `"use client";
import React from "react";
import styled, { useTheme } from "styled-components";
import { styledText, Theme } from "cherry-styled-components";
import { rgba } from "polished";
import { Icon, IconProps } from "@/components/layout/Icon";

const StyledStepsContainer = styled.div<{ theme: Theme }>\`
  position: relative;
  width: 100%;
\`;

const StyledStep = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => theme.colors.light};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 0 0 20px 52px;
  margin: 0;
  position: relative;
  \${({ theme }) => styledText(theme)}
  color: \${({ theme }) => theme.colors.grayDark};

  &::after {
    content: "";
    position: absolute;
    left: 16px;
    top: 0;
    width: 1px;
    height: 100%;
    background: \${({ theme }) => theme.colors.primary};
    background: linear-gradient(
      180deg,
      \${({ theme }) => theme.colors.primary},
      \${({ theme }) => rgba(theme.colors.primary, 0)}
    );
    border-radius: 4px;
  }
\`;

const StepNumber = styled.div<{ theme: Theme }>\`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: \${({ theme }) => theme.colors.primary};
  color: \${({ theme }) => theme.colors.light};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 12px;
  \${({ theme }) => styledText(theme)};
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
\`;

const StyledStepTitle = styled.h3<{ theme: Theme }>\`
  margin: 0 0 10px 0;
  padding: 2px 0 0 0;
  color: \${({ theme }) => theme.colors.dark};
  \${({ theme }) => styledText(theme)};
  display: flex;
  align-items: center;
  gap: 10px;
\`;

const StepContent = styled.div<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.grayDark};
  \${({ theme }) => styledText(theme)};

  & > .code-wrapper {
    margin: 10px 0;
  }
\`;

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
  icon?: IconProps;
}

function Step(_props: StepProps) {
  return null;
}

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Steps({ children }: StepsProps) {
  const theme = useTheme() as Theme;

  const steps = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<StepProps> =>
      React.isValidElement(child),
  );

  return (
    <StyledStepsContainer theme={theme}>
      {steps.map((step, index) => {
        const { title, children: stepContent, icon } = step.props;

        return (
          <StyledStep key={index} theme={theme}>
            <StepNumber theme={theme}>{index + 1}</StepNumber>
            <StyledStepTitle theme={theme}>
              {icon && <Icon name={icon} color={theme.colors.primary} />}
              {title}
            </StyledStepTitle>
            <StepContent theme={theme}>{stepContent}</StepContent>
          </StyledStep>
        );
      })}
    </StyledStepsContainer>
  );
}

export { Steps, Step };
`;
