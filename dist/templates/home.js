export const homeTemplate = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";

const content = \`# Welcome to Doccupine

Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. Using Doccupine, you simply create your documentation in MDX files with traditional Markdown syntax, Doccupine monitors your changes automatically generating a beautiful, modern documentation website.

## Open Source and Extensible
Doccupine is built on open standards, enabling customization and extensibility for different documentation needs. You stay in control of your content, with the option to host docs yourself and tailor the website’s look and features to match your organization’s requirements.

## Getting Started

To get started with Doccupine, make sure you have [Node.js](https://nodejs.org) and npm installed on your machine. Then, follow these steps:

- **Run Doccupine CLI:**

Create a new directory for your project and navigate to it in your terminal. Run the following command to create a new Doccupine project:

~~~bash
npx doccupine
~~~

Once you run the command, Doccupine will ask you to select a directory to store your MDX files. Choose the directory where you want to create your documentation files.
After selecting the directory, Doccupine will ask you to enter the name of the directory for the generated website. Enter the name of the directory where you want to create your website.

This will start the development server on port 3000. Open your browser and navigate to http://localhost:3000 to view your documentation.

- **Generate the website:**

~~~bash
npx doccupine build
~~~

This will generate the build files for your documentation website without starting the development server. You can then deploy the generated files to a hosting service of your choice.

## Features

- 📝 Markdown-based content
- 📦 Built-in file structure
- ⚡ Live Preview & Auto-Update
- 🚀 Easy Deployment

## Start documenting
Start documenting your project by creating a new **index.mdx** file in the choosen MDX directory. You can use the following template as a starting point:

~~~text
---
title: "Home"
description: "This is my first Doccupine project"
date: "2025-01-15"
category: "General"
categoryOrder: 0
order: 0
---

# Home

This is some **markdown** content with MDX support.
~~~

In your MDX directory, you can structure your content using folders and files. Doccupine will automatically generate a navigation menu based on the configured categories and order.
\`;

export const metadata: Metadata = {
  title: 'Welcome to Doccupine',
  description: 'Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease.',
};

export default function Page() {
  return (
    <Docs content={content} />
  );
}
`;
