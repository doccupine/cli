export const useStringsTemplate = `"use client";
import { useVariant } from "@/components/useVariant";
import { getStrings, type UiStrings } from "@/utils/strings";

/** The chrome strings of the current route's language. */
export function useStrings(): UiStrings {
  const { locale } = useVariant();
  return getStrings(locale);
}
`;
