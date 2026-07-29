export const docsTemplate = `import React from "react";
import { Flex } from "cherry-styled-components";
import {
  DocsContainer,
  StyledMarkdownContainer,
} from "@/components/layout/DocsComponents";
import { Callout } from "@/components/layout/Callout";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "@/components/MDXComponents";
import { createMermaidPre } from "@/components/MermaidPre";
import { DocsSideBar } from "@/components/DocsSideBar";
import { ActionBar } from "@/components/layout/ActionBar";
import { ApiPlaygroundDemo } from "@/components/layout/ApiPlaygroundDemo";
import { createSlugger } from "@/components/layout/Slug";
import { rehypeCodeMeta } from "@/utils/rehypeCodeMeta";

interface DocsProps {
  content: string;
  sourcePath?: string;
  // Path of this page's RSS feed; when set, the action bar shows an RSS
  // button linking to it.
  rssHref?: string;
  // Extra content rendered inside the markdown column, after the MDX body.
  // Used to place generated widgets (e.g. the API playground) inside the docs
  // content area rather than outside its layout.
  children?: React.ReactNode;
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
    <Callout type="danger">
      <p>Missing component: &lt;{componentName} /&gt;</p>
    </Callout>
  );
}

interface MdxBodyProps {
  source: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: Record<string, React.ComponentType<any>>;
  sourcePath?: string;
}

// Compiles the MDX body inside a try/catch so an authoring mistake (an
// orphaned closing tag, a stray {expression}) renders an inline error panel
// instead of throwing during static prerender - a broken page must never
// fail \`next build\` for the rest of the site.
async function MdxBody({ source, components, sourcePath }: MdxBodyProps) {
  try {
    const { content } = await compileMDX({
      source,
      options: {
        blockJS: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeCodeMeta],
        },
      },
      components,
    });
    // JS expressions in the body only run when the compiled component
    // renders, which would escape this try/catch and still fail the build.
    // The compiled component is a plain sync function, so invoke it once
    // here to surface those errors (a {placeholder} typo, for example).
    if (typeof content.type === "function") {
      await (content.type as React.FC<unknown>)(content.props);
    }
    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const where = sourcePath ? \` in \${sourcePath}\` : "";
    console.error(\`[doccupine] MDX error\${where}:\`, message);
    return (
      <Callout type="danger">
        <p>
          <strong>This page has an MDX error{where}.</strong> The rest of the
          site still builds and renders. Fix the syntax below and save the file
          to rebuild this page.
        </p>
        <pre>{message}</pre>
      </Callout>
    );
  }
}

function Docs({ content, sourcePath, rssHref, children }: DocsProps) {
  const components = useMDXComponents({
    pre: createMermaidPre(sourcePath),
    ApiPlaygroundDemo,
  });

  const knownNames = Object.keys(components);
  const usedNames = extractComponentNames(content);
  const missingNames = usedNames.filter((name) => !knownNames.includes(name));

  // A <SidePanel> takes over the right rail, so the table of contents that
  // normally lives there is dropped for that page. extractComponentNames
  // ignores code blocks, so a panel shown only as a code sample never counts.
  const hasSidePanel = usedNames.includes("SidePanel");
  const headings = hasSidePanel ? [] : extractHeadings(content);

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
        <ActionBar content={content} rssHref={rssHref}>
          <Flex $gap={20}>
            <StyledMarkdownContainer>
              {children}
              {content && (
                <MdxBody
                  source={content}
                  components={allComponents}
                  sourcePath={sourcePath}
                />
              )}
            </StyledMarkdownContainer>
          </Flex>
        </ActionBar>
      </DocsContainer>
      {!hasSidePanel && <DocsSideBar headings={headings} />}
    </>
  );
}

export { Docs };
`;
