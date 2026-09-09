export const useVariantTemplate = `"use client";
import { usePathname } from "next/navigation";
import {
  resolveVariantFromSlug,
  type VariantResolution,
} from "@/utils/variants";

/** The language and version of the current route, read from its URL prefix. */
export function useVariant(): VariantResolution {
  const pathname = usePathname();
  return resolveVariantFromSlug(pathname);
}
`;
