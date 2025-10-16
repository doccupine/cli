export const accordionMdxTemplate = `---
title: "Accordion"
description: "Interactive panels for toggling visibility of content."
date: "2025-01-15"
category: "Components"
categoryOrder: 1
order: 4
---
# Accordion
Interactive panels for toggling visibility of content.

Accordion elements help organize information by letting users show or hide sections as needed. They’re an effective way to manage progressive disclosure and simplify navigation through dense or optional content.

## Accordion Usage
You can use the Accordion component directly within your MDX files without any import. The following example shows a basic usage:

~~~mdx
<Accordion title="What is MDX?">
    You can put any content in here, including other components, like code:

   \`\`\`java HelloWorld.java
    class HelloWorld {
        public static void main(String[] args) {
            System.out.println("Hello, World!");
        }
    }
  \`\`\`
</Accordion>
~~~

<Accordion title="What is MDX?">
    You can put any content in here, including other components, like code:

   \`\`\`java HelloWorld.java
    class HelloWorld {
        public static void main(String[] args) {
            System.out.println("Hello, World!");
        }
    }
  \`\`\`
</Accordion>

## Properties

<Field value="title" type="string" required>
  The title of the accordion.
</Field>

<Field value="children" type="node" required>
  The content of the accordion.
</Field>`;
