export const notFoundComponentTemplate = `"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";
import themeJson from "@/theme.json";
import { Button } from "@/components/layout/Button";
import { Logo } from "@/components/layout/Pictograms";

const customThemeJson = themeJson as typeof themeJson & {
  logo?: { dark: string; light: string };
};

// A full-page canvas with a dot grid and a soft accent glow. Styles:
// app/styles (.dcp-not-found).
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
    <main className="dcp-not-found">
      <Link className="dcp-not-found__logo" href="/" aria-label="Home">
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
      </Link>
      <div className="dcp-not-found__content">
        <p className="dcp-not-found__code" aria-hidden="true">
          404
        </p>
        <h1 className="dcp-not-found__title">Page not found</h1>
        <p className="dcp-not-found__text">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="dcp-not-found__actions">
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
        </div>
      </div>
    </main>
  );
}
`;
