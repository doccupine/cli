export const docsTemplate = `import { Flex } from "cherry-styled-components";
import {
  DocsContainer,
  StyledMarkdownContainer,
} from "@/components/layout/DocsComponents";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "@/components/MDXComponents";
import { DocsSideBar } from "@/components/DocsSideBar";
import { ActionBar } from "@/components/layout/ActionBar";

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
  const contentWithoutCodeBlocks = content.replace(/\`\`\`[\\s\\S]*?\`\`\`/g, "");
  const headingRegex = /^(#{1,6})\\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(contentWithoutCodeBlocks)) !== null) {
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
        <ActionBar content={content}>
          <Flex $gap={20}>
            <StyledMarkdownContainer>
              {content && (
                <MDXRemote
                  source={content}
                  options={{
                    blockJS: false,
                    mdxOptions: {
                      remarkPlugins: [remarkGfm],
                    },
                  }}
                  components={components}
                />
              )}
            </StyledMarkdownContainer>
          </Flex>
        </ActionBar>
      </DocsContainer>
      <DocsSideBar headings={headings} />
    </>
  );
}

export { Docs };
`;
