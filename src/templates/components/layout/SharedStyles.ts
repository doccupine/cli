export const sharedStyledTemplate = `"use client";
import {
  mq,
  resetButton,
  styledH3,
  styledSmall,
  styledText,
  Theme,
} from "cherry-styled-components";
import { rgba } from "polished";
import Link from "next/link";
import styled, { css } from "styled-components";
import { StyledH1 } from "@/components/layout/Typography";

export const interactiveStyles = css<{ theme: Theme }>\`
  transition: all 0.3s ease;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px \${({ theme }) => theme.colors.primary};

  &:hover {
    border-color: \${({ theme }) => theme.colors.primary};
  }

  &:focus {
    border-color: \${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 4px \${({ theme }) => theme.colors.primaryLight};
  }

  &:active {
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

export const StyledPriceHeader = styled.div<{ theme: Theme }>\`
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  padding: 20px;
  display: flex;
  gap: 20px;

  & strong {
    margin: auto 0;
    color: \${({ theme }) => theme.colors.dark};
  }
\`;

export const StyledPrice = styled.span<{
  theme: Theme;
  $textAlign?: "left" | "center" | "right";
}>\`
  color: \${({ theme }) => theme.colors.dark};
  display: block;
  font-weight: 800;
  \${({ theme }) => styledH3(theme)}
  \${({ $textAlign }) =>
    $textAlign &&
    css\`
      text-align: \${$textAlign};
    \`}
\`;

export const StyledSmall = styled.small<{
  theme: Theme;
  $textAlign?: "left" | "center" | "right";
}>\`
  \${({ theme }) => styledSmall(theme)};
  margin: auto 0;
  display: block;
  color: \${({ theme }) => theme.colors.grayDark};
  \${({ $textAlign }) =>
    $textAlign &&
    css\`
      text-align: \${$textAlign};
    \`}
\`;

export const StyledMinHeight = styled.div\`
  min-height: calc(100svh - 100px);

  \${mq("lg")} {
    min-height: calc(100svh - 120px);
  }
\`;

export const StyledDataUserAvatar = styled.span<{ theme: Theme }>\`
  display: inline-flex;
  justify-content: center;
  min-width: 50px;
  min-height: 50px;
  border-radius: 50%;
  border: solid 2px \${({ theme }) => theme.colors.grayLight};
  background: \${({ theme }) => theme.colors.light};
  position: relative;
  overflow: hidden;
  color: \${({ theme }) => theme.colors.primary};

  & img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }

  & svg {
    pointer-events: none;
    margin: auto;
    transition: none;
  }
\`;

export const StyledDataArrowButton = styled.button<{
  theme: Theme;
  $isActive: boolean;
}>\`
  \${resetButton};
  display: flex;
  gap: 5px;
  min-width: fit-content;

  & .avatar,
  & .clickable {
    box-shadow: 0 0 0 0px \${({ theme }) => theme.colors.primary};
    transition: all 0.3s ease;
  }

  & svg {
    color: \${({ theme }) => theme.colors.primary};
  }

  &:hover {
    & .lucide-chevron-down {
      & path {
        stroke: \${({ theme }) => theme.colors.primaryDark};
      }
    }

    & .avatar,
    & .clickable {
      border-color: \${({ theme }) => theme.colors.primary};
    }
  }

  &:focus {
    & .avatar,
    & .clickable {
      border-color: \${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 4px \${({ theme }) => theme.colors.primaryLight};
    }
  }

  &:active {
    & .avatar,
    & .clickable {
      box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
    }
  }

  & svg {
    margin: auto 0;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      & .lucide-chevron-down {
        transform: rotate(180deg);
      }
    \`}
\`;

export const StyledDataSpan = styled.span<{ theme: Theme }>\`
  display: block;
  font-weight: 500;
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.primary};
  font-family: \${({ theme }) => theme.fonts.text};
\`;

export const StyledDataDropdownHoverWrapper = styled.span<{
  theme: Theme;
  $align?: "center";
}>\`
  position: relative;
  display: block;
  padding: 10px 0;
  margin: -10px 0;

  &:hover {
    & ul {
      pointer-events: all;
      opacity: 1;
      transform: \${({ $align }) =>
        $align === "center"
          ? "translateX(-50%) translateY(0)"
          : "translateY(0)"};
    }

    & .lucide-chevron-down {
      transform: rotate(180deg);
    }
  }

  &:active {
    & ul {
      opacity: 0;
    }
  }
\`;

export const StyledDataDropdownWrapper = styled.span<{
  theme: Theme;
  $isAbsolute?: boolean;
  $marginAuto?: boolean;
}>\`
  position: relative;
  display: flex;
  padding: 10px 0;
  margin: -10px 0;

  & span {
    display: flex;
    margin: auto 0;
  }

  \${({ $isAbsolute }) =>
    $isAbsolute &&
    css\`
      margin: 0;
      padding: 0;
    \`}

  \${({ $marginAuto }) => $marginAuto && \`margin: auto 0;\`}
\`;

export const StyledDataDropdown = styled.ul<{
  theme: Theme;
  $isActive?: boolean;
  $align?: "left" | "center";
  $isTop?: boolean;
  $isAbsolute?: boolean;
  $minWidth?: string;
}>\`
  position: absolute;
  display: block;
  top: 100%;
  right: 0;
  list-style: none;
  transition: all 0.3s ease;
  min-width: \${({ $minWidth }) => ($minWidth ? $minWidth : "200px")};
  text-align: left;
  box-shadow: \${({ theme }) => theme.shadows.sm};
  background: \${({ theme }) => theme.colors.light};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  overflow: hidden;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  transition: all 0.3s ease;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px);
  z-index: 999;

  \${({ $isAbsolute }) =>
    $isAbsolute &&
    css\`
      top: calc(100% + 56px);
      right: 20px;
    \`}

  \${({ $isTop }) => $isTop && \`top: initial; bottom: 100%;\`}

  \${({ $align }) => $align === "left" && \`right: initial; left: 0;\`}
  \${({ $align }) =>
    $align === "center" &&
    \`right: initial; left: 50%; transform: translateX(-50%) translateY(-10px);\`}

  \${({ $isActive, $align }) =>
    $isActive &&
    css\`
      pointer-events: all;
      opacity: 1;
      transform: translateY(0);

      \${$align === "center" &&
      \`right: initial; left: 50%; transform: translateX(-50%) translateY(0);\`}
    \`}
\`;

export const StyledDataDropdownItem = styled.li<{ theme: Theme }>\`
  display: flex;
  width: 100%;
  text-align: left;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};

  &:last-of-type,
  &:only-of-type {
    border-bottom: none;
  }

  & form {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  & a,
  & button,
  & .logout-button {
    \${resetButton};
    width: 100%;
    text-align: left;
    padding: 12px 20px;
    font-weight: 600;
    font-family: inherit;
    color: \${({ theme }) => theme.colors.primary};
    font-size: \${({ theme }) => theme.fontSizes.text.lg};
    text-decoration: none;
    transition: all 0.3s ease;
    border-radius: 0;
    background: transparent;
    display: flex;
    gap: 10px;
    height: auto;
    min-height: 45px;

    &:hover {
      background-color: \${({ theme }) =>
        rgba(
          theme.isDark ? theme.colors.primaryDark : theme.colors.primaryLight,
          0.1,
        )};
      color: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
    }

    &:active,
    &:focus {
      box-shadow: none;
    }

    * {
      margin: auto 0;
    }

    &:focus {
      background-color: \${({ theme }) =>
        rgba(
          theme.isDark ? theme.colors.primaryDark : theme.colors.primaryLight,
          0.15,
        )};
    }

    &:active {
      background-color: \${({ theme }) =>
        rgba(
          theme.isDark ? theme.colors.primaryDark : theme.colors.primaryLight,
          0.2,
        )};
    }
  }

  & button {
    border: none;

    & svg {
      margin: -2px -5px;
    }
  }
\`;

export const StyledDataDropdownButton = styled.button<{ theme: Theme }>\`
  \${resetButton};
\`;

export const StyledDataDropdownSelectWrapper = styled.span<{ theme: Theme }>\`
  padding: 5px;
  display: block;
  width: 100%;

  & select {
    width: 100%;
  }
\`;

export const StyledDataTagButton = styled.button<{ theme: Theme }>\`
  \${resetButton};
  position: absolute;
  top: 0;
  width: 24px;
  height: 100%;
  right: 0;
  border-left: solid 1px
    \${({ theme }) =>
      rgba(theme.isDark ? theme.colors.dark : theme.colors.light, 0.2)};
  transition: all 0.3s ease;

  &:hover {
    background: \${({ theme }) =>
      rgba(theme.isDark ? theme.colors.dark : theme.colors.light, 0.2)};
  }

  & svg {
    width: 16px;
    height: 100%;
    vertical-align: middle;

    & path {
      stroke: \${({ theme }) =>
        theme.isDark ? theme.colors.dark : theme.colors.light};
    }
  }
\`;

export const StyledDataTag = styled.span<{
  theme: Theme;
  $color?: "default" | "warning";
  $capitalize?: boolean;
}>\`
  display: inline-block;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  background: \${({ theme, $color }) =>
    $color === "warning" ? theme.colors.warning : theme.colors.primary};
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.dark : theme.colors.light};
  font-size: \${({ theme }) => theme.fontSizes.small.xs};
  position: relative;
  font-weight: 500;
  padding: 5px 10px;
  margin: auto 0;
  overflow: hidden;
  \${({ $capitalize }) =>
    $capitalize &&
    css\`
      text-transform: capitalize;
    \`}

  &:has(button) {
    padding: 5px 35px 5px 10px;
  }
\`;

export const StyledIllustration = styled.div<{ theme: Theme }>\`
  text-align: center;

  & svg {
    height: auto;
    width: 250px;
    margin: auto;
  }
\`;

export const StyledIllustrationText = styled.p<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.dark};
  \${({ theme }) => styledSmall(theme)};
\`;

export const StyledDataText = styled.div<{ theme: Theme; $gray?: boolean }>\`
  \${({ theme }) => styledText(theme)};
  color: \${({ theme, $gray }) =>
    $gray ? theme.colors.grayDark : theme.colors.dark};
\`;

export const StyledDataHeader = styled.h1<{ theme: Theme }>\`
  \${({ theme }) => styledH3(theme)};
  font-weight: 900;
  color: \${({ theme }) => theme.colors.dark};
\`;

export const StyledMobileOnly = styled.em<{ theme: Theme }>\`
  font-style: normal;
  display: inline;

  \${mq("lg")} {
    display: none;
  }
\`;

export const StyledDesktopOnly = styled.em<{ theme: Theme }>\`
  font-style: normal;
  display: none;

  \${mq("lg")} {
    display: inline;
  }
\`;

export const StyledAlignMiddle = styled.div<{ theme: Theme }>\`
  margin: auto 0;
\`;

export const StyledLoadingOverlay = styled.div<{
  theme: Theme;
  $isActive?: boolean;
}>\`
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: \${({ theme }) => theme.colors.light};
  z-index: 1000;
  display: flex;
  transition: all 0.3s ease;
  opacity: 0;
  pointer-events: none;

  \${({ $isActive }) =>
    $isActive &&
    css\`
      opacity: 1;
      pointer-events: all;
    \`}

  & > * {
    margin: auto;
  }
\`;

export const StyledFlex1 = styled.div\`
  flex: 1;
\`;

export const StyledIconCircle = styled.span<{ theme: Theme }>\`
  border-radius: 50%;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  display: inline-flex;
  color: \${({ theme }) => theme.colors.primary};
  vertical-align: middle;

  & svg {
    margin: auto;
  }
\`;

export const StyledStrong = styled.span<{ theme: Theme }>\`
  display: block;
  margin: auto 0;
  color: \${({ theme }) => theme.colors.primary};
  font-weight: 700;
\`;

export const StyledTextMiddle = styled.span<{ theme: Theme }>\`
  display: block;
  margin: auto 0;
  color: \${({ theme }) => theme.colors.dark};
  text-align: left;
\`;

export const StyledPanelWrapper = styled.div<{ theme: Theme }>\`
  position: relative;
  z-index: 100;

  & input {
    position: relative;
    z-index: 10;
  }
\`;

export const StyledPanel = styled.div<{ theme: Theme; $absolute?: boolean }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 2px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  margin: \${({ $absolute }) => ($absolute ? "-10px 0 0 0" : "0")};
  \${({ $absolute }) =>
    $absolute &&
    css\`
      position: absolute;
      width: 100%;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    \`}
  max-height: calc(63px * 3);
  overflow-y: auto;
\`;

export const StyledPanelLabel = styled.div<{ theme: Theme; $moveUp?: boolean }>\`
  font-size: \${({ theme }) => theme.fontSizes.small.xs};
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  color: \${({ theme }) => theme.colors.gray};
  padding: \${({ $moveUp }) => ($moveUp ? "20px 15px 10px" : "20px 15px")};
\`;

export const StyledPanelContent = styled.div<{ theme: Theme }>\`
  display: flex;
  padding: 15px;
  gap: 10px;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  width: 100%;
  text-align: left;
  font-family: \${({ theme }) => theme.fonts.text};
  font-size: \${({ theme }) => theme.fontSizes.text.xs};
  line-height: \${({ theme }) => theme.lineHeights.text.xs};
  font-weight: 500;
  color: \${({ theme }) => theme.colors.primary};
  transition: all 0.3s ease;

  \${mq("lg")} {
    font-size: \${({ theme }) => theme.fontSizes.text.lg};
    line-height: \${({ theme }) => theme.lineHeights.text.lg};
  }

  &:last-of-type {
    border-bottom: none;
  }
\`;

export const StyledPanelButton = styled(Link)<{ theme: Theme }>\`
  \${resetButton};
  display: flex;
  padding: 15px;
  gap: 10px;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  width: 100%;
  text-align: left;
  font-family: \${({ theme }) => theme.fonts.text};
  font-size: \${({ theme }) => theme.fontSizes.text.xs};
  line-height: \${({ theme }) => theme.lineHeights.text.xs};
  font-weight: 500;
  color: \${({ theme }) => theme.colors.primary};
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: \${({ theme }) => rgba(theme.colors.primaryLight, 0.1)};

    & .link {
      border-color: \${({ theme }) => theme.colors.primaryDark};
    }
  }

  &:focus {
    background-color: \${({ theme }) => rgba(theme.colors.primaryLight, 0.15)};

    & .link {
      box-shadow: 0 0 0 4px \${({ theme }) => theme.colors.primaryLight};
      border-color: \${({ theme }) => theme.colors.primary};
    }
  }

  &:active {
    background-color: \${({ theme }) => rgba(theme.colors.primaryLight, 0.2)};

    & .link {
      box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
    }
  }

  \${mq("lg")} {
    font-size: \${({ theme }) => theme.fontSizes.text.lg};
    line-height: \${({ theme }) => theme.lineHeights.text.lg};
  }

  &:last-of-type {
    border-bottom: none;
  }

  & .link {
    transition: all 0.3s ease;
    pointer-events: none;
  }
\`;

export const StyledPanelSpan = styled.span<{ theme: Theme }>\`
  margin: auto 0;
  display: flex;
  flex: 1;
  line-height: 1.5;
\`;

export const editableContent = css<{ theme: Theme }>\`
  border: dotted 1px transparent;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  transition: all 0.3s ease;
  outline: none;
  cursor: text;

  &:hover {
    border: dotted 1px \${({ theme }) => theme.colors.gray};
  }

  &:focus {
    border: dotted 1px \${({ theme }) => theme.colors.info};
  }
\`;

export const StyledDataEditableText = styled.div<{
  theme: Theme;
  $gray?: boolean;
}>\`
  \${({ theme }) => styledText(theme)};
  color: \${({ theme, $gray }) =>
    $gray ? theme.colors.grayDark : theme.colors.dark};

  &[contenteditable="true"] {
    \${editableContent};
  }
\`;

export const StyledSmallButtonWrapper = styled.div<{ theme: Theme }>\`
  position: relative;

  & .hidden-button {
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
  }

  &:hover {
    & .hidden-button {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
    }
  }
\`;

export const StyledSmallButton = styled.button<{
  theme: Theme;
}>\`
  \${resetButton};
  display: flex;
  gap: 5px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  color: \${({ theme }) => theme.colors.primary};
  background: \${({ theme }) => theme.colors.light};
  margin: auto 0;
  min-width: fit-content;
  \${interactiveStyles}

  &.hidden-button {
    position: absolute;
    bottom: 1px;
    right: 1px;
    z-index: 98;
  }
\`;

export const StyledTitle = styled(StyledH1)<{ theme: Theme }>\`
  display: block;

  &[contenteditable="true"] {
    \${editableContent};
  }
\`;

export const StyledImage = styled.img<{ theme: Theme; $maxWidth?: string }>\`
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  max-width: \${({ $maxWidth }) => ($maxWidth ? $maxWidth : "100%")};
  width: 100%;
  height: auto;
  border: 1px solid \${({ theme }) => theme.colors.grayLight};
\`;

export const stylesLists = css<{ theme: Theme }>\`
  & ul,
  & ol {
    & li {
      & > .code-wrapper {
        margin: 10px 0;
      }
    }
  }

  & ul {
    list-style: none;
    padding: 0;
    margin: 0;

    & li {
      text-indent: 0;
      display: block;
      position: relative;
      padding: 0 0 0 15px;
      margin: 0;
      \${({ theme }) => styledText(theme)};
      min-height: 23px;

      $mq: "lg" {
        min-height: 27px;
      }

      &::before {
        content: "";
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: \${({ theme }) => theme.colors.primary};
        position: absolute;
        top: 8px;
        left: 2px;

        \${mq("lg")} {
          top: 10px;
        }
      }
    }
  }

  & ol {
    padding: 0;
    margin: 0;

    & ul {
      padding-left: 15px;
    }

    & > li {
      position: relative;
      padding: 0;
      counter-increment: item;
      margin: 0;
      \${({ theme }) => styledText(theme)};

      &::before {
        content: counter(item) ".";
        display: inline-block;
        margin: 0 4px 0 0;
        font-weight: 700;
        color: \${({ theme }) => theme.colors.primary};
        min-width: max-content;
      }
    }
  }
\`;

export const styledTable = css<{ theme: Theme }>\`
  & table {
    margin: 0;
    padding: 0;
    border-collapse: collapse;
    width: 100%;
    text-align: left;

    & tr {
      margin: 0;
      padding: 0;
    }

    & th {
      border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
      padding: 10px 0;
      \${({ theme }) => styledSmall(theme)};
      font-weight: 600;
      color: \${({ theme }) => theme.colors.dark};
    }

    & td {
      border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
      padding: 10px 10px 10px 0;
      color: \${({ theme }) => theme.colors.grayDark};
      \${({ theme }) => styledSmall(theme)};
    }
  }
\`;
`;
