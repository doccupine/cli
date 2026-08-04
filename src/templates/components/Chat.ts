export const chatTemplate = `"use client";
import React, { createContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChatInput,
  ChatMessage,
  ChatMessageList,
  ChatPanel,
  ChatProvider,
  ChatSource,
  ChatSources,
  ChatTyping,
  IconButton,
  Prose,
  useBelowBreakpoint,
  useChat,
  type ChatSendContext,
  type ChatSourceData,
} from "cherry-styled-components";
import { RotateCcw } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { Callout } from "@/components/layout/Callout";
import { useMDXComponents as getMDXComponents } from "@/components/MDXComponents";

const mdxComponents = getMDXComponents({});

type RagSource = {
  id: string;
  path: string;
  uri: string;
  score: number;
};

// Map a retrieval hit onto the chip the transcript renders: docs://<slug>
// becomes an app-relative href, and the slug's last segment becomes a
// title-cased label.
function toSourceChip(src: RagSource): ChatSourceData {
  const slug = src.uri.replace("docs://", "").replace(/^\\/+/, "");
  const href = slug ? \`/\${slug}/\` : "/";
  const label = slug
    ? slug
        .split("/")
        .pop()!
        .replace(/-/g, " ")
        .replace(/\\b\\w/g, (c: string) => c.toUpperCase())
    : "Home";
  return { id: src.id, label, href };
}

// Cherry's ChatProvider owns the transcript, panel state, and streaming
// bookkeeping; this handler owns the transport: POST the question to
// /api/rag, stream the SSE frames, and patch the assistant bubble as tokens
// arrive. The provider bounds \`history\` to the RAG contract (20 entries,
// 4000 chars each), swallows aborts, and surfaces thrown errors as \`error\`.
async function sendToAssistant(
  question: string,
  { signal, history, setAssistant }: ChatSendContext,
) {
  const res = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
    signal,
  });

  if (!res.ok) {
    // The body may be a proxy/gateway HTML error page (e.g. Cloudflare
    // 524), not our JSON - never blindly JSON.parse it.
    const contentType = res.headers.get("content-type") || "";
    let message = "Request failed";
    if (contentType.includes("application/json")) {
      try {
        const errorData = await res.json();
        message = errorData.error || message;
      } catch {
        // Non-JSON despite the header - fall through to the default.
      }
    } else if ([502, 503, 504, 524].includes(res.status)) {
      message = "The assistant took too long to respond. Please try again.";
    }
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  const decoder = new TextDecoder();
  const contentParts: string[] = [];
  let sources: ChatSourceData[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\\n");
    buffer = parts.pop() ?? "";

    for (const line of parts) {
      if (!line.startsWith("data: ")) continue;

      // Guard only the parse: a malformed frame is skipped, while the
      // server's error event below must throw past this loop so it lands
      // in the provider's error state instead of dying in a parse-error
      // log.
      let data;
      try {
        data = JSON.parse(line.slice(6));
      } catch {
        console.error("Failed to parse SSE data:", line);
        continue;
      }

      if (data.type === "metadata") {
        const allSources: RagSource[] = data.data?.sources ?? [];
        const seen = new Set<string>();
        sources = allSources
          .filter((s) => {
            if (s.score < 0.4 || seen.has(s.uri)) return false;
            seen.add(s.uri);
            return true;
          })
          .map(toSourceChip);
      } else if (data.type === "content") {
        contentParts.push(data.data);
        const streamedContent = contentParts.join("");
        setAssistant(streamedContent, { text: streamedContent, sources });
      } else if (data.type === "error") {
        throw new Error(data.data);
      } else if (data.type === "done") {
        const streamedContent = contentParts.join("");
        let mdxSource: MDXRemoteSerializeResult | null = null;
        try {
          mdxSource = await serialize(streamedContent, {
            parseFrontmatter: false,
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
              format: "md",
              development: false,
            },
          });
        } catch (mdxError: unknown) {
          console.error("MDX serialization error:", mdxError);
        }

        setAssistant(
          mdxSource ? (
            <MDXRemote {...mdxSource} components={mdxComponents} />
          ) : (
            streamedContent
          ),
          { text: streamedContent, sources },
        );
      }
    }
  }
}

function ChatSourceLink({ source }: { source: ChatSourceData }) {
  const { close } = useChat();
  const isMobileChat = useBelowBreakpoint("lg");
  const router = useRouter();

  return (
    <ChatSource
      href={source.href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        // ChatSource renders a plain anchor, so route unmodified left clicks
        // client-side to keep the transcript alive; below lg the panel is a
        // fullscreen dialog, so close it to reveal the navigated page.
        event.preventDefault();
        if (isMobileChat) close();
        router.push(source.href);
      }}
    >
      {source.label}
    </ChatSource>
  );
}

function ChatTranscript() {
  const { messages, loading, error } = useChat();
  const lastMessage = messages[messages.length - 1];

  return (
    <ChatMessageList>
      {messages.map((message) => (
        <ChatMessage key={message.id} $role={message.role}>
          {message.role === "assistant" ? (
            // The docs' typographic context lives on the docs page wrapper,
            // so a rendered MDX answer would arrive margin-less here. Prose
            // $compact is Cherry's document styling for chat replies: a 10px
            // rhythm between elements, inline-code chips, lists, and tables.
            <Prose $compact>{message.content}</Prose>
          ) : (
            message.content
          )}
          {message.role === "assistant" &&
            message.sources &&
            message.sources.length > 0 && (
              <ChatSources>
                {message.sources.map((source) => (
                  <ChatSourceLink key={source.id} source={source} />
                ))}
              </ChatSources>
            )}
        </ChatMessage>
      ))}
      {loading && lastMessage?.role !== "assistant" && <ChatTyping />}
      {error && (
        <Callout type="danger">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </Callout>
      )}
    </ChatMessageList>
  );
}

function ChatActions() {
  const { reset } = useChat();

  return (
    <IconButton
      onClick={reset}
      aria-label="Reset chat history"
      title="Reset chat history"
    >
      <RotateCcw />
    </IconButton>
  );
}

function Chat() {
  return (
    <ChatPanel $title="AI Assistant" $actions={<ChatActions />}>
      <ChatTranscript />
      <ChatInput $glow />
    </ChatPanel>
  );
}

// App-level chat context: only whether the AI assistant is enabled (an LLM
// provider is configured). Panel state, the transcript, and streaming all
// live in Cherry's ChatProvider - read those with useChat() from
// "cherry-styled-components".
const ChatContext = createContext<{ isChatActive: boolean }>({
  isChatActive: false,
});

interface ChatContextProviderProps {
  children: React.ReactNode;
  isChatActive: boolean;
}

const ChtProvider = ({ children, isChatActive }: ChatContextProviderProps) => {
  const value = useMemo(() => ({ isChatActive }), [isChatActive]);

  return (
    <ChatContext.Provider value={value}>
      <ChatProvider
        onSend={sendToAssistant}
        shortcut={isChatActive ? "i" : null}
      >
        {children}
      </ChatProvider>
    </ChatContext.Provider>
  );
};

export { Chat, ChtProvider, ChatContext };
`;
