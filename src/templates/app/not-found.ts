import { DEFAULT_DESCRIPTION } from "../constants.js";

export const notFoundTemplate = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";

const content = \`# 404 Not Found

You just hit a route that doesn't exist.\`;

export const metadata: Metadata = {
  title: "Not Found",
  description:
    "${DEFAULT_DESCRIPTION}",
  openGraph: {
    title: "Not Found",
    description:
      "${DEFAULT_DESCRIPTION}",
  },
};

export default function Page() {
  return <Docs content={content} />;
}
`;
