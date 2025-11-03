export const docsTemplate = `import { Flex } from "cherry-styled-components/src/lib";
import {
  DocsContainer,
  StyledMarkdownContainer
} from "@/components/layout/DocsComponents";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "@/components/MDXComponents";
import { DocsSideBar } from "@/components/DocsSideBar";
import { CopyButton } from "@/components/layout/CopyButton";

interface DocsProps {
  content: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\\w\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .trim();
}

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,6})\\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateId(text);
    headings.push({ id, text, level });
  }

  return headings;
}

function Docs({ content }: DocsProps) {
  const headings = extractHeadings(content);
  const components = useMDXComponents({});

  return (
    <>
      <DocsContainer>
        <Flex $gap={20}>
          <StyledMarkdownContainer>
            <CopyButton content={content} />
            {content && (
              <MDXRemote
                source={content}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                  },
                }}
                components={components}
              />
            )}
          </StyledMarkdownContainer>
        </Flex>
      </DocsContainer>
      <DocsSideBar headings={headings} />
    </>
  );
}

export { Docs };`;
