export const apiPlaygroundTemplate = `"use client";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Code, CodeTabs } from "@/components/layout/Code";
import { Icon } from "@/components/layout/Icon";
import { Accordion } from "@/components/layout/Accordion";
import { Badge, httpMethodBadgeColor } from "@/components/layout/Badge";
import { Callout } from "@/components/layout/Callout";
import { CopyButton } from "@/components/layout/CopyButton";
import { Spinner } from "@/components/Spinner";
import { matchAllowlist, matchAllowlistIn } from "@/utils/playgroundAllowlist";
import type { AllowlistEntry } from "@/utils/playgroundAllowlist";
import { buildSnippets } from "@/utils/apiSnippets";
import type { SnippetLanguage } from "@/utils/apiSnippets";
import {
  LOCATIONS,
  LOCATION_TITLES,
  applyPathParams,
  bufferToBase64,
  classifyResponse,
  codeLanguage,
  firstJsonExample,
  prettyBody,
  schemaTypeLabel,
  serverBase,
} from "@/utils/apiPlayground";
import type { BuiltRequest, PlaygroundResponse } from "@/utils/apiPlayground";
import type { OperationDescriptor, ParameterDescriptor } from "@/types/openapi";

// Styles: app/styles/design.css (.dcp-playground, .dcp-playground-modal,
// .dcp-input, .dcp-textarea).

/* ---------- form controls ---------- */

// A full-width text input and textarea, adapted from cherry-styled-components
// (MIT): the same wrapper markup, so they lay out exactly as before.
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="dcp-input-wrap">
      <span className="dcp-input-box">
        <input {...props} className="dcp-input" />
      </span>
    </span>
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <span className="dcp-input-wrap">
      <textarea {...props} className="dcp-textarea" />
    </span>
  );
}

/* ---------- modal ---------- */

// Hydration-safe client detection, so the portal only renders after
// hydration (the server render has no document.body to portal into).
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface PlaygroundModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// The request dialog: a native modal <dialog> (top layer, the rest of the
// page inert, focus moved onto the card and handed back to the opener on
// close),
// portaled to <body> so the article's prose rules do not reach it. It mounts
// on open and unmounts once its exit animation ends, so the form resets
// between openings. Escape and a press outside the card close it. Adapted
// from cherry-styled-components' Modal (MIT).
function PlaygroundModal({
  open,
  onClose,
  title,
  children,
}: PlaygroundModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isClient = useIsClient();
  // Stays true while the exit animation plays; flips in the animationend
  // handler, an event callback rather than an effect.
  const [shouldRender, setShouldRender] = useState(open);
  if (open && !shouldRender) setShouldRender(true);
  const isClosing = !open && shouldRender;

  const finish = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setShouldRender(false);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) opener.focus();
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      // Focus the card itself rather than its first control, so opening
      // draws no focus ring; Tab then moves through the dialog.
      cardRef.current?.focus({ preventScroll: true });
    }
    // Nothing animates (reduced motion forced off, or no layout): close now.
    if (!open && dialog.getAnimations().length === 0) finish();
  }, [open, shouldRender, finish]);

  if (!isClient || !shouldRender) return null;

  return createPortal(
    // A press on the tinted layer (the dialog itself, outside the card)
    // closes it; keyboard users have Escape and the close button.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className="dcp-playground-modal"
      data-closing={isClosing || undefined}
      aria-label={title}
      onCancel={(event) => {
        // Escape: run the animated close instead of the instant one.
        event.preventDefault();
        if (open) onClose();
      }}
      onMouseDown={(event) => {
        if (open && event.target === event.currentTarget) onClose();
      }}
      onAnimationEnd={(event) => {
        // Only the overlay's own fade marks the end of the exit.
        if (event.target === event.currentTarget && isClosing) finish();
      }}
    >
      <div ref={cardRef} tabIndex={-1} className="dcp-playground-modal__inner">
        <span>
          <button
            type="button"
            className="dcp-playground-modal__close"
            aria-label="Close Modal"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </span>
        <h2 className="dcp-playground-modal__title">{title}</h2>
        <div className="dcp-playground-modal__content">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
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

function renderPath(path: string): React.ReactNode {
  return path.split(/(\\{[^}]+\\})/g).map((part, index) =>
    part.startsWith("{") ? (
      <span key={index} className="dcp-playground__param">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

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
    <div className="dcp-playground__field" key={param.anchorId}>
      <div className="dcp-playground__field-head">
        <span className="dcp-playground__field-name">{param.name}</span>
        <span className="dcp-playground__type">
          {schemaTypeLabel(param.schema)}
        </span>
        {param.required ? (
          <span className="dcp-playground__required">required</span>
        ) : null}
      </div>
      {param.description ? (
        <p className="dcp-playground__field-desc">{param.description}</p>
      ) : null}
      <TextInput
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
    </div>
  );

  return (
    <>
      <div className="dcp-playground">
        <Badge
          className="dcp-playground__method"
          mono
          solid
          size="sm"
          color={httpMethodBadgeColor(operation.method)}
        >
          {operation.method}
        </Badge>
        <span className="dcp-playground__path">
          {renderPath(operation.path)}
        </span>
        <CopyButton
          text={operation.method.toUpperCase() + " " + operation.path}
          label="Copy endpoint"
          size={16}
        />
        <button
          className="dcp-playground__send"
          type="button"
          onClick={() => setOpen(true)}
        >
          Try it
          <Icon name="play" size={14} />
        </button>
      </div>

      <PlaygroundModal
        open={open}
        onClose={() => setOpen(false)}
        title={
          operation.summary ??
          operation.method.toUpperCase() + " " + operation.path
        }
      >
        <div className="dcp-playground__header">
          <div className="dcp-playground__path-bar">
            <Badge
              className="dcp-playground__method"
              mono
              solid
              size="sm"
              color={httpMethodBadgeColor(operation.method)}
            >
              {operation.method}
            </Badge>
            <span className="dcp-playground__path">
              {renderPath(operation.path)}
            </span>
            <button
              className="dcp-playground__send"
              type="button"
              onClick={() => void send()}
              disabled={loading}
            >
              Send
              {loading ? <Spinner size={14} /> : <Icon name="play" size={14} />}
            </button>
          </div>
        </div>

        <div className="dcp-playground__body">
          <div className="dcp-playground__column">
            {operation.description || operation.summary ? (
              <p className="dcp-playground__description">
                {operation.description ?? operation.summary}
              </p>
            ) : null}

            <div className="dcp-playground__toolbar">
              {operation.servers.length > 0 ? (
                <span className="dcp-playground__meta">
                  {serverBase(operation.servers[0])}
                </span>
              ) : null}
              {allowDirect ? (
                <>
                  <button
                    type="button"
                    className="dcp-playground__toggle"
                    data-active={mode === "proxy" || undefined}
                    onClick={() => setMode("proxy")}
                  >
                    Proxy
                  </button>
                  <button
                    type="button"
                    className="dcp-playground__toggle"
                    data-active={mode === "direct" || undefined}
                    onClick={() => setMode("direct")}
                  >
                    Direct
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="dcp-playground__toggle"
                data-active={showSecrets || undefined}
                onClick={() => setShowSecrets((v) => !v)}
              >
                {showSecrets ? "Hide secrets" : "Show secrets"}
              </button>
            </div>

            {operation.security.length > 0 ? (
              <Accordion title="Authorization" defaultOpen>
                <div className="dcp-playground__section">
                  {operation.security.map((requirement) => {
                    const scheme = requirement.scheme;
                    if (
                      scheme &&
                      scheme.type === "http" &&
                      scheme.scheme === "basic"
                    ) {
                      return (
                        <div
                          className="dcp-playground__field"
                          key={requirement.schemeName}
                        >
                          <div className="dcp-playground__field-head">
                            <span className="dcp-playground__field-name">
                              {requirement.schemeName}
                            </span>
                            <span className="dcp-playground__type">basic</span>
                          </div>
                          <TextInput
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
                          <TextInput
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
                        </div>
                      );
                    }
                    const chip =
                      scheme?.type === "apiKey"
                        ? "apiKey"
                        : scheme?.scheme === "bearer"
                          ? "bearer"
                          : (scheme?.type ?? "token");
                    return (
                      <div
                        className="dcp-playground__field"
                        key={requirement.schemeName}
                      >
                        <div className="dcp-playground__field-head">
                          <span className="dcp-playground__field-name">
                            {requirement.schemeName}
                          </span>
                          <span className="dcp-playground__type">{chip}</span>
                          <span className="dcp-playground__required">
                            required
                          </span>
                        </div>
                        <TextInput
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
                      </div>
                    );
                  })}
                </div>
              </Accordion>
            ) : null}

            {groupedParams.map((group, index) => (
              <Accordion
                key={group.location}
                title={LOCATION_TITLES[group.location]}
                defaultOpen={!hasAuth && index === 0}
              >
                <div className="dcp-playground__section">
                  {group.params.map(renderParamField)}
                </div>
              </Accordion>
            ))}

            {operation.requestBody &&
            operation.method !== "get" &&
            operation.method !== "head" ? (
              <Accordion
                title="Body"
                defaultOpen={!hasAuth && groupedParams.length === 0}
              >
                <div className="dcp-playground__section">
                  <TextArea
                    rows={8}
                    aria-label="Request body"
                    spellCheck={false}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                  />
                </div>
              </Accordion>
            ) : null}

            {error ? (
              <div className="dcp-playground__field">
                <Callout type="danger">
                  <p>{error}</p>
                </Callout>
                {corsRetry ? (
                  <button
                    type="button"
                    className="dcp-playground__toggle"
                    onClick={retryViaProxy}
                  >
                    Retry via proxy
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="dcp-playground__column">
            <div className="dcp-playground__response">
              {response ? (
                <div className="dcp-playground__card">
                  <div className="dcp-playground__card-head">
                    <span className="dcp-playground__inline">
                      <span
                        className="dcp-playground__status"
                        data-ok={
                          (response.status >= 200 && response.status < 400) ||
                          undefined
                        }
                      >
                        {response.status} {response.statusText}
                      </span>
                      <span className="dcp-playground__meta">
                        {response.durationMs}ms
                      </span>
                      <span className="dcp-playground__meta">
                        {response.byteLength} bytes
                      </span>
                      {response.truncated ? (
                        <span className="dcp-playground__meta">
                          (truncated)
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="dcp-playground__card-body">
                    {responseKind === "image" ? (
                      // A data: URL built in the browser, which
                      // next/image cannot optimize.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="dcp-playground__media"
                        src={mediaSrc}
                        alt="Response"
                      />
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
                  </div>
                </div>
              ) : (
                <div className="dcp-playground__placeholder">
                  Send the request to see the live response here.
                </div>
              )}
              {loading ? (
                <div className="dcp-playground__loading">
                  <Spinner size={22} />
                </div>
              ) : null}
            </div>

            {snippets.length > 0 ? <CodeTabs tabs={snippets} /> : null}
          </div>
        </div>
      </PlaygroundModal>
    </>
  );
}
`;
