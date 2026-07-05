export const docsTemplate = `import React from "react";
import { Flex } from "cherry-styled-components";
import {
  DocsContainer,
  StyledMarkdownContainer,
  StyledMissingComponent,
} from "@/components/layout/DocsComponents";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "@/components/MDXComponents";
import { DocsSideBar } from "@/components/DocsSideBar";
import { ActionBar } from "@/components/layout/ActionBar";
import { createSlugger } from "@/components/layout/Slug";

interface DocsProps {
  content: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(content: string): Heading[] {
  const contentWithoutCodeBlocks = content.replace(/\`\`\`[\\s\\S]*?\`\`\`/g, "");
  const entries: { text: string; level: number; position: number }[] = [];
  let match;

  // Markdown headings (# .. ######)
  const headingRegex = /^(#{1,6})\\s+(.+)$/gm;
  while ((match = headingRegex.exec(contentWithoutCodeBlocks)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    entries.push({ text, level, position: match.index });
  }

  // <Update label="..."> blocks surface their label as a top-level entry
  const updateRegex = /<Update\\b[^>]*?\\blabel=["']([^"']+)["'][^>]*>/g;
  while ((match = updateRegex.exec(contentWithoutCodeBlocks)) !== null) {
    entries.push({ text: match[1].trim(), level: 1, position: match.index });
  }

  // Assign ids in document order with a shared slugger so repeated heading
  // text produces unique anchors ("setup", "setup-1", ...) that stay in sync
  // with the ids rendered by MDXComponents/Update.
  const slug = createSlugger();
  return entries
    .sort((a, b) => a.position - b.position)
    .map(({ text, level }) => ({ id: slug(text), text, level }));
}

function extractComponentNames(source: string): string[] {
  const stripped = source
    .replace(/\`\`\`[\\s\\S]*?\`\`\`/g, "")
    .replace(/\`[^\`]*\`/g, "");
  const tagRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  const names = new Set<string>();
  let match;
  while ((match = tagRegex.exec(stripped)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names);
}

function MissingComponent({
  componentName,
  children: _children,
}: {
  componentName: string;
  children?: React.ReactNode;
}) {
  return (
    <StyledMissingComponent>
      Missing component: &lt;{componentName} /&gt;
    </StyledMissingComponent>
  );
}

function Docs({ content }: DocsProps) {
  const headings = extractHeadings(content);
  const components = useMDXComponents({});

  const knownNames = Object.keys(components);
  const usedNames = extractComponentNames(content);
  const missingNames = usedNames.filter((name) => !knownNames.includes(name));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stubs: Record<string, React.ComponentType<any>> = {};
  for (const name of missingNames) {
    stubs[name] = ({ children }: { children?: React.ReactNode }) => (
      <MissingComponent componentName={name}>{children}</MissingComponent>
    );
  }

  const allComponents = { ...components, ...stubs };

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
                  components={allComponents}
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
