export const docsTemplate = `import React from "react";
import { DocsContainer } from "@/components/layout/DocsComponents";
import { Callout } from "@/components/layout/Callout";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  RequestExample,
  ResponseExample,
  useMDXComponents,
} from "@/components/MDXComponents";
import { createMermaidPre } from "@/components/MermaidPre";
import { DocsSideBar } from "@/components/DocsSideBar";
import { ActionBar } from "@/components/layout/ActionBar";
import { ApiPlaygroundDemo } from "@/components/layout/ApiPlaygroundDemo";
import { createSlugger } from "@/components/layout/Slug";
import { rehypeCodeMeta } from "@/utils/rehypeCodeMeta";
import { Kbd, type KbdProps } from "@/components/layout/Kbd";
import { getStrings } from "@/utils/strings";
import { splitApiExamples } from "@/utils/apiExamples";
import { View, type ViewProps } from "@/components/layout/View";
import {
  GitHubCard,
  type GitHubCardProps,
} from "@/components/layout/GitHubCard";

interface DocsProps {
  content: string;
  // The page as AI reads it, when it has <Visibility> blocks: what "Copy
  // content" copies. \`content\` is the page as readers see it.
  agentContent?: string;
  sourcePath?: string;
  // Path of this page's RSS feed; when set, the action bar shows an RSS
  // button linking to it.
  rssHref?: string;
  // Language of the page content (languages.json); set on the <main> element
  // so the article's language is correct server-side whatever <html lang> is.
  lang?: string;
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

// A fenced code block, closed by a fence of the same kind and length, so a
// four-backtick fence that shows three-backtick fences is one block, and a
// component it shows (<SidePanel>, say) never counts as used on the page.
const FENCED_CODE = /^(\`{3,}|~{3,})[^\\n]*\\n[\\s\\S]*?^\\1[^\\n]*$/gm;

function extractComponentNames(source: string): string[] {
  const stripped = source.replace(FENCED_CODE, "").replace(/\`[^\`]*\`/g, "");
  const tagRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  const names = new Set<string>();
  let match;
  while ((match = tagRegex.exec(stripped)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names);
}

// The <View> titles of a page, in order, outside code.
const VIEW_TITLE =
  /<View\\b[^>]*?\\btitle=(?:"([^"]*)"|'([^']*)'|\\{\\s*"([^"]*)"\\s*\\})/g;

function extractViewTitles(source: string): string[] {
  const stripped = source.replace(FENCED_CODE, "").replace(/\`[^\`]*\`/g, "");
  const titles: string[] = [];
  for (const match of stripped.matchAll(VIEW_TITLE)) {
    const title = match[1] ?? match[2] ?? match[3];
    if (title && !titles.includes(title)) titles.push(title);
  }
  return titles;
}

// A CSS string for any title: everything but letters, digits, spaces, _ and
// - is a hex escape, so no title can end the string or the <style>.
function cssString(value: string): string {
  const escaped = Array.from(value)
    .map((char) =>
      /[A-Za-z0-9 _-]/.test(char)
        ? char
        : \`\\\\\${(char.codePointAt(0) ?? 0).toString(16)} \`,
    )
    .join("");
  return \`"\${escaped}"\`;
}

// Shows the reader's picked title (on <html data-view>, restored before the
// first paint) instead of the page's first one. Only this page's titles are
// named, so a pick from another page that this one lacks keeps the default.
function viewStyles(titles: string[]): string {
  return titles
    .map((title) => {
      const value = cssString(title);
      return [
        \`:root[data-view=\${value}] .dcp-view[data-default] { display: none; }\`,
        \`:root[data-view=\${value}] .dcp-view[data-view=\${value}] { display: flex; }\`,
      ].join("\\n");
    })
    .join("\\n");
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

function Docs({
  content,
  agentContent,
  sourcePath,
  rssHref,
  lang,
  children,
}: DocsProps) {
  // <Kbd> names its symbol keys for screen readers, and the API examples
  // label themselves, in the page's language.
  const strings = getStrings(lang);
  const viewTitles = extractViewTitles(content ?? "");
  const components = useMDXComponents({
    pre: createMermaidPre(sourcePath),
    ApiPlaygroundDemo,
    Kbd: (props: KbdProps) => <Kbd {...props} strings={strings} />,
    RequestExample: (props: React.ComponentProps<typeof RequestExample>) => (
      <RequestExample {...props} strings={strings} />
    ),
    ResponseExample: (props: React.ComponentProps<typeof ResponseExample>) => (
      <ResponseExample {...props} strings={strings} />
    ),
    View: (props: ViewProps) => (
      <View {...props} defaultTitle={viewTitles[0]} />
    ),
    GitHubCard: (props: GitHubCardProps) => (
      <GitHubCard {...props} strings={strings} />
    ),
  });

  const knownNames = Object.keys(components);
  const usedNames = extractComponentNames(content);
  const missingNames = usedNames.filter((name) => !knownNames.includes(name));

  // A <SidePanel> takes over the right rail, so the table of contents that
  // normally lives there is dropped for that page. extractComponentNames
  // ignores code blocks, so a panel shown only as a code sample never counts.
  const hasSidePanel = usedNames.includes("SidePanel");
  // <RequestExample> / <ResponseExample> blocks are cut out of the body and
  // compiled together into one rail (utils/apiExamples.ts), which claims the
  // right column the same way a SidePanel does. A page that already has a
  // SidePanel keeps its examples inline instead.
  const { body, examples } = hasSidePanel
    ? { body: content, examples: null }
    : splitApiExamples(content ?? "");
  const hasRail = hasSidePanel || examples !== null;
  const headings = hasRail ? [] : extractHeadings(content);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stubs: Record<string, React.ComponentType<any>> = {};
  for (const name of missingNames) {
    stubs[name] = ({ children }: { children?: React.ReactNode }) => (
      <MissingComponent componentName={name}>{children}</MissingComponent>
    );
  }

  const pageComponents = { ...components, ...stubs };
  const allComponents = examples
    ? {
        ...pageComponents,
        ApiExamplesSlot: () => (
          <aside
            className="dcp-side-panel dcp-api-examples"
            aria-label={strings.apiExamples}
            data-side-panel
          >
            <MdxBody
              source={examples}
              components={pageComponents}
              sourcePath={sourcePath}
            />
          </aside>
        ),
      }
    : pageComponents;

  return (
    <>
      {viewTitles.length > 1 && <style>{viewStyles(viewTitles)}</style>}
      <DocsContainer lang={lang}>
        <ActionBar
          content={content}
          copyContent={agentContent}
          rssHref={rssHref}
          views={viewTitles.length > 1 ? viewTitles : undefined}
        >
          <div className="dcp-docs__body">
            <div className="dcp-docs__content">
              {children}
              {content && (
                <MdxBody
                  source={body}
                  components={allComponents}
                  sourcePath={sourcePath}
                />
              )}
            </div>
          </div>
        </ActionBar>
      </DocsContainer>
      {!hasRail && <DocsSideBar headings={headings} />}
    </>
  );
}

export { Docs };
`;
