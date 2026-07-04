export const codeMdxTemplate = `---
title: "Code"
description: "Learn how to display inline code and code blocks in documentation."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 3
---

# Code

Learn how to display inline code and code blocks in documentation.

## Adding Code Samples

Both inline code snippets and full code blocks are supported. Code blocks offer customization for syntax highlighting and more to improve readability and user experience.

### Inline Code

Highlight code within text by wrapping it with backticks:

\`\`\`text
Enclose any \`word\` or \`phrase\` in backticks to format it as code.
\`\`\`

Enclose any \`word\` or \`phrase\` in backticks to format it as code.

## Code Blocks

To present larger code samples, use triple backticks for fenced code blocks. Each block can be copied, and—if assistant features are enabled—users can request explanations.

You may specify the language for highlighting:

\`\`\`\`text
\`\`\`java
class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`
\`\`\`\`

\`\`\`java
class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

## Highlighting Diffs

Show a visual diff of added or removed lines in your code blocks. Added lines are highlighted in green and removed lines are highlighted in red. Set the language to \`diff\` and prefix each changed line with \`+\` or \`-\`:

\`\`\`\`text
\`\`\`diff
function calculateTotal(items) {
-  return items.reduce((sum, item) => sum + item.price, 0);
+  const total = items.reduce((sum, item) => sum + item.price, 0);
+  return Math.round(total * 100) / 100;
}
\`\`\`
\`\`\`\`

\`\`\`diff
function calculateTotal(items) {
-  return items.reduce((sum, item) => sum + item.price, 0);
+  const total = items.reduce((sum, item) => sum + item.price, 0);
+  return Math.round(total * 100) / 100;
}
\`\`\`

## File Names

Add a \`title\` to a code block to display a file name in the window bar, styled to match the GitHub-style header. Pass it through the \`<Code />\` component:

\`\`\`text
<Code title="package.json" language="json" code={\`{\\n  "name": "my-app",\\n  "version": "1.0.0"\\n}\`} />
\`\`\`

<Code title="package.json" language="json" code={\`{\\n  "name": "my-app",\\n  "version": "1.0.0"\\n}\`} />

## Tabbed Code Blocks

Use \`<CodeTabs />\` to show several variants of the same snippet - for example the same install command across package managers. Each tab is a keyboard-accessible button, and the copy button copies whichever tab is active. Each tab may set a \`language\` for highlighting (defaults to \`bash\`).

\`\`\`text
<CodeTabs tabs={[{ label: "npm", code: "npm install doccupine" }, { label: "pnpm", code: "pnpm add doccupine" }, { label: "yarn", code: "yarn add doccupine" }]} />
\`\`\`

<CodeTabs tabs={[{ label: "npm", code: "npm install doccupine" }, { label: "pnpm", code: "pnpm add doccupine" }, { label: "yarn", code: "yarn add doccupine" }]} />`;
