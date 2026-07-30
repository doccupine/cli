import { describe, expect, it } from "vitest";

import { siteLayoutTemplate } from "../lib/layout.js";
import { chatTemplate } from "./components/Chat.js";
import { searchDocsTemplate } from "./components/SearchDocs.js";
import { searchModalContentTemplate } from "./components/SearchModalContent.js";
import { sideBarTemplate } from "./components/SideBar.js";
import { accordionTemplate } from "./components/layout/Accordion.js";
import { docsComponentsTemplate } from "./components/layout/DocsComponents.js";
import { tabsTemplate } from "./components/layout/Tabs.js";
import { eslintConfigTemplate } from "./eslint.config.js";

describe("generated accessibility behavior", () => {
  it("gives search one modal aria-activedescendant combobox model", () => {
    expect(searchModalContentTemplate).toContain('role="dialog"');
    expect(searchModalContentTemplate).toContain('aria-modal="true"');
    expect(searchModalContentTemplate).toContain('role="combobox"');
    expect(searchModalContentTemplate).toContain('role="listbox"');
    expect(searchModalContentTemplate).toContain('role="option"');
    expect(searchModalContentTemplate).toContain("aria-activedescendant");
    expect(searchModalContentTemplate).toContain("handleDialogKeyDown");
    expect(searchModalContentTemplate).toContain(
      'document.addEventListener("focusin", containFocus)',
    );
    expect(searchModalContentTemplate).toContain("previouslyFocused.focus()");
    expect(searchModalContentTemplate).not.toContain("focusResult");
    expect(searchModalContentTemplate).not.toContain(
      "tabIndex={index === activeIndex ? 0 : -1}",
    );
    expect(searchModalContentTemplate).toContain(
      '<StyledLiveStatus role="status"',
    );
    expect(
      searchModalContentTemplate.indexOf("<StyledLiveStatus"),
    ).toBeLessThan(searchModalContentTemplate.indexOf("<StyledResults"));
    expect(searchDocsTemplate).toContain(
      "const opener = closeSearchImmediately(false)",
    );
    expect(searchDocsTemplate).toContain("askAssistant(q, opener)");
  });

  it("allows only one Chat or Search modal and transfers opener ownership", () => {
    const closeChatIndex = searchDocsTemplate.indexOf(
      "const previousOverlayOpener = closeChat(false)",
    );
    const showSearchIndex = searchDocsTemplate.indexOf("setIsVisible(true)");
    expect(closeChatIndex).toBeGreaterThan(-1);
    expect(closeChatIndex).toBeLessThan(showSearchIndex);
    expect(searchDocsTemplate).toContain(
      "registerSearchClose(closeSearchImmediately)",
    );
    expect(searchDocsTemplate).toContain(
      "restoreSearchFocusRef.current = restoreFocus",
    );
    expect(searchDocsTemplate).toContain("returnFocusTo={returnFocusTo}");

    const closeSearchIndex = chatTemplate.indexOf(
      "const previousOverlayOpener = closeSearchRef.current?.(false) ?? null",
    );
    const showChatIndex = chatTemplate.indexOf("setIsOpen(true)");
    expect(closeSearchIndex).toBeGreaterThan(-1);
    expect(closeSearchIndex).toBeLessThan(showChatIndex);
    expect(chatTemplate).toContain(
      "previousOverlayOpener?.isConnected === true",
    );
    expect(chatTemplate).toContain("pendingRestoreFocusRef.current");
    expect(chatTemplate).toContain("if (restoreFocus)");
    expect(searchDocsTemplate).toContain("{isVisible && (");
    expect(chatTemplate).toContain(
      "const isMobileModal = isOpen && isMobileChat",
    );

    expect(searchDocsTemplate).toContain('e.key === "k"');
    expect(searchDocsTemplate).toContain("openSearch()");
    expect(chatTemplate).toContain('e.key.toLowerCase() === "i"');
    expect(chatTemplate).toContain("toggleChat()");
  });

  it("makes mobile chat modal, restores focus, and scrolls only near bottom", () => {
    expect(chatTemplate).toContain("inert={!isOpen}");
    expect(chatTemplate).toContain("aria-hidden={!isOpen}");
    expect(chatTemplate).toContain(
      'role={isMobileModal ? "dialog" : "complementary"}',
    );
    expect(chatTemplate).toContain(
      'aria-modal={isMobileModal ? "true" : undefined}',
    );
    expect(chatTemplate).toContain(
      'document.addEventListener("focusin", containFocus)',
    );
    expect(chatTemplate).toContain("sibling.inert = true");
    expect(chatTemplate).toContain("focusTarget?.isConnected");
    expect(chatTemplate).toContain("shouldAutoScrollRef.current");
    expect(chatTemplate).toContain("distanceFromBottom <=");
    expect(chatTemplate).toContain("cancelAnimationFrame");
    expect(chatTemplate).toContain('"(prefers-reduced-motion: reduce)"');
    expect(chatTemplate).toContain("transition-delay: 0s, 0s, 0.3s;");
    expect(chatTemplate).not.toContain("transition-delay: 0.3s;");
  });

  it("hides collapsed accordion and sidebar-group descendants", () => {
    expect(accordionTemplate).toContain("inert={!isOpen}");
    expect(accordionTemplate).toContain("aria-hidden={!isOpen}");
    expect(docsComponentsTemplate).toContain('"aria-hidden": !$isOpen');
    expect(docsComponentsTemplate).toContain("inert: !$isOpen");
    expect(docsComponentsTemplate).toContain("visibility: hidden");
  });

  it("implements the horizontal ARIA tabs keyboard pattern", () => {
    expect(tabsTemplate).toContain('role="tablist"');
    expect(tabsTemplate).toContain('role="tab"');
    expect(tabsTemplate).toContain('role="tabpanel"');
    expect(tabsTemplate).toContain("aria-selected={activeTab === index}");
    expect(tabsTemplate).toContain("aria-controls={panelId}");
    expect(tabsTemplate).toContain("tabIndex={activeTab === index ? 0 : -1}");
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
      expect(tabsTemplate).toContain(key);
    }
    expect(tabsTemplate).not.toContain("ArrowUp");
    expect(tabsTemplate).not.toContain("ArrowDown");
    expect(tabsTemplate).toContain('aria-orientation="horizontal"');
    expect(tabsTemplate).toContain("&:focus-visible");
  });

  it("connects sidebar toggles to their controlled regions", () => {
    expect(sideBarTemplate).toContain("aria-controls={groupContentId}");
    expect(sideBarTemplate).toContain("id={groupContentId}");
    expect(sideBarTemplate).toContain("aria-controls={sidebarId}");
    expect(sideBarTemplate).toContain("id={sidebarId}");
  });

  it("resets inherited Cherry heights on compact custom controls", () => {
    expect(docsComponentsTemplate).toMatch(
      /StyledSidebarGroupButton[\s\S]*?height: auto;[\s\S]*?min-height: 0;/,
    );
    expect(tabsTemplate).toMatch(
      /const TabButton[\s\S]*?height: auto;[\s\S]*?min-height: 0;/,
    );
  });

  it("does not emit a stale lint suppression in no-sections layouts", () => {
    const noSectionsLayout = siteLayoutTemplate([], null);
    expect(noSectionsLayout).toContain(
      'import navigation from "@/navigation.json";',
    );
    expect(noSectionsLayout).not.toContain(
      "eslint-disable-next-line @typescript-eslint/no-unused-vars",
    );

    const sectionsLayout = siteLayoutTemplate(
      [],
      [{ label: "Guides", slug: "guides" }],
    );
    expect(sectionsLayout).not.toContain(
      'import navigation from "@/navigation.json";',
    );
  });

  it("enables the complete jsx-a11y recommended rule set", () => {
    expect(eslintConfigTemplate).toContain(
      "...jsxA11yPlugin.configs.recommended.rules",
    );
  });
});
