export async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import("net");

  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

export function generateSlug(filePath: string): string {
  if (filePath === "index.mdx" || filePath === "./index.mdx") {
    return "";
  }

  const normalized = filePath
    .replace(/\.mdx$/, "")
    .replace(/\\/g, "/")
    .replace(/[^a-zA-Z0-9\/\-_]/g, "-")
    .toLowerCase();

  // Strip trailing /index for subdirectory index files
  if (normalized.endsWith("/index")) {
    return normalized.slice(0, -"/index".length);
  }

  return normalized;
}

export function getFullSlug(pageSlug: string, sectionSlug: string): string {
  if (!sectionSlug) return pageSlug;
  if (pageSlug === "") return sectionSlug;
  return `${sectionSlug}/${pageSlug}`;
}

export function escapeTemplateContent(content: string): string {
  return content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}
