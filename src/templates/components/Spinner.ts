export const spinnerTemplate = `"use client";

import styled, { keyframes } from "styled-components";
import { LoaderCircle } from "lucide-react";

const spin = keyframes\`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
\`;

const SpinnerWrapper = styled.span<{ $size?: number }>\`
  display: inline-flex;
  animation: \${spin} 1s linear infinite;
  color: inherit;
\`;

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <SpinnerWrapper $size={size} className={className}>
      <LoaderCircle size={size} />
    </SpinnerWrapper>
  );
}
`;
