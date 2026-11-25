export const variantSwitchersTemplate = `"use client";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Languages } from "lucide-react";
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
// end and the theme control at its right. A lone pill claims only the width
// its label needs; a pair grows from its labels' widths into the rail's free
// width and gives up characters, never height, when that is not enough. On
// the rail a pair shows the short labels. Styles: app/styles
// (.dcp-switchers).

interface SwitcherOption {
  value: string;
  label: string;
  /** Rail-sized form of the label; falls back to the label itself. */
  short?: string;
}

interface VariantSwitcherProps {
  label: string;
  /** Leading icon; the version switcher has none. */
  icon?: React.ReactNode;
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
    <div className="dcp-switcher">
      <Dropdown
        role="menu"
        label={label}
        triggerLabel={\`\${label}: \${currentLabel}\`}
        align={align}
        placement="top"
        compact
        fullWidth={dense}
        trigger={
          <span className="dcp-switcher__content">
            {icon && <span className="dcp-switcher__icon">{icon}</span>}
            <span className="dcp-switcher__label">{currentLabel}</span>
            {dense && (
              <span className="dcp-switcher__short">
                {current?.short ?? currentLabel}
              </span>
            )}
            <ChevronDown size={12} aria-hidden="true" />
          </span>
        }
      >
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={option.value === value}
            checked={option.value === value}
            onClick={() => onSelect(option.value)}
          >
            <span className="dcp-switcher__mark" aria-hidden="true">
              {option.value === value && <Check size={14} />}
            </span>
            {option.label}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
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
    <div className="dcp-switchers" data-dense={dense || undefined}>
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
    </div>
  );
}

export { VariantSwitchers };
`;
