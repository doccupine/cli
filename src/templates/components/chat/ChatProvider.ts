export const chatProviderTemplate = `"use client";
// Adapted from cherry-styled-components (MIT,
// https://github.com/cherry-design-system/styled-components).
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

export type ChatRole = "user" | "assistant";

export interface ChatSourceData {
  id: string;
  label: string;
  href: string;
}

export interface ChatMessageData {
  id: string;
  role: ChatRole;
  /** Rendered as-is: plain text while streaming, rich markup when done. */
  content: React.ReactNode;
  /** Plain-text mirror of \`content\`, used to build the history for onSend. */
  text?: string;
  sources?: ChatSourceData[];
}

export interface ChatHistoryEntry {
  role: ChatRole;
  content: string;
}

export interface ChatSendContext {
  /** Aborted by reset() and on unmount; pass it to fetch. */
  signal: AbortSignal;
  /** The conversation before this question, oldest first. */
  history: ChatHistoryEntry[];
  /**
   * Creates the assistant reply on the first call and patches the same
   * message on every later call, so streaming updates one bubble and the
   * typing indicator stays put until real content arrives.
   */
  setAssistant: (
    content: React.ReactNode,
    options?: { text?: string; sources?: ChatSourceData[] },
  ) => void;
}

/**
 * The transport: take the question, talk to the server, and stream the
 * reply through \`setAssistant\`. A thrown error lands in \`error\`; an abort is
 * swallowed.
 */
export type ChatSendHandler = (
  question: string,
  context: ChatSendContext,
) => void | Promise<void>;

interface ChatContextValue {
  isOpen: boolean;
  open: (returnFocusTo?: HTMLElement | null) => void;
  close: (restoreFocus?: boolean) => HTMLElement | null;
  toggle: () => void;
  messages: ChatMessageData[];
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  error: string | null;
  /** Sends \`text\`, or the current input when omitted. No-op while loading. */
  send: (text?: string) => void;
  /**
   * Opens the panel and hands \`question\` to the assistant. While a reply is
   * still streaming the question is pre-filled instead, ready to send.
   */
  ask: (question: string, returnFocusTo?: HTMLElement | null) => void;
  /** Aborts any in-flight reply and restores the initial greeting. */
  reset: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const ChatContext = createContext<ChatContextValue>({
  isOpen: false,
  open: () => {},
  close: () => null,
  toggle: () => {},
  messages: [],
  input: "",
  setInput: () => {},
  loading: false,
  error: null,
  send: () => {},
  ask: () => {},
  reset: () => {},
  inputRef: { current: null },
});

/** The chat's panel state, transcript and actions. */
function useChat() {
  return useContext(ChatContext);
}

interface ChatProviderProps {
  children: React.ReactNode;
  /** The transport. */
  onSend: ChatSendHandler;
  /** Assistant message seeded on first open and after reset. */
  greeting: React.ReactNode;
  /** How many prior messages the history handed to onSend may contain. */
  historyLimit?: number;
  /** Cmd/Ctrl + this key toggles the panel. Pass null to disable. */
  shortcut?: string | null;
}

const GREETING_ID = "chat-greeting";
// Cap on each history entry so one giant pasted message cannot blow up the
// request built from it. Matches the RAG route's schema (20 x 4000).
const HISTORY_ENTRY_MAX_CHARS = 4000;

function ChatProvider({
  children,
  onSend,
  greeting,
  historyLimit = 20,
  shortcut = "i",
}: ChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>(() =>
    greeting === null
      ? []
      : [
          {
            id: GREETING_ID,
            role: "assistant",
            content: greeting,
            text: typeof greeting === "string" ? greeting : undefined,
          },
        ],
  );

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idCounter = useRef(0);

  // Effect callbacks and timeouts read these refs instead of state so they
  // always see the latest values without re-subscribing.
  const isOpenRef = useRef(isOpen);
  const loadingRef = useRef(loading);
  const messagesRef = useRef(messages);
  const onSendRef = useRef(onSend);
  const greetingRef = useRef(greeting);
  const inputValueRef = useRef(input);

  useEffect(() => {
    isOpenRef.current = isOpen;
    loadingRef.current = loading;
    messagesRef.current = messages;
    inputValueRef.current = input;
    onSendRef.current = onSend;
    greetingRef.current = greeting;
  });

  // Focus bookkeeping: the element that opened the panel gets focus back when
  // the panel closes, via a timeout so the close can finish hiding first.
  const openerRef = useRef<HTMLElement | null>(null);
  const pendingRestoreFocusRef = useRef<HTMLElement | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const nextId = useCallback(() => \`chat-msg-\${idCounter.current++}\`, []);

  const greetingMessages = useCallback((): ChatMessageData[] => {
    const currentGreeting = greetingRef.current;
    if (currentGreeting === null || currentGreeting === undefined) return [];
    return [
      {
        id: GREETING_ID,
        role: "assistant",
        content: currentGreeting,
        text: typeof currentGreeting === "string" ? currentGreeting : undefined,
      },
    ];
  }, []);

  const showPanel = useCallback((returnFocusTo?: HTMLElement | null) => {
    const pendingOpener = pendingRestoreFocusRef.current;
    if (restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current);
      restoreFocusTimeoutRef.current = null;
    }
    pendingRestoreFocusRef.current = null;
    if (!isOpenRef.current) {
      // Where focus returns: an explicit target first, then the opener of a
      // close that has not restored focus yet, then whatever is focused now.
      const activeElement = document.activeElement;
      openerRef.current =
        returnFocusTo?.isConnected === true
          ? returnFocusTo
          : pendingOpener?.isConnected === true
            ? pendingOpener
            : activeElement instanceof HTMLElement &&
                activeElement !== document.body
              ? activeElement
              : null;
    }
    isOpenRef.current = true;
    // Committed synchronously so the composer can be focused while the
    // triggering tap or click is still active: iOS Safari ignores focus()
    // (and never opens the keyboard) once the gesture has passed. Flushing
    // also unmounts anything the same gesture closed (the search window),
    // so its focus containment cannot steal this focus back.
    flushSync(() => setIsOpen(true));
    inputRef.current?.focus();
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    // Fallback for a composer that mounts asynchronously (the lazily loaded
    // panel) and is not in the DOM yet during the flush above.
    focusTimeoutRef.current = setTimeout(() => {
      focusTimeoutRef.current = null;
      inputRef.current?.focus();
    }, 0);
  }, []);

  const open = useCallback(
    (returnFocusTo?: HTMLElement | null) => {
      showPanel(returnFocusTo);
      setMessages((prev) => (prev.length === 0 ? greetingMessages() : prev));
    },
    [showPanel, greetingMessages],
  );

  const close = useCallback((restoreFocus = true) => {
    const pendingOpener = pendingRestoreFocusRef.current;
    if (!restoreFocus && restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current);
      restoreFocusTimeoutRef.current = null;
      pendingRestoreFocusRef.current = null;
    }
    if (!isOpenRef.current) return pendingOpener;
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    // Blur anything inside the panel before it goes inert, so focus is not
    // left on a hidden element.
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement.closest("[data-chat-panel]")
    ) {
      activeElement.blur();
    }
    const opener = openerRef.current;
    openerRef.current = null;
    isOpenRef.current = false;
    setIsOpen(false);
    if (restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current);
    }
    if (restoreFocus) {
      pendingRestoreFocusRef.current = opener;
      restoreFocusTimeoutRef.current = setTimeout(() => {
        const focusTarget = pendingRestoreFocusRef.current;
        restoreFocusTimeoutRef.current = null;
        pendingRestoreFocusRef.current = null;
        if (focusTarget?.isConnected) focusTarget.focus();
      }, 0);
    } else {
      pendingRestoreFocusRef.current = null;
    }
    return opener;
  }, []);

  const toggle = useCallback(() => {
    if (isOpenRef.current) {
      close();
    } else {
      open();
    }
  }, [close, open]);

  const runSend = useCallback(
    async (question: string, returnFocusTo?: HTMLElement | null) => {
      setInput("");
      showPanel(returnFocusTo);

      const base =
        messagesRef.current.length > 0
          ? messagesRef.current
          : greetingMessages();

      setLoading(true);
      loadingRef.current = true;
      setError(null);
      // The history the server accepts: at most historyLimit entries of at
      // most HISTORY_ENTRY_MAX_CHARS characters each.
      const history: ChatHistoryEntry[] = base
        .filter((message) => (message.text ?? "").trim() !== "")
        .slice(-historyLimit)
        .map((message) => ({
          role: message.role,
          content: (message.text as string).slice(0, HISTORY_ENTRY_MAX_CHARS),
        }));

      const withQuestion: ChatMessageData[] = [
        ...base,
        { id: nextId(), role: "user", content: question, text: question },
      ];
      messagesRef.current = withQuestion;
      setMessages(withQuestion);

      const controller = new AbortController();
      abortRef.current = controller;

      // Assigned outside the state updater (updaters must stay pure and can
      // be replayed); the first setAssistant call creates the message, later
      // ones patch it in place.
      let assistantId: string | null = null;
      const setAssistant: ChatSendContext["setAssistant"] = (
        content,
        options,
      ) => {
        if (assistantId === null) assistantId = nextId();
        const patch: ChatMessageData = {
          id: assistantId,
          role: "assistant",
          content,
          text:
            options?.text ??
            (typeof content === "string" ? content : undefined),
          sources: options?.sources,
        };
        setMessages((prev) => {
          const index = prev.findIndex((message) => message.id === assistantId);
          if (index === -1) return [...prev, patch];
          const next = [...prev];
          next[index] = patch;
          return next;
        });
      };

      try {
        await onSendRef.current(question, {
          signal: controller.signal,
          history,
          setAssistant,
        });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [showPanel, greetingMessages, historyLimit, nextId],
  );

  const send = useCallback(
    (text?: string) => {
      const question = (text ?? inputValueRef.current).trim();
      if (question === "" || loadingRef.current) return;
      void runSend(question);
    },
    [runSend],
  );

  // Bridge for launchers and the search window: hand a question straight to
  // the assistant. While a reply is streaming the panel opens with the
  // question pre-filled instead, ready to send when it finishes.
  const ask = useCallback(
    (question: string, returnFocusTo?: HTMLElement | null) => {
      const trimmed = question.trim();
      if (trimmed === "") return;
      if (loadingRef.current) {
        showPanel(returnFocusTo);
        setInput(trimmed);
      } else {
        void runSend(trimmed, returnFocusTo);
      }
    },
    [showPanel, runSend],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    loadingRef.current = false;
    setError(null);
    setMessages(greetingMessages());
  }, [greetingMessages]);

  // Global Cmd/Ctrl+<shortcut> toggles the panel.
  useEffect(() => {
    if (!shortcut) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === shortcut
      ) {
        event.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut, toggle]);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      if (restoreFocusTimeoutRef.current) {
        clearTimeout(restoreFocusTimeoutRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        messages,
        input,
        setInput,
        loading,
        error,
        send,
        ask,
        reset,
        inputRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export { ChatContext, ChatProvider, useChat };
`;
