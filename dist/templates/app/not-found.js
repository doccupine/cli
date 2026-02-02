export const notFoundTemplate = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";

const content = \`# 404 Not Found

You just hit a route that doesn't exist.\`;

export const metadata: Metadata = {
  title: "Not Found",
  description:
    "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. AI-ready.",
  openGraph: {
    title: "Not Found",
    description:
      "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. AI-ready.",
  },
};

export default function Page() {
  return <Docs content={content} />;
}
`;
