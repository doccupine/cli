export const tabsMdxTemplate = `---
title: "Tabs"
description: "Use the Tabs component to display different content sections in a switchable panel layout."
date: "2026-02-19"
category: "Components"
categoryOrder: 1
order: 5
---
# Tabs
Use the Tabs component to display different content sections in a switchable panel layout.

Tabs are useful for grouping related information while keeping the interface tidy. You can create as many tabs as needed, and each one can hold other components, text, or code snippets.

## Tabs Usage
You can use the Tabs component directly within your MDX files without any import. The following example shows a basic usage:

~~~mdx
<Tabs>
  <TabContent title="First tab">
    ☝️ This is the content shown only when the first tab is active.

    Tabs can include all kinds of components. For example, a simple Java program:
    \`\`\`java
      class HelloWorld {
          public static void main(String[] args) {
              System.out.println("Hello, World!");
          }
      }
    \`\`\`
  </TabContent>
  <TabContent title="Second tab">
    ✌️ Content inside this second tab is separate from the first.
  </TabContent>
  <TabContent title="Third tab">
    💪 This third tab contains its own unique content.
  </TabContent>
</Tabs>
~~~

<Tabs>
  <TabContent title="First tab">
    ☝️ This is the content shown only when the first tab is active.

    Tabs can include all kinds of components. For example, a simple Java program:
    \`\`\`java
    class HelloWorld {
        public static void main(String[] args) {
            System.out.println("Hello, World!");
        }
    }
    \`\`\`
  </TabContent>
  <TabContent title="Second tab" icon="leaf">
    ✌️ Content inside this second tab is separate from the first.
  </TabContent>
  <TabContent title="Third tab">
    💪 This third tab contains its own unique content.
  </TabContent>
</Tabs>

## Properties

<Field value="title" type="string">
  The title of the tab.
</Field>

<Field value="children" type="node" required>
  The content of the tabs.
</Field>`;
