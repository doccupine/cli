export const installTemplate = `import React from "react";
import { CodeTabs } from "@/components/layout/Code";

interface InstallProps {
  children?: React.ReactNode;
  /** The packages, when they are not written as the children. */
  packages?: string;
  /** Install as development dependencies. */
  dev?: boolean;
  /**
   * Run a package without installing it. The text is one command: the
   * package and any arguments after it ("doccupine build").
   */
  exec?: boolean;
}

// Each package manager's install command, plain and as a dev dependency,
// and its runner for a package it does not install (yarn dlx is Yarn 2+).
const MANAGERS: [label: string, install: string, dev: string, exec: string][] =
  [
    ["npm", "npm install", "npm install -D", "npx"],
    ["pnpm", "pnpm add", "pnpm add -D", "pnpm dlx"],
    ["yarn", "yarn add", "yarn add -D", "yarn dlx"],
    ["bun", "bun add", "bun add -d", "bunx"],
  ];

function extractText(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(extractText).join(" ");
  }
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return extractText(element.props.children);
  }
  return "";
}

/**
 * One install command per package manager, as code tabs, or with \`exec\`
 * one command that runs a package without installing it. The tabs share the
 * "package-manager" choice, so picking pnpm in one block switches every
 * block, on every page, and the pick is remembered. The server renders npm.
 */
function Install({
  children,
  packages,
  dev = false,
  exec = false,
}: InstallProps) {
  // Several packages to install, or one package and its arguments to run:
  // either way the words are kept in order, one space apart.
  const words = (packages ?? extractText(children))
    .split(/\\s+/)
    .filter(Boolean);
  if (words.length === 0) return null;
  const list = words.join(" ");
  const tabs = MANAGERS.map(([label, install, devInstall, runner]) => ({
    label,
    code: \`\${exec ? runner : dev ? devInstall : install} \${list}\`,
    language: "bash",
  }));
  return <CodeTabs tabs={tabs} syncKey="package-manager" />;
}

export { Install };
`;
