import { deriveTemplate } from "../../../../lib/derive-template.js";
import { headerTemplate } from "../../../components/layout/Header.js";

// The classic Header.tsx with the modern design's edits.
export const modernHeaderTemplate = deriveTemplate(
  "modern components/layout/Header.tsx",
  headerTemplate,
  [
    [
      `import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChatLauncher,
  Icon,
  useOnClickOutside,
} from "cherry-styled-components";
import { Search, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Pictograms";`,
      `import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, useChat, useOnClickOutside } from "cherry-styled-components";
import { Search, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Pictograms";`,
    ],
    [
      `  StyledHeaderInner,
  StyledLeftWrapper,
} from "@/components/layout/Header.styles";
`,
      `  StyledHeaderInner,
  StyledLeftWrapper,
  StyledAskButton,
  StyledAskLabel,
} from "@/components/layout/Header.styles";
`,
    ],
    [
      `  );
  const { isChatActive } = useContext(ChatContext);
  const { openSearch } = useContext(SearchContext);
  const t = useStrings();`,
      `  );
  const { isChatActive } = useContext(ChatContext);
  const { toggle: toggleChat, isOpen: isChatOpen } = useChat();
  const { openSearch } = useContext(SearchContext);
  const t = useStrings();`,
    ],
    [
      `        $hasChildren={children ? true : false}
        $pinned={isPinned}
        id="header"
        ref={headerRef}`,
      `        $hasChildren={children ? true : false}
        $pinned={isPinned}
        data-pinned={isPinned || undefined}
        id="header"
        ref={headerRef}`,
    ],
    [
      `            </StyledSearchButton>
            {isChatActive && (
              <ChatLauncher $glow aria-label={t.askAiAssistant}>
                <Icon icon={Sparkles} />
                <span>{t.askAi}</span>
              </ChatLauncher>
            )}
          </StyledLeftWrapper>`,
      `            </StyledSearchButton>
            {isChatActive && (
              <StyledAskButton
                type="button"
                onClick={toggleChat}
                aria-expanded={isChatOpen}
                aria-label={t.askAiAssistant}
              >
                <Icon icon={Sparkles} />
                <StyledAskLabel>{t.askAi}</StyledAskLabel>
              </StyledAskButton>
            )}
          </StyledLeftWrapper>`,
    ],
  ],
);
