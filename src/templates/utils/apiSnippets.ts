export const apiSnippetsTemplate = `// Pure, isomorphic request-to-snippet generators for the API playground.
// Given the fully-resolved request, produce copy-pasteable cURL / fetch /
// requests examples. Secret redaction is the caller's responsibility: pass
// already-redacted header values when secrets should not appear.

export interface SnippetRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string | null;
}

export type SnippetLanguage = "curl" | "javascript" | "python";

export interface SnippetTab {
  label: string;
  code: string;
  language: string;
}

// A literal backslash, built without writing one (keeps escaping simple).
const BACKSLASH = String.fromCharCode(92);

// POSIX single-quote a shell argument: wrap in quotes, and represent any inner
// single quote as '\\'' by ending the quote, adding an escaped quote, reopening.
function shellQuote(value: string): string {
  const escaped = value.split("'").join("'" + BACKSLASH + "''");
  return "'" + escaped + "'";
}

function toCurl(req: SnippetRequest): string {
  const parts: string[] = ["curl", "-X", req.method, shellQuote(req.url)];
  for (const [key, value] of Object.entries(req.headers)) {
    parts.push("-H", shellQuote(key + ": " + value));
  }
  if (req.body) {
    parts.push("--data", shellQuote(req.body));
  }
  return parts.join(" ");
}

function toFetch(req: SnippetRequest): string {
  const options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  } = { method: req.method };
  if (Object.keys(req.headers).length > 0) options.headers = req.headers;
  if (req.body) options.body = req.body;
  return (
    "const response = await fetch(" +
    JSON.stringify(req.url) +
    ", " +
    JSON.stringify(options, null, 2) +
    ");"
  );
}

function toPython(req: SnippetRequest): string {
  const lines: string[] = ["import requests", ""];
  lines.push("response = requests." + req.method.toLowerCase() + "(");
  lines.push("    " + JSON.stringify(req.url) + ",");
  if (Object.keys(req.headers).length > 0) {
    lines.push("    headers=" + JSON.stringify(req.headers) + ",");
  }
  if (req.body) {
    lines.push("    data=" + JSON.stringify(req.body) + ",");
  }
  lines.push(")");
  lines.push("print(response.status_code, response.text)");
  return lines.join("\\n");
}

export function buildSnippets(
  req: SnippetRequest,
  languages: SnippetLanguage[],
): SnippetTab[] {
  const tabs: SnippetTab[] = [];
  for (const language of languages) {
    if (language === "curl") {
      tabs.push({ label: "cURL", code: toCurl(req), language: "bash" });
    } else if (language === "javascript") {
      tabs.push({
        label: "JavaScript",
        code: toFetch(req),
        language: "javascript",
      });
    } else if (language === "python") {
      tabs.push({ label: "Python", code: toPython(req), language: "python" });
    }
  }
  return tabs;
}
`;
