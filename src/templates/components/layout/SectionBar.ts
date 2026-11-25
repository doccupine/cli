export const sectionBarTemplate = `"use client";
import Link from "next/link";
import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";
import { useStrings } from "@/components/useStrings";

interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
}

interface SectionBarProps {
  sections: SectionConfig[];
  /** Section slugs that have pages in each language/version prefix; a
   *  section absent from the current prefix is not shown there. */
  variantSections?: Record<string, string[]>;
}

// The section tabs inside the header. Styles: app/styles (.dcp-section-bar).
function SectionBar({ sections, variantSections }: SectionBarProps) {
  const { prefix, rest } = useVariant();
  const t = useStrings();
  const visibleSections = variantSections
    ? sections.filter((section) =>
        (variantSections[prefix] ?? []).includes(section.slug),
      )
    : sections;

  const activeSection = visibleSections.find((section) => {
    if (section.slug === "") return false;
    return rest === section.slug || rest.startsWith(section.slug + "/");
  });

  const activeSectionSlug = activeSection ? activeSection.slug : "";

  return (
    <nav className="dcp-section-bar" aria-label={t.sections}>
      {visibleSections.map((section) => (
        <Link
          key={section.slug}
          className="dcp-section-bar__link"
          href={"/" + joinVariantSlug(prefix, section.slug)}
          data-active={activeSectionSlug === section.slug || undefined}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}

export { SectionBar };
`;
