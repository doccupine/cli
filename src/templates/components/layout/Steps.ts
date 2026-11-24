export const stepsTemplate = `"use client";
import React from "react";
import { useTheme } from "styled-components";
import { Theme } from "@/app/theme";
import { Icon, IconProps } from "@/components/layout/Icon";
import {
  StyledStepsContainer,
  StyledStep,
  StepNumber,
  StyledStepTitle,
  StepContent,
} from "@/components/layout/Steps.styles";

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
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
            {(title || icon) && (
              <StyledStepTitle theme={theme}>
                {icon && <Icon name={icon} />}
                {title}
              </StyledStepTitle>
            )}
            <StepContent theme={theme}>{stepContent}</StepContent>
          </StyledStep>
        );
      })}
    </StyledStepsContainer>
  );
}

export { Steps, Step };
`;
