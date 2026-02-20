export const sharedStyledTemplate = `"use client";
import { mq, styledSmall, styledText, Theme } from "cherry-styled-components";
import { css } from "styled-components";

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

export const styledAnchor = css<{ theme: Theme }>\`
  & a:not([class]) {
    color: inherit;
    transition: all 0.3s ease;
    text-decoration: none;
    box-shadow: 0 2px 0 0 \${({ theme }) => theme.colors.primary};

    &:hover {
      color: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
      box-shadow: 0 1px 0 0 \${({ theme }) => theme.colors.primary};
    }
  }
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

      \${mq("lg")} {
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
    display: block;
    overflow-x: auto;

    & tr {
      margin: 0;
      padding: 0;
    }

    & th {
      border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
      padding: 10px 10px 10px 0;
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
