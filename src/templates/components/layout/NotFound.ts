export const notFoundComponentTemplate = `"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";
import styled from "styled-components";
import themeJson from "@/theme.json";
import { Theme, mq } from "@/app/theme";
import { Button } from "@/components/layout/Button";
import { Logo } from "@/components/layout/Pictograms";

const customThemeJson = themeJson as typeof themeJson & {
  logo?: { dark: string; light: string };
};

// A full-page canvas: a faint dot grid and a soft glow in the accent color,
// both faded out toward the edges. Every color is a theme variable, so it
// follows the light/dark mode and any theme.json palette.
const StyledWrapper = styled.main<{ theme: Theme }>\`
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  overflow: hidden;
  isolation: isolate;
  background: \${({ theme }) => theme.colors.light};

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: radial-gradient(
      \${({ theme }) =>
          \`color-mix(in srgb, \${theme.colors.dark} 14%, transparent)\`}
        1px,
      transparent 1px
    );
    background-size: 24px 24px;
    mask-image: radial-gradient(ellipse at center, black 10%, transparent 70%);
  }

  &::after {
    content: "";
    position: absolute;
    top: -20%;
    left: 50%;
    z-index: -1;
    width: min(720px, 120vw);
    aspect-ratio: 1;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      \${({ theme }) =>
          \`color-mix(in srgb, \${theme.colors.accent} 14%, transparent)\`}
        0%,
      transparent 65%
    );
  }
\`;

const StyledLogo = styled(Link)\`
  display: inline-flex;
  align-items: center;
  height: 32px;
  margin-bottom: auto;

  & img,
  & svg {
    height: 28px;
    width: auto;
  }
\`;

const StyledContent = styled.div\`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 480px;
  padding: 48px 0;
  margin-bottom: auto;
  text-align: center;
\`;

// The big numeral fades from the text color into the page.
const StyledCode = styled.p<{ theme: Theme }>\`
  margin: 0 0 4px;
  font-size: 96px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.05em;
  color: transparent;
  background: linear-gradient(
    to bottom,
    \${({ theme }) =>
        \`color-mix(in srgb, \${theme.colors.dark} 22%, transparent)\`}
      20%,
    \${({ theme }) => \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`}
      100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  user-select: none;

  \${mq("lg")} {
    font-size: 144px;
  }
\`;

const StyledEyebrow = styled.p<{ theme: Theme }>\`
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  color: \${({ theme }) => theme.colors.accent};
\`;

const StyledTitle = styled.h1<{ theme: Theme }>\`
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: \${({ theme }) => theme.colors.dark};

  \${mq("lg")} {
    font-size: 36px;
  }
\`;

const StyledText = styled.p<{ theme: Theme }>\`
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: \${({ theme }) => theme.colors.grayDark};

  \${mq("lg")} {
    font-size: 18px;
  }
\`;

const StyledActions = styled.div\`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
\`;

export function NotFound() {
  const router = useRouter();

  // Back to the previous page when there is one in this tab, else home.
  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <StyledWrapper>
      <StyledLogo href="/" aria-label="Home">
        {customThemeJson.logo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="light-only"
              src={customThemeJson.logo.light}
              alt="Logo"
              width="100"
              height="100"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="dark-only"
              src={customThemeJson.logo.dark}
              alt="Logo"
              width="100"
              height="100"
            />
          </>
        ) : (
          <Logo />
        )}
      </StyledLogo>
      <StyledContent>
        <StyledCode aria-hidden="true">404</StyledCode>
        <StyledEyebrow>Error 404</StyledEyebrow>
        <StyledTitle>Page not found</StyledTitle>
        <StyledText>
          The page you are looking for does not exist or has moved.
        </StyledText>
        <StyledActions>
          {/* Icons imported directly: the icon registry only collects names
              from <Icon name> tags, not from Button's icon prop. */}
          <Button href="/">
            <House />
            Back to home
          </Button>
          <Button outline onClick={goBack}>
            <ArrowLeft />
            Go back
          </Button>
        </StyledActions>
      </StyledContent>
    </StyledWrapper>
  );
}
`;
