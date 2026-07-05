import { DEFAULT_DESCRIPTION } from "../../lib/constants.js";

export const notFoundTemplate = `import { Metadata } from "next";
import { NotFound } from "@/components/layout/NotFound";

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
  return <NotFound />;
}
`;
