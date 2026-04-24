export const typographyTemplate = `"use client";
import {
  styledH1,
  styledH2,
  styledH3,
  styledH4,
  styledH5,
  styledH6,
  styledText,
} from "cherry-styled-components";
import styled, { css } from "styled-components";
import { Theme } from "@/app/theme";

const StyledHeading = css\`
  font-weight: 900;
\`;

export const StyledH1 = styled.h1<{ theme: Theme }>\`
  \${StyledHeading};
  \${({ theme }) => styledH1(theme)}
\`;

export const StyledH2 = styled.h2<{ theme: Theme }>\`
  \${StyledHeading};
  \${({ theme }) => styledH2(theme)}
\`;

export const StyledH3 = styled.h3<{ theme: Theme }>\`
  \${StyledHeading};
  \${({ theme }) => styledH3(theme)}
\`;

export const StyledH4 = styled.h4<{ theme: Theme }>\`
  \${StyledHeading};
  \${({ theme }) => styledH4(theme)}
\`;

export const StyledH5 = styled.h5<{ theme: Theme }>\`
  \${StyledHeading};
  \${({ theme }) => styledH5(theme)}
\`;

export const StyledH6 = styled.h6<{ theme: Theme }>\`
  \${StyledHeading};
  \${({ theme }) => styledH6(theme)}
\`;

export const StyledText = styled.p<{ theme: Theme }>\`
  \${({ theme }) => styledText(theme)}
\`;
`;
