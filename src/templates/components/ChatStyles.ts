import { CHAT_WIDTH } from "../app/theme.js";

export const chatStylesTemplate = `import styled, { css, keyframes } from "styled-components";
import { Button } from "cherry-styled-components";
import Link from "next/link";
import { mq, Theme } from "@/app/theme";
import {
  styledAnchor,
  styledTable,
  stylesLists,
  StyledSmallButton,
  interactiveStyles,
  thinScrollbar,
} from "@/components/layout/SharedStyled";

const styledText = css<{ theme: Theme }>\`
  font-size: \${({ theme }) => theme.fontSizes.text.xs};
  line-height: \${({ theme }) => theme.lineHeights.text.xs};

  \${mq("lg")} {
    font-size: \${({ theme }) => theme.fontSizes.small.lg};
    line-height: \${({ theme }) => theme.lineHeights.small.lg};
  }
\`;

export const StyledChatSurface = styled.div<{ $isVisible: boolean }>\`
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }

  \${({ $isVisible }) =>
    !$isVisible &&
    css\`
      visibility: hidden;

      & > * {
        pointer-events: none;
      }
    \`}
\`;

export const StyledChat = styled.div<{ theme: Theme; $isVisible: boolean }>\`
  margin: 0;
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: calc(100dvh - 90px);
  overflow-y: scroll;
  overflow-x: hidden;
  z-index: 1000;
  padding: 0 20px;
  /* See StyledChatForm: visibility snaps open and is delayed on close, so the
     panel is focusable as soon as it opens. */
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    visibility 0s linear 0s;
  transform: translateX(0);
  background: \${({ theme }) => theme.colors.light};
  -webkit-overflow-scrolling: touch;
  opacity: 1;
  visibility: visible;

  &::-webkit-scrollbar {
    display: none;
  }

  \${({ $isVisible }) =>
    !$isVisible &&
    css\`
      transform: translateX(100%);
      opacity: 0;
      visibility: hidden;
      transition-delay: 0s, 0s, 0.3s;
    \`}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  \${mq("lg")} {
    width: ${CHAT_WIDTH}px;
    border-left: solid 1px \${({ theme }) => theme.colors.grayLight};
  }
\`;

const loadingAnimation = keyframes\`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
\`;

const rotateGradient = keyframes\`
  0% {
    --gradient-angle: 0deg;
  }
  100% {
    --gradient-angle: 360deg;
  }
\`;

const pulseGlow = keyframes\`
  0%, 100% {
    opacity: 0.5;
    filter: blur(16px);
  }
  50% {
    opacity: 1;
    filter: blur(22px);
  }
\`;

const sparkleFloat = keyframes\`
  0%, 100% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  50% {
    opacity: 0.9;
    transform: translateY(-20px) scale(1);
  }
\`;

const shimmer = keyframes\`
  0% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
  100% {
    background-position: 0% center;
  }
\`;

export const StyledRainbowInputWrapper = styled.div<{
  theme: Theme;
  $isActive: boolean;
}>\`
  @property --gradient-angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  position: relative;
  flex: 1;

  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 14px;
    background: conic-gradient(
      from var(--gradient-angle),
      #cc5555,
      #d9a745,
      #3ab0cc,
      #cc7fc2,
      #4380cc,
      #4c1fa3,
      #cc5555
    );
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation: \${rotateGradient} 3s linear infinite;
    z-index: 0;
  }

  &::after {
    content: "";
    position: absolute;
    inset: -10px;
    border-radius: 20px;
    background: conic-gradient(
      from var(--gradient-angle),
      #ff6b6b66,
      #feca5766,
      #48dbfb66,
      #ff9ff366,
      #54a0ff66,
      #5f27cd66,
      #ff6b6b66
    );
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation:
      \${rotateGradient} 3s linear infinite,
      \${pulseGlow} 2s ease-in-out infinite;
    z-index: -1;
    pointer-events: none;
  }

  &:hover::before,
  &:focus-within::before {
    opacity: 1;
  }

  &:hover::after,
  &:focus-within::after {
    opacity: 1;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      &::before {
        opacity: 1;
      }
      &::after {
        opacity: 1;
      }
    \`}
\`;

export const StyledSparkleContainer = styled.div<{ $isActive: boolean }>\`
  position: absolute;
  inset: -30px;
  pointer-events: none;
  overflow: hidden;
  border-radius: 30px;
  z-index: -2;
  opacity: 0;
  transition: opacity 0.4s ease;

  \${({ $isActive }) =>
    $isActive &&
    css\`
      opacity: 1;
    \`}
\`;

export const StyledSparkle = styled.div<{
  $color: string;
  $left: number;
  $top: number;
  $delay: number;
}>\`
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: \${({ $color }) => $color};
  box-shadow: 0 0 6px \${({ $color }) => $color};
  left: \${({ $left }) => $left}%;
  top: \${({ $top }) => $top}%;
  animation: \${sparkleFloat} 2s ease-in-out infinite;
  animation-delay: \${({ $delay }) => $delay}s;
\`;

export const StyledRainbowInput = styled.input<{ theme: Theme }>\`
  position: relative;
  z-index: 1;
  width: 100%;
  background: \${({ theme }) => theme.colors.light};
  border: 1px solid \${({ theme }) => theme.colors.grayLight};
  border-radius: 12px;
  padding: 12px 18px;
  font-size: \${({ theme }) => theme.fontSizes.text.lg};
  font-family: inherit;
  color: \${({ theme }) => theme.colors.dark};
  outline: none;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;

  \${mq("lg")} {
    font-size: \${({ theme }) => theme.fontSizes.small.lg};
  }

  &::placeholder {
    color: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 40%, transparent)\`};
    transition: color 0.3s ease;
  }

  &:focus::placeholder {
    color: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 60%, transparent)\`};
  }

  &:focus {
    border-color: transparent;
  }
\`;

export const StyledRainbowButton = styled(Button)<{
  theme: Theme;
  $hasContent: boolean;
}>\`
  padding-top: 10px;
  padding-bottom: 10px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  color: \${({ theme }) => theme.colors.surface};

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      #ff6b6b,
      #feca57,
      #48dbfb,
      #ff9ff3,
      #54a0ff
    );
    background-size: 300% 300%;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
    animation: \${shimmer} 3s linear infinite;
    width: 200%;
  }

  \${({ $hasContent }) =>
    $hasContent &&
    css\`
      &::before {
        opacity: 1;
      }
    \`}

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  & svg {
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
  }

  &:disabled,
  &:disabled:hover {
    background: \${({ theme }) => theme.colors.primaryDark};
    transform: none;
    box-shadow: none;

    &::before {
      opacity: 0;
    }
  }
\`;

export const StyledChatForm = styled.form<{
  theme: Theme;
  $isVisible: boolean;
}>\`
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  background: \${({ theme }) => theme.colors.light};
  padding: 20px;
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  border-top: solid 1px \${({ theme }) => theme.colors.grayLight};
  /* visibility is animatable, so transitioning "all" keeps this hidden for the
     whole slide-in - long enough for the focus() that follows opening to be a
     silent no-op. Snap it on open (transition-delay below) and delay it on
     close so the slide-out stays visible while it animates. */
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    visibility 0s linear 0.3s;
  transform: translateX(100%);
  opacity: 0;
  visibility: hidden;

  \${mq("lg")} {
    width: ${CHAT_WIDTH}px;
    border-left: solid 1px \${({ theme }) => theme.colors.grayLight};
  }

  \${({ $isVisible }) =>
    $isVisible &&
    css\`
      opacity: 1;
      transform: translateX(0);
      visibility: visible;
      transition-delay: 0s;
    \`}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  & .loading {
    animation: \${loadingAnimation} 1s linear infinite;
  }
\`;

export const StyledGlowSmallButton = styled(StyledSmallButton)<{
  theme: Theme;
  $hasContent: boolean;
}>\`
  @property --gradient-angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  position: relative;
  isolation: isolate;
  margin-right: 0;
  background: \${({ theme }) => theme.colors.light};
  padding: 0;

  &::before {
    content: "";
    inset: -2px;
    border-radius: 8px;
    background: conic-gradient(
      from var(--gradient-angle),
      #cc5555,
      #d9a745,
      #3ab0cc,
      #cc7fc2,
      #4380cc,
      #4c1fa3,
      #cc5555
    );
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation: \${rotateGradient} 3s linear infinite;
    z-index: -1;
    position: absolute;
    top: -2px;
    left: -2px;
    width: calc(100% + 4px);
    height: calc(100% + 4px);
  }

  &::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: 14px;
    background: conic-gradient(
      from var(--gradient-angle),
      #ff6b6b66,
      #feca5766,
      #48dbfb66,
      #ff9ff366,
      #54a0ff66,
      #5f27cd66,
      #ff6b6b66
    );
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation:
      \${rotateGradient} 3s linear infinite,
      \${pulseGlow} 2s ease-in-out infinite;
    z-index: -2;
    pointer-events: none;
  }

  &:hover::before,
  &:hover::after {
    opacity: 1;
  }

  & span {
    padding: 6px 8px;
    display: flex;
    background: \${({ theme }) => theme.colors.light};
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    gap: 6px;
  }

  \${({ $hasContent }) =>
    $hasContent &&
    css\`
      &::before {
        opacity: 1;
      }
      &::after {
        opacity: 1;
      }
    \`}
\`;

export const StyledError = styled.div\`
  margin: 20px 0;
  width: 100%;
\`;

const loadingDotAnimation = keyframes\`
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
\`;

export const StyledLoading = styled.div<{ theme: Theme }>\`
  overflow-x: auto;
  \${thinScrollbar};
  margin: 20px 0;
  width: 100%;
  font-weight: 600;
  \${styledText};
  color: \${({ theme }) => theme.colors.dark};

  & span {
    &:nth-child(1) {
      animation: \${loadingDotAnimation} 1s ease infinite;
    }
    &:nth-child(2) {
      animation: \${loadingDotAnimation} 1s ease infinite;
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation: \${loadingDotAnimation} 1s ease infinite;
      animation-delay: 0.4s;
    }
  }
\`;

export const StyledAnswer = styled.div<{ theme: Theme; $isAnswer: boolean }>\`
  overflow-x: auto;
  \${thinScrollbar};
  background: \${({ theme }) => theme.colors.primary};
  color: \${({ theme }) => theme.colors.surface};
  padding: 9px 14px;
  border-radius: 16px 16px 4px 16px;
  margin: 20px 0 20px auto;
  width: fit-content;
  max-width: min(560px, 88%);
  font-weight: 500;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  \${styledText};

  & p {
    \${styledText};
  }

  \${({ $isAnswer }) =>
    $isAnswer &&
    css\`
      background: transparent;
      color: \${({ theme }) => theme.colors.dark};
      padding: 0;
      width: 100%;
      max-width: 100%;
      margin: 20px 0;
      border-radius: 0;
      font-weight: inherit;
      white-space: normal;
    \`}

  & code:not([class]) {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
    color: \${({ theme }) => theme.colors.dark};
    padding: 2px 4px;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    white-space: pre;
  }

  \${styledAnchor};
  \${stylesLists};
  \${styledTable};

  & pre,
  & .hljs {
    margin: 10px 0;
  }

  & .code-wrapper pre {
    margin: 0;
    \${styledText};
  }

  & > *:first-child {
    margin-top: 0;
  }

  & > *:last-child {
    margin-bottom: 0;

    & > *:last-child {
      margin-bottom: 0;
    }
  }

  & ul,
  & ol {
    & li {
      \${styledText};
    }
  }

  & img,
  & video,
  & iframe {
    max-width: 100%;
    border-radius: \${({ theme }) => theme.spacing.radius.lg};
    margin: 10px 0;
    display: block;
  }

  & h1,
  & h2,
  & h3,
  & h4,
  & h5,
  & h6 {
    margin: 10px 0;
    padding: 0;
  }
\`;

export const StyledSources = styled.div\`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: -5px 0 20px;
\`;

export const StyledSourceLink = styled(Link)<{ theme: Theme }>\`
  position: relative;
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1;
  color: \${({ theme }) => theme.colors.primary};
  display: flex;
  gap: 6px;
  transition: all 0.3s ease;
  font-weight: 600;
  white-space: nowrap;
  min-width: fit-content;
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 10%, transparent)\`};
  padding: 6px 8px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  \${interactiveStyles};

  & * {
    margin: auto 0;
  }

  &:hover {
    color: \${({ theme }) => theme.colors.accent};
  }
\`;

export const StyledChatTitle = styled.div<{ theme: Theme }>\`
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  position: sticky;
  margin: 0 -20px;
  padding: 16px 20px;
  height: 62px;
  top: 0;
  background: \${({ theme }) => theme.colors.light};
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  z-index: 1000;
\`;

export const StyledChatTitleIconWrapper = styled.span<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  gap: 12px;
  color: \${({ theme }) => theme.colors.dark};
\`;
`;
