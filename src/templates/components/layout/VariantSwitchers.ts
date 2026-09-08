export const variantSwitchersTemplate = `"use client";
import { useRouter } from "next/navigation";
import styled, { css } from "styled-components";
import { Check, ChevronDown, Languages, Tag } from "lucide-react";
import { mq, Theme } from "@/app/theme";
import { Dropdown, DropdownItem } from "@/components/layout/Dropdown";
import { useStrings } from "@/components/useStrings";
import { useVariant } from "@/components/useVariant";
import type { PagesProps } from "@/utils/orderNavItems";
import {
  defaultLanguage,
  joinVariantSlug,
  languages,
  pageVariantPrefix,
  stripLanguagePrefix,
  stripVariantPrefix,
  variantPrefix,
  versions,
} from "@/utils/variants";

// The switchers share the footer row with the focus-mode toggle at its left
// end and the theme toggle at its right. A lone pill claims only the width
// its label needs; a pair grows from its labels' widths into the rail's free
// width and gives up characters, never height, when that is not enough.
const StyledSwitchers = styled.div<{ $dense: boolean }>\`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  \${({ $dense }) =>
    $dense &&
    css\`
      \${mq("lg")} {
        flex: 1;
      }
    \`}
\`;

// One pill: its trigger carries the Lucide glyph, the current label, and a
// chevron that turns while open.
const StyledSwitcher = styled.div<{ $dense: boolean }>\`
  display: flex;
  min-width: 0;

  \${({ $dense }) =>
    $dense &&
    css\`
      \${mq("lg")} {
        flex: 1 1 auto;
      }
    \`}
\`;

const truncatedLabel = css\`
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
\`;

// Fills the trigger so the label takes the width and the chevron keeps the
// right edge when the pill is stretched across the rail.
const StyledTriggerContent = styled.span<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  font-size: \${({ theme }) => theme.fontSizes.small.xs};
  font-weight: 600;
  line-height: 1;
  color: \${({ theme }) => theme.colors.accentStrong};

  /* The glyphs sit at the toggles' own resting color and pick up the accent
     on hover, so all four controls of the row light up the same way. */
  & svg {
    flex-shrink: 0;
    color: \${({ theme }) => theme.colors.primary};
    transition: color 0.3s ease;
  }

  & > svg:last-child {
    transition:
      color 0.3s ease,
      transform 0.3s ease;
  }

  button:hover > & svg {
    color: \${({ theme }) => theme.colors.accent};
  }

  [aria-expanded="true"] > & > svg:last-child {
    transform: rotate(180deg);
  }
\`;

// Below "lg" the sidebar is the full-width mobile menu, so every trigger shows
// its glyph and full label there. On the rail the two of them share about
// 130px beside the toggles: a lone switcher still spells its label out, while
// a pair drops to the glyphless short form (a language's code, a version's
// own label) rather than truncating both.
const StyledTriggerIcon = styled.span<{ $dense: boolean }>\`
  display: flex;

  \${({ $dense }) =>
    $dense &&
    css\`
      \${mq("lg")} {
        display: none;
      }
    \`}
\`;

const StyledTriggerLabel = styled.span<{ $dense: boolean }>\`
  \${truncatedLabel};

  \${({ $dense }) =>
    $dense &&
    css\`
      \${mq("lg")} {
        display: none;
      }
    \`}
\`;

const StyledTriggerShortLabel = styled.span\`
  \${truncatedLabel};
  display: none;

  \${mq("lg")} {
    display: block;
  }
\`;

// Keeps every label aligned whether or not the entry carries the check mark.
const StyledItemMark = styled.span\`
  display: flex;
  flex-shrink: 0;
  width: 14px;
\`;

interface SwitcherOption {
  value: string;
  label: string;
  /** Rail-sized form of the label; falls back to the label itself. */
  short?: string;
}

interface VariantSwitcherProps {
  label: string;
  icon: React.ReactNode;
  options: SwitcherOption[];
  value: string;
  /** Which edge of the trigger the menu hangs from, so it opens into the
      sidebar rather than past one of its edges. */
  align: "left" | "right";
  /** Both switchers are on the row, so the rail shows the short labels. */
  dense: boolean;
  onSelect: (value: string) => void;
}

// One dropdown of radio items above its trigger: the platform's Dropdown, so
// the language and version pickers look like every other menu on Doccupine.
function VariantSwitcher({
  label,
  icon,
  options,
  value,
  align,
  dense,
  onSelect,
}: VariantSwitcherProps) {
  const current = options.find((option) => option.value === value);
  const currentLabel = current?.label ?? label;
  return (
    <StyledSwitcher $dense={dense}>
      <Dropdown
        role="menu"
        label={label}
        triggerLabel={\`\${label}: \${currentLabel}\`}
        align={align}
        placement="top"
        compact
        fullWidth={dense}
        trigger={
          <StyledTriggerContent>
            <StyledTriggerIcon $dense={dense}>{icon}</StyledTriggerIcon>
            <StyledTriggerLabel $dense={dense}>
              {currentLabel}
            </StyledTriggerLabel>
            {dense && (
              <StyledTriggerShortLabel>
                {current?.short ?? currentLabel}
              </StyledTriggerShortLabel>
            )}
            <ChevronDown size={12} aria-hidden="true" />
          </StyledTriggerContent>
        }
      >
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={option.value === value}
            $checked={option.value === value}
            onClick={() => onSelect(option.value)}
          >
            <StyledItemMark aria-hidden="true">
              {option.value === value && <Check size={14} />}
            </StyledItemMark>
            {option.label}
          </DropdownItem>
        ))}
      </Dropdown>
    </StyledSwitcher>
  );
}

interface VariantSwitchersProps {
  pages: PagesProps[];
}

// The language and version switchers on the sidebar footer row, between the
// focus-mode and theme toggles. Each is rendered only when its file declares
// at least two entries, so a site without languages.json or versions.json
// renders nothing here and the row keeps just its two toggles.
function VariantSwitchers({ pages }: VariantSwitchersProps) {
  const router = useRouter();
  const current = useVariant();
  const t = useStrings();
  const showLanguages = (languages?.length ?? 0) >= 2;
  const showVersions = (versions?.length ?? 0) >= 2;
  if (!showLanguages && !showVersions) return null;

  const currentSlug = joinVariantSlug(current.prefix, current.rest);
  const currentLocale = current.locale ?? defaultLanguage()?.code;
  const currentVersion = current.version ?? "";
  const go = (slug: string) => router.push(slug === "" ? "/" : "/" + slug);
  const hasPagesIn = (prefix: string) =>
    pages.some((page) => pageVariantPrefix(page) === prefix);

  // The same page in the target language when it exists, otherwise that
  // language's home for the current version, otherwise its default home.
  const switchLanguage = (code: string) => {
    const key = stripLanguagePrefix(currentSlug, currentLocale);
    const match = pages.find(
      (page) =>
        page.locale === code &&
        stripLanguagePrefix(page.slug, page.locale) === key,
    );
    if (match) return go(match.slug);
    const withVersion = variantPrefix(code, currentVersion);
    go(hasPagesIn(withVersion) ? withVersion : variantPrefix(code, ""));
  };

  // The same page in the target version for the current language when it
  // exists, otherwise that version's home for the current language.
  const switchVersion = (slug: string) => {
    const key = stripVariantPrefix(currentSlug, currentLocale, currentVersion);
    const match = pages.find(
      (page) =>
        (page.locale ?? currentLocale) === currentLocale &&
        (page.version ?? "") === slug &&
        stripVariantPrefix(page.slug, page.locale, page.version) === key,
    );
    go(match ? match.slug : variantPrefix(currentLocale, slug));
  };

  // A pair spreads across the rail, so the first menu hangs from its
  // trigger's left edge and the second from its right edge: either way the
  // menu opens over the sidebar instead of past one of its sides.
  const dense = showLanguages && showVersions;

  return (
    <StyledSwitchers $dense={dense}>
      {showLanguages && languages && (
        <VariantSwitcher
          label={t.language}
          icon={<Languages size={16} aria-hidden="true" />}
          value={currentLocale ?? ""}
          align="left"
          dense={dense}
          onSelect={switchLanguage}
          options={languages.map((language) => ({
            value: language.code,
            label: language.label,
            short: language.code.toUpperCase(),
          }))}
        />
      )}
      {showVersions && versions && (
        <VariantSwitcher
          label={t.version}
          icon={<Tag size={16} aria-hidden="true" />}
          value={currentVersion}
          align={dense ? "right" : "left"}
          dense={dense}
          onSelect={switchVersion}
          options={versions.map((version) => ({
            value: version.slug,
            label: version.label,
          }))}
        />
      )}
    </StyledSwitchers>
  );
}

export { VariantSwitchers };
`;
