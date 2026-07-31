export const apiPlaygroundUtilsTemplate = `import type {
  OperationDescriptor,
  ParameterDescriptor,
  ServerDescriptor,
} from "@/types/openapi";

export interface PlaygroundResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  contentType: string | null;
  bodyEncoding: "utf8" | "base64";
  body: string;
  truncated: boolean;
  byteLength: number;
  durationMs: number;
}

export interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  body: string | null;
  secretHeaderNames: string[];
}

export function schemaTypeLabel(schema: unknown): string {
  if (schema && typeof schema === "object") {
    const record = schema as { type?: unknown; format?: unknown };
    if (typeof record.type === "string") {
      return typeof record.format === "string"
        ? record.type + " (" + record.format + ")"
        : record.type;
    }
  }
  return "string";
}

export function serverBase(server: ServerDescriptor | undefined): string {
  if (!server) return "";
  let url = server.url;
  const variables = server.variables;
  if (variables) {
    for (const key of Object.keys(variables)) {
      url = url.split("{" + key + "}").join(variables[key].default);
    }
  }
  while (url.endsWith("/")) url = url.slice(0, -1);
  return url;
}

export function applyPathParams(
  template: string,
  values: Record<string, string>,
): string {
  let result = template;
  for (const key of Object.keys(values)) {
    result = result
      .split("{" + key + "}")
      .join(encodeURIComponent(values[key]));
  }
  return result;
}

export function firstJsonExample(op: OperationDescriptor): {
  contentType: string;
  text: string;
} | null {
  if (!op.requestBody || op.requestBody.content.length === 0) return null;
  const media =
    op.requestBody.content.find((m) => m.contentType.includes("json")) ??
    op.requestBody.content[0];
  let text = "";
  if (media.example !== undefined) {
    try {
      text = JSON.stringify(media.example, null, 2);
    } catch {
      text = "";
    }
  }
  return { contentType: media.contentType, text };
}

export function classifyResponse(
  contentType: string | null,
): "image" | "video" | "audio" | "text" | "binary" {
  if (!contentType) return "text";
  const t = contentType.toLowerCase();
  if (t.startsWith("image/") && !t.includes("svg")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (
    t.includes("json") ||
    t.startsWith("text/") ||
    t.includes("xml") ||
    t.includes("svg") ||
    t.includes("html") ||
    t.includes("javascript") ||
    t.includes("csv")
  ) {
    return "text";
  }
  return "binary";
}

export function codeLanguage(contentType: string | null): string {
  if (!contentType) return "text";
  const t = contentType.toLowerCase();
  if (t.includes("json")) return "json";
  if (t.includes("html")) return "html";
  if (t.includes("xml") || t.includes("svg")) return "xml";
  if (t.includes("javascript")) return "javascript";
  return "text";
}

export function prettyBody(contentType: string | null, body: string): string {
  if (contentType && contentType.toLowerCase().includes("json")) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body;
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const LOCATIONS: ParameterDescriptor["in"][] = [
  "path",
  "query",
  "header",
  "cookie",
];

export const LOCATION_TITLES: Record<string, string> = {
  path: "Path",
  query: "Query",
  header: "Headers",
  cookie: "Cookies",
};
`;
