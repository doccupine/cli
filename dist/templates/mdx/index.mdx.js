export const indexMdxTemplate = `---
title: "Getting Started"
description: "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease."
date: "2025-01-15"
category: "General"
categoryOrder: 0
order: 0
---
# Welcome to Doccupine
Using Doccupine, you simply create your documentation in MDX files with traditional Markdown syntax, Doccupine monitors your changes automatically generating a beautiful, modern documentation website.

## Getting Started

To get started with Doccupine, make sure you have [Node.js](https://nodejs.org) and npm installed on your machine. Then, follow these steps:

- **Run Doccupine CLI:**

Create a new directory for your project and navigate to it in your terminal. Run the following command to create a new Doccupine project:

\`\`\`bash
npx doccupine
\`\`\`

Once you run the command, Doccupine will ask you to select a directory to store your MDX files. Choose the directory where you want to create your documentation files.
After selecting the directory, Doccupine will ask you to enter the name of the directory for the generated website. Enter the name of the directory where you want to create your website.

This will start the development server on port 3000. Open your browser and navigate to http://localhost:3000 to view your documentation.

## Start documenting
Start documenting your project by editing the **index.mdx** file in the choosen MDX directory, this is the home page of your documentation website.

In your MDX directory, you can structure your content using folders and files. Doccupine will automatically generate a navigation menu based on the configured categories and order.
`;
