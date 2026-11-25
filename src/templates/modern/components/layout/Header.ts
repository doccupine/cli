import { deriveTemplate } from "../../../../lib/derive-template.js";
import { headerTemplate } from "../../../components/layout/Header.js";

// The classic Header.tsx with the modern design's edits: an "Ask AI" pill
// that toggles the chat instead of the classic launcher.
export const modernHeaderTemplate = deriveTemplate(
  "modern components/layout/Header.tsx",
  headerTemplate,
  [
    [
      'import { ChatLauncher } from "@/components/chat/ChatLauncher";',
      'import { useChat } from "@/components/chat/ChatProvider";',
    ],
    [
      `  const { isChatActive } = useContext(ChatContext);
`,
      `  const { isChatActive } = useContext(ChatContext);
  const { toggle: toggleChat, isOpen: isChatOpen } = useChat();
`,
    ],
    [
      `              <ChatLauncher aria-label={t.askAiAssistant}>
                <Sparkles aria-hidden="true" />
                <span>{t.askAi}</span>
              </ChatLauncher>`,
      `              <button
                type="button"
                className="dcp-reset-button dcp-pill dcp-header__ask"
                onClick={toggleChat}
                aria-expanded={isChatOpen}
                aria-label={t.askAiAssistant}
              >
                <Sparkles aria-hidden="true" />
                <span className="dcp-header__ask-label">{t.askAi}</span>
              </button>`,
    ],
  ],
);
