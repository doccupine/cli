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

~~~text
\`\`\`java
class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`
~~~


\`\`\`java
class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\``;
