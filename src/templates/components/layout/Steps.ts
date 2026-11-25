export const stepsTemplate = `import React from "react";
import { Icon, IconProps } from "@/components/layout/Icon";

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
  const steps = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<StepProps> =>
      React.isValidElement(child),
  );

  return (
    <div className="dcp-steps">
      {steps.map((step, index) => {
        const { title, children: stepContent, icon } = step.props;

        return (
          <div key={index} className="dcp-steps__step">
            <div className="dcp-steps__number">{index + 1}</div>
            {(title || icon) && (
              <div className="dcp-steps__title">
                {icon && <Icon name={icon} />}
                {title}
              </div>
            )}
            <div className="dcp-steps__content">{stepContent}</div>
          </div>
        );
      })}
    </div>
  );
}

export { Steps, Step };
`;
