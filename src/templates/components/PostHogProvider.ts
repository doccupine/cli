export const postHogProviderTemplate = `"use client";

import dynamic from "next/dynamic";

const PostHogSetup = dynamic(
  () =>
    import("@/components/PostHogProviderLazy").then((mod) => mod.PostHogSetup),
  { ssr: false },
);

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PostHogSetup />
      {children}
    </>
  );
}
`;
