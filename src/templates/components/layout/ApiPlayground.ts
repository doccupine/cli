export const apiPlaygroundTemplate = `"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import {
  styledSmall,
  interactiveStyles,
  Input,
  Textarea,
  Modal,
} from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import { Code, CodeTabs } from "@/components/layout/Code";
import { Icon } from "@/components/layout/Icon";
import { Accordion } from "@/components/layout/Accordion";
import { CopyButton } from "@/components/layout/CopyButton";
import { Spinner } from "@/components/Spinner";
import { matchAllowlist, matchAllowlistIn } from "@/utils/playgroundAllowlist";
import type { AllowlistEntry } from "@/utils/playgroundAllowlist";
import { buildSnippets } from "@/utils/apiSnippets";
import type { SnippetLanguage } from "@/utils/apiSnippets";
import type {
  OperationDescriptor,
  ParameterDescriptor,
  ServerDescriptor,
} from "@/types/openapi";

interface PlaygroundResponse {
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

interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  body: string | null;
  secretHeaderNames: string[];
}

export interface ApiPlaygroundProps {
  operation: OperationDescriptor;
  defaultMode?: "proxy" | "direct";
  allowDirect?: boolean;
  // Extra client-side allowlist entries. The server proxy always enforces the
  // build-time allowlist regardless; this only relaxes the client pre-flight
  // (used by the docs demo to run in direct mode without a configured spec).
  allowlist?: AllowlistEntry[];
  snippetLanguages?: SnippetLanguage[];
}

const METHOD_TOKENS: Record<string, keyof Theme["colors"]> = {
  get: "info",
  post: "success",
  put: "warning",
  patch: "warning",
  delete: "error",
  head: "gray",
  options: "gray",
  trace: "gray",
};

function methodColor(theme: Theme, method: string): string {
  const token = METHOD_TOKENS[method.toLowerCase()] ?? "gray";
  return theme.colors[token];
}

function schemaTypeLabel(schema: unknown): string {
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

function serverBase(server: ServerDescriptor | undefined): string {
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

function applyPathParams(
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

function firstJsonExample(op: OperationDescriptor): {
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

function classifyResponse(
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

function codeLanguage(contentType: string | null): string {
  if (!contentType) return "text";
  const t = contentType.toLowerCase();
  if (t.includes("json")) return "json";
  if (t.includes("html")) return "html";
  if (t.includes("xml") || t.includes("svg")) return "xml";
  if (t.includes("javascript")) return "javascript";
  return "text";
}

function prettyBody(contentType: string | null, body: string): string {
  if (contentType && contentType.toLowerCase().includes("json")) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function renderPath(path: string): React.ReactNode {
  return path
    .split(/(\\{[^}]+\\})/g)
    .map((part, index) =>
      part.startsWith("{") ? (
        <PathParam key={index}>{part}</PathParam>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
}

const LOCATIONS: ParameterDescriptor["in"][] = [
  "path",
  "query",
  "header",
  "cookie",
];

const LOCATION_TITLES: Record<string, string> = {
  path: "Path",
  query: "Query",
  header: "Headers",
  cookie: "Cookies",
};

/* ---------- compact bar ---------- */

const CompactBar = styled.div\`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 8px 8px 8px 12px;
  border: solid 1px \${({ theme }: { theme: Theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.lg};
  background: \${({ theme }: { theme: Theme }) => theme.colors.light};
\`;

const MethodBadge = styled.span<{ theme: Theme; $method: string }>\`
  font-family: \${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: \${({ theme }) => theme.colors.surface};
  background: \${({ theme, $method }) => methodColor(theme, $method)};
  padding: 0 4px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  flex-shrink: 0;
\`;

const PathText = styled.span\`
  flex: 1;
  min-width: 0;
  font-family: \${({ theme }: { theme: Theme }) => theme.fonts.mono};
  font-weight: 600;
  font-size: 14px;
  color: \${({ theme }: { theme: Theme }) => theme.colors.dark};
  overflow-x: auto;
  white-space: nowrap;
  &::-webkit-scrollbar {
    display: none;
  }
\`;

const PathParam = styled.span\`
  font-family: \${({ theme }: { theme: Theme }) => theme.fonts.mono};
  background: \${({ theme }: { theme: Theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
  color: \${({ theme }: { theme: Theme }) => theme.colors.dark};
  padding: 2px 4px;
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.xs};
  overflow-wrap: anywhere;
\`;

const AccentButton = styled.button<{ theme: Theme }>\`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-family: \${({ theme }: { theme: Theme }) => theme.fonts.text};
  font-weight: 600;
  font-size: 14px;
  color: \${({ theme }: { theme: Theme }) => theme.colors.surface};
  background: \${({ theme }: { theme: Theme }) => theme.colors.primary};
  border: none;
  padding: 8px 14px;
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.xs};
  \${interactiveStyles};

  & svg {
    color: \${({ theme }: { theme: Theme }) => theme.colors.surface};
    stroke: \${({ theme }: { theme: Theme }) => theme.colors.surface};
  }

  &:hover {
    background: \${({ theme }: { theme: Theme }) => theme.colors.primaryDark};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
\`;

/* ---------- modal ---------- */

const DialogHeader = styled.div\`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 5px 0 0 0;
\`;

const PathBar = styled.div\`
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  border: solid 1px \${({ theme }: { theme: Theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.xs};
  background: \${({ theme }: { theme: Theme }) => theme.colors.light};
\`;

const DialogBody = styled.div\`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 0;
  margin: 20px 0 0 0;

  \${mq("lg")} {
    grid-template-columns: 1fr 1fr;
  }
\`;

const Column = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
\`;

const Description = styled.p\`
  margin: 0;
  \${({ theme }: { theme: Theme }) => styledSmall(theme)};
  color: \${({ theme }: { theme: Theme }) => theme.colors.grayDark};
\`;

const Toolbar = styled.div\`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
\`;

const Toggle = styled.button<{ theme: Theme; $active?: boolean }>\`
  position: relative;
  cursor: pointer;
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1;
  color: \${({ theme }) => theme.colors.accent};
  display: flex;
  gap: 6px;
  transition: all 0.3s ease;
  font-weight: 600;
  white-space: nowrap;
  min-width: fit-content;
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 10%, transparent)\`};
  padding: 6px 8px;
  border: none;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  \${interactiveStyles};

  \${({ $active, theme }) =>
    $active &&
    css\`
      background: \${theme.colors.primary};
      color: \${theme.colors.surface};
    \`}
\`;

/* ---------- collapsible card ---------- */

const Card = styled.div\`
  border: solid 1px \${({ theme }: { theme: Theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.lg};
  overflow: hidden;
\`;

const CardHead = styled.button\`
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: \${({ theme }: { theme: Theme }) => theme.colors.dark};
  \${({ theme }: { theme: Theme }) => styledSmall(theme)};
\`;

const Inline = styled.span\`
  display: inline-flex;
  align-items: center;
  gap: 8px;
\`;

const CardBody = styled.div\`
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
\`;

/* ---------- fields ---------- */

// Wraps an accordion section's content and insets it, so full-width inputs'
// focus rings (a 4px box-shadow) are not clipped by the accordion's own
// overflow. Keeps the accordion component untouched.
const SectionInner = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
\`;

const Field = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 6px;
\`;

const FieldHead = styled.div\`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  \${({ theme }: { theme: Theme }) => styledSmall(theme)};
\`;

const FieldName = styled.span\`
  font-family: \${({ theme }: { theme: Theme }) => theme.fonts.mono};
  font-weight: 600;
  color: \${({ theme }: { theme: Theme }) => theme.colors.dark};
\`;

const TypeChip = styled.span\`
  font-family: \${({ theme }: { theme: Theme }) => theme.fonts.mono};
  color: \${({ theme }: { theme: Theme }) => theme.colors.grayDark};
  background: \${({ theme }: { theme: Theme }) =>
    \`color-mix(in srgb, \${theme.colors.gray} 15%, transparent)\`};
  padding: 0 4px;
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.xs};
\`;

const RequiredChip = styled.span\`
  font-family: \${({ theme }: { theme: Theme }) => theme.fonts.mono};
  color: \${({ theme }: { theme: Theme }) => theme.colors.error};
\`;

const FieldDesc = styled.p\`
  margin: 0;
  width: 100%;
  \${({ theme }: { theme: Theme }) => styledSmall(theme)};
  color: \${({ theme }: { theme: Theme }) => theme.colors.gray};
\`;

/* ---------- response ---------- */

const StatusPill = styled.span<{ theme: Theme; $ok: boolean }>\`
  font-family: \${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  color: \${({ theme }) => theme.colors.surface};
  background: \${({ theme, $ok }) =>
    $ok ? theme.colors.success : theme.colors.error};
  padding: 0 4px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
\`;

const Meta = styled.span\`
  \${({ theme }: { theme: Theme }) => styledSmall(theme)};
  color: \${({ theme }: { theme: Theme }) => theme.colors.gray};
\`;

const ErrorText = styled.p\`
  margin: 0;
  \${({ theme }: { theme: Theme }) => styledSmall(theme)};
  color: \${({ theme }: { theme: Theme }) => theme.colors.error};
\`;

const Placeholder = styled.div\`
  border: dashed 1px \${({ theme }: { theme: Theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.lg};
  padding: 24px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  \${({ theme }: { theme: Theme }) => styledSmall(theme)};
  color: \${({ theme }: { theme: Theme }) => theme.colors.gray};
\`;

// Holds the response (or empty placeholder) and lets the loading spinner sit on
// top of it, so a re-send keeps the previous content in place instead of
// collapsing and jumping the layout.
const ResponseArea = styled.div\`
  position: relative;
\`;

const LoadingOverlay = styled.div\`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: solid 1px \${({ theme }: { theme: Theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.lg};
  color: \${({ theme }: { theme: Theme }) => theme.colors.grayDark};
  background: \${({ theme }: { theme: Theme }) =>
    \`color-mix(in srgb, \${theme.colors.light} 60%, transparent)\`};
  backdrop-filter: blur(1px);
\`;

const ResponseMedia = styled.img\`
  max-width: 100%;
  border-radius: \${({ theme }: { theme: Theme }) => theme.spacing.radius.xs};
\`;

export function ApiPlayground({
  operation,
  defaultMode = "proxy",
  allowDirect = true,
  allowlist,
  snippetLanguages = ["curl", "javascript", "python"],
}: ApiPlaygroundProps) {
  const [open, setOpen] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [authValues, setAuthValues] = useState<Record<string, string>>({});
  const initialBody = useMemo(() => firstJsonExample(operation), [operation]);
  const [bodyText, setBodyText] = useState(initialBody?.text ?? "");
  const [mode, setMode] = useState<"proxy" | "direct">(defaultMode);
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [corsRetry, setCorsRetry] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const paramKey = (p: ParameterDescriptor) => p.in + ":" + p.name;

  const isAllowed = useCallback(
    (url: string) =>
      Boolean(
        matchAllowlist(url) ??
        (allowlist ? matchAllowlistIn(allowlist, url) : null),
      ),
    [allowlist],
  );

  const buildRequest = useCallback((): BuiltRequest => {
    const base = serverBase(operation.servers[0]);
    const pathValues: Record<string, string> = {};
    const queryParts: string[] = [];
    const headers: Record<string, string> = {};
    const secretHeaderNames: string[] = [];
    let cookie = "";

    for (const param of operation.parameters) {
      const value = paramValues[paramKey(param)];
      if (value === undefined || value === "") continue;
      if (param.in === "path") pathValues[param.name] = value;
      else if (param.in === "query")
        queryParts.push(
          encodeURIComponent(param.name) + "=" + encodeURIComponent(value),
        );
      else if (param.in === "header") headers[param.name] = value;
      else if (param.in === "cookie")
        cookie += (cookie ? "; " : "") + param.name + "=" + value;
    }

    for (const requirement of operation.security) {
      const scheme = requirement.scheme;
      if (!scheme) continue;
      if (scheme.type === "apiKey" && scheme.name) {
        const value = authValues[requirement.schemeName];
        if (!value) continue;
        if (scheme.in === "header") {
          headers[scheme.name] = value;
          secretHeaderNames.push(scheme.name);
        } else if (scheme.in === "query") {
          queryParts.push(
            encodeURIComponent(scheme.name) + "=" + encodeURIComponent(value),
          );
        } else if (scheme.in === "cookie") {
          cookie += (cookie ? "; " : "") + scheme.name + "=" + value;
        }
      } else if (scheme.type === "http" && scheme.scheme === "basic") {
        const user = authValues[requirement.schemeName + ":user"] ?? "";
        const pass = authValues[requirement.schemeName + ":pass"] ?? "";
        if (user || pass) {
          headers["Authorization"] = "Basic " + btoa(user + ":" + pass);
          secretHeaderNames.push("Authorization");
        }
      } else {
        const token = authValues[requirement.schemeName];
        if (token) {
          headers["Authorization"] = "Bearer " + token;
          secretHeaderNames.push("Authorization");
        }
      }
    }

    if (cookie) headers["Cookie"] = cookie;

    const hasBody =
      operation.requestBody !== undefined &&
      operation.method !== "get" &&
      operation.method !== "head" &&
      bodyText.trim() !== "";
    if (hasBody && !headers["Content-Type"] && initialBody) {
      headers["Content-Type"] = initialBody.contentType;
    }

    const query = queryParts.join("&");
    const url =
      base +
      applyPathParams(operation.path, pathValues) +
      (query ? "?" + query : "");

    return { url, headers, body: hasBody ? bodyText : null, secretHeaderNames };
  }, [operation, paramValues, authValues, bodyText, initialBody]);

  const snippets = useMemo(() => {
    const built = buildRequest();
    const headers: Record<string, string> = { ...built.headers };
    if (!showSecrets) {
      for (const name of built.secretHeaderNames) {
        headers[name] = "<YOUR_CREDENTIALS>";
      }
    }
    return buildSnippets(
      {
        method: operation.method.toUpperCase(),
        url: built.url || operation.path,
        headers,
        body: built.body,
      },
      snippetLanguages,
    );
  }, [buildRequest, showSecrets, operation, snippetLanguages]);

  const sendProxy = useCallback(
    async (
      built: BuiltRequest,
      signal: AbortSignal,
    ): Promise<PlaygroundResponse> => {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          targetUrl: built.url,
          method: operation.method.toUpperCase(),
          headers: built.headers,
          body: built.body ?? undefined,
          bodyEncoding: "utf8",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Request failed",
        );
      }
      return data as PlaygroundResponse;
    },
    [operation],
  );

  const sendDirect = useCallback(
    async (
      built: BuiltRequest,
      signal: AbortSignal,
    ): Promise<PlaygroundResponse> => {
      const start = Date.now();
      const res = await fetch(built.url, {
        method: operation.method.toUpperCase(),
        headers: built.headers,
        body: built.body ?? undefined,
        signal,
      });
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type");
      const isText = classifyResponse(contentType) === "text";
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return {
        status: res.status,
        statusText: res.statusText,
        headers,
        contentType,
        bodyEncoding: isText ? "utf8" : "base64",
        body: isText
          ? new TextDecoder().decode(buffer)
          : bufferToBase64(buffer),
        truncated: false,
        byteLength: buffer.byteLength,
        durationMs: Date.now() - start,
      };
    },
    [operation],
  );

  const send = useCallback(async () => {
    setError(null);
    setCorsRetry(false);
    // Keep any previous response on screen; the loading overlay covers it so
    // the layout does not collapse and jump while the new request is in flight.

    const built = buildRequest();
    if (!built.url) {
      setError("No server URL is configured for this endpoint.");
      return;
    }
    if (!isAllowed(built.url)) {
      setError("This endpoint's server is not in the allowed list.");
      return;
    }
    if (
      mode === "direct" &&
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      built.url.startsWith("http:")
    ) {
      setError(
        "Browsers block HTTP requests from an HTTPS page. Use proxy mode.",
      );
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const result =
        mode === "direct"
          ? await sendDirect(built, controller.signal)
          : await sendProxy(built, controller.signal);
      setResponse(result);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (mode === "direct" && err instanceof TypeError) {
        setCorsRetry(true);
        setError(
          "The browser blocked this cross-origin request (CORS). Run it server-side instead.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [buildRequest, isAllowed, mode, sendDirect, sendProxy]);

  const retryViaProxy = useCallback(() => {
    setMode("proxy");
    setCorsRetry(false);
    void send();
  }, [send]);

  const groupedParams = LOCATIONS.map((location) => ({
    location,
    params: operation.parameters.filter((p) => p.in === location),
  })).filter((group) => group.params.length > 0);
  // Only the first visible section starts expanded.
  const hasAuth = operation.security.length > 0;

  const responseKind = response ? classifyResponse(response.contentType) : null;
  const mediaSrc =
    response && responseKind && responseKind !== "text"
      ? "data:" +
        (response.contentType ?? "application/octet-stream") +
        ";base64," +
        response.body
      : "";

  const renderParamField = (param: ParameterDescriptor) => (
    <Field key={param.anchorId}>
      <FieldHead>
        <FieldName>{param.name}</FieldName>
        <TypeChip>{schemaTypeLabel(param.schema)}</TypeChip>
        {param.required ? <RequiredChip>required</RequiredChip> : null}
      </FieldHead>
      {param.description ? <FieldDesc>{param.description}</FieldDesc> : null}
      <Input
        $fullWidth
        type="text"
        aria-label={param.name}
        placeholder={
          param.example !== undefined
            ? String(param.example)
            : "enter " + param.name
        }
        value={paramValues[paramKey(param)] ?? ""}
        onChange={(e) =>
          setParamValues((prev) => ({
            ...prev,
            [paramKey(param)]: e.target.value,
          }))
        }
      />
    </Field>
  );

  return (
    <>
      <CompactBar>
        <MethodBadge $method={operation.method}>{operation.method}</MethodBadge>
        <PathText>{renderPath(operation.path)}</PathText>
        <CopyButton
          text={operation.method.toUpperCase() + " " + operation.path}
          label="Copy endpoint"
          size={16}
        />
        <AccentButton type="button" onClick={() => setOpen(true)}>
          Try it
          <Icon name="play" size={14} />
        </AccentButton>
      </CompactBar>

      <Modal
        $isOpen={open}
        $onClose={() => setOpen(false)}
        $width={1120}
        $title={
          operation.summary ??
          operation.method.toUpperCase() + " " + operation.path
        }
      >
        <DialogHeader>
          <PathBar>
            <MethodBadge $method={operation.method}>
              {operation.method}
            </MethodBadge>
            <PathText>{renderPath(operation.path)}</PathText>
            <AccentButton
              type="button"
              onClick={() => void send()}
              disabled={loading}
            >
              Send
              {loading ? <Spinner size={14} /> : <Icon name="play" size={14} />}
            </AccentButton>
          </PathBar>
        </DialogHeader>

        <DialogBody>
          <Column>
            {operation.description || operation.summary ? (
              <Description>
                {operation.description ?? operation.summary}
              </Description>
            ) : null}

            <Toolbar>
              {operation.servers.length > 0 ? (
                <Meta>{serverBase(operation.servers[0])}</Meta>
              ) : null}
              {allowDirect ? (
                <>
                  <Toggle
                    type="button"
                    $active={mode === "proxy"}
                    onClick={() => setMode("proxy")}
                  >
                    Proxy
                  </Toggle>
                  <Toggle
                    type="button"
                    $active={mode === "direct"}
                    onClick={() => setMode("direct")}
                  >
                    Direct
                  </Toggle>
                </>
              ) : null}
              <Toggle
                type="button"
                $active={showSecrets}
                onClick={() => setShowSecrets((v) => !v)}
              >
                {showSecrets ? "Hide secrets" : "Show secrets"}
              </Toggle>
            </Toolbar>

            {operation.security.length > 0 ? (
              <Accordion title="Authorization" defaultOpen>
                <SectionInner>
                  {operation.security.map((requirement) => {
                    const scheme = requirement.scheme;
                    if (
                      scheme &&
                      scheme.type === "http" &&
                      scheme.scheme === "basic"
                    ) {
                      return (
                        <Field key={requirement.schemeName}>
                          <FieldHead>
                            <FieldName>{requirement.schemeName}</FieldName>
                            <TypeChip>basic</TypeChip>
                          </FieldHead>
                          <Input
                            $fullWidth
                            type="text"
                            aria-label={requirement.schemeName + " username"}
                            placeholder="username"
                            value={
                              authValues[requirement.schemeName + ":user"] ?? ""
                            }
                            onChange={(e) =>
                              setAuthValues((prev) => ({
                                ...prev,
                                [requirement.schemeName + ":user"]:
                                  e.target.value,
                              }))
                            }
                          />
                          <Input
                            $fullWidth
                            type={showSecrets ? "text" : "password"}
                            aria-label={requirement.schemeName + " password"}
                            placeholder="password"
                            value={
                              authValues[requirement.schemeName + ":pass"] ?? ""
                            }
                            onChange={(e) =>
                              setAuthValues((prev) => ({
                                ...prev,
                                [requirement.schemeName + ":pass"]:
                                  e.target.value,
                              }))
                            }
                          />
                        </Field>
                      );
                    }
                    const chip =
                      scheme?.type === "apiKey"
                        ? "apiKey"
                        : scheme?.scheme === "bearer"
                          ? "bearer"
                          : (scheme?.type ?? "token");
                    return (
                      <Field key={requirement.schemeName}>
                        <FieldHead>
                          <FieldName>{requirement.schemeName}</FieldName>
                          <TypeChip>{chip}</TypeChip>
                          <RequiredChip>required</RequiredChip>
                        </FieldHead>
                        <Input
                          $fullWidth
                          type={showSecrets ? "text" : "password"}
                          aria-label={requirement.schemeName}
                          placeholder={
                            chip === "bearer"
                              ? "enter bearer token"
                              : "enter value"
                          }
                          value={authValues[requirement.schemeName] ?? ""}
                          onChange={(e) =>
                            setAuthValues((prev) => ({
                              ...prev,
                              [requirement.schemeName]: e.target.value,
                            }))
                          }
                        />
                      </Field>
                    );
                  })}
                </SectionInner>
              </Accordion>
            ) : null}

            {groupedParams.map((group, index) => (
              <Accordion
                key={group.location}
                title={LOCATION_TITLES[group.location]}
                defaultOpen={!hasAuth && index === 0}
              >
                <SectionInner>
                  {group.params.map(renderParamField)}
                </SectionInner>
              </Accordion>
            ))}

            {operation.requestBody &&
            operation.method !== "get" &&
            operation.method !== "head" ? (
              <Accordion
                title="Body"
                defaultOpen={!hasAuth && groupedParams.length === 0}
              >
                <SectionInner>
                  <Textarea
                    $fullWidth
                    rows={8}
                    aria-label="Request body"
                    spellCheck={false}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                  />
                </SectionInner>
              </Accordion>
            ) : null}

            {error ? (
              <Field>
                <ErrorText>{error}</ErrorText>
                {corsRetry ? (
                  <Toggle type="button" onClick={retryViaProxy}>
                    Retry via proxy
                  </Toggle>
                ) : null}
              </Field>
            ) : null}
          </Column>

          <Column>
            <ResponseArea>
              {response ? (
                <Card>
                  <CardHead as="div">
                    <Inline>
                      <StatusPill
                        $ok={response.status >= 200 && response.status < 400}
                      >
                        {response.status} {response.statusText}
                      </StatusPill>
                      <Meta>{response.durationMs}ms</Meta>
                      <Meta>{response.byteLength} bytes</Meta>
                      {response.truncated ? <Meta>(truncated)</Meta> : null}
                    </Inline>
                  </CardHead>
                  <CardBody>
                    {responseKind === "image" ? (
                      <ResponseMedia src={mediaSrc} alt="Response" />
                    ) : responseKind === "video" ? (
                      <video
                        controls
                        src={mediaSrc}
                        style={{ maxWidth: "100%" }}
                      />
                    ) : responseKind === "audio" ? (
                      <audio controls src={mediaSrc} />
                    ) : responseKind === "binary" ? (
                      <a href={mediaSrc} download>
                        Download response ({response.byteLength} bytes)
                      </a>
                    ) : (
                      <Code
                        language={codeLanguage(response.contentType)}
                        code={prettyBody(response.contentType, response.body)}
                      />
                    )}
                  </CardBody>
                </Card>
              ) : (
                <Placeholder>
                  Send the request to see the live response here.
                </Placeholder>
              )}
              {loading ? (
                <LoadingOverlay>
                  <Spinner size={22} />
                </LoadingOverlay>
              ) : null}
            </ResponseArea>

            {snippets.length > 0 ? <CodeTabs tabs={snippets} /> : null}
          </Column>
        </DialogBody>
      </Modal>
    </>
  );
}
`;
