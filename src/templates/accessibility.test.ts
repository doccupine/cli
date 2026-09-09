import { describe, expect, it } from "vitest";

import { siteLayoutTemplate } from "../lib/layout.js";
import { appStructure } from "../lib/structures.js";
import { chatTemplate } from "./components/Chat.js";
import { searchDocsTemplate } from "./components/SearchDocs.js";
import { searchModalContentTemplate } from "./components/SearchModalContent.js";
import { sideBarTemplate } from "./components/SideBar.js";
import { accordionTemplate } from "./components/layout/Accordion.js";
import { docsComponentsTemplate } from "./components/layout/DocsComponents.js";
import { tabsTemplate } from "./components/layout/Tabs.js";
import { variantSwitchersTemplate } from "./components/layout/VariantSwitchers.js";
import { dropdownTemplate } from "./components/layout/Dropdown.js";
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
    expect(searchDocsTemplate).toContain("ask(q, opener)");
  });

  it("allows only one Chat or Search modal at a time", () => {
    // Opening search dismisses the chat drawer first, adopting its opener so
    // focus restoration chains through both overlays.
    const closeChatIndex = searchDocsTemplate.indexOf(
      "const previousOverlayOpener = closeChat(false)",
    );
    const showSearchIndex = searchDocsTemplate.indexOf("setIsVisible(true)");
    expect(closeChatIndex).toBeGreaterThan(-1);
    expect(closeChatIndex).toBeLessThan(showSearchIndex);

    // Opening chat (launcher, Cmd+I, or ask) dismisses the search modal
    // without restoring focus, since focus moves into the chat composer.
    expect(searchDocsTemplate).toContain(
      "if (isChatOpen) closeSearchImmediately(false)",
    );
    expect(searchDocsTemplate).toContain(
      "restoreSearchFocusRef.current = restoreFocus",
    );
    expect(searchDocsTemplate).toContain("returnFocusTo={returnFocusTo}");
    expect(searchDocsTemplate).toContain("{isVisible && (");

    expect(searchDocsTemplate).toContain('e.key === "k"');
    expect(searchDocsTemplate).toContain("openSearch()");
    // The Cmd/Ctrl+I toggle lives in Cherry's ChatProvider and must stay
    // disabled while no LLM provider is configured.
    expect(chatTemplate).toContain('shortcut={isChatActive ? "i" : null}');
  });

  it("delegates the chat dialog contract to Cherry's chat kit", () => {
    // Focus trap, inert siblings, Escape, aria-modal below lg, body scroll
    // lock, and stick-to-bottom scrolling are ChatPanel/ChatMessageList
    // behavior in cherry-styled-components 0.2.13+, so the template must
    // compose the kit instead of hand-rolling the dialog.
    for (const component of [
      "<ChatPanel",
      "<ChatMessageList>",
      "<ChatMessage",
      "<ChatInput",
      "<ChatTyping>",
      "ChatProvider",
    ]) {
      expect(chatTemplate).toContain(component);
    }
    expect(chatTemplate).not.toContain("aria-modal");
    expect(chatTemplate).not.toContain("inert");
    expect(chatTemplate).not.toContain("requestAnimationFrame");

    // The typing indicator only shows until the first streamed token creates
    // the assistant bubble.
    expect(chatTemplate).toContain(
      'loading && lastMessage?.role !== "assistant"',
    );

    // Below lg the drawer is a fullscreen dialog, so following a source link
    // must close it to reveal the navigated page.
    expect(chatTemplate).toContain('useBelowBreakpoint("lg")');
    expect(chatTemplate).toContain("if (isMobileChat) close();");
  });

  it("streams into a single assistant bubble with a plain-text mirror", () => {
    expect(chatTemplate).toContain(
      "setAssistant(streamedContent, { text: streamedContent, sources })",
    );
    expect(chatTemplate).toContain("{ text: streamedContent, sources },");
    expect(appStructure["components/ChatStyles.ts"]).toBeUndefined();
    expect(chatTemplate).not.toContain("@/components/ChatStyles");
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

  it("gives the language and version switchers real controls", () => {
    // Buttons, not a select: each switcher is the platform's dropdown, a
    // disclosure trigger over a labelled radio menu, so both are reachable
    // and announced from the keyboard.
    expect(variantSwitchersTemplate).not.toContain("<Select");
    expect(variantSwitchersTemplate).toContain(
      'from "@/components/layout/Dropdown"',
    );
    expect(variantSwitchersTemplate).toContain('role="menu"');
    expect(variantSwitchersTemplate).toContain('role="menuitemradio"');
    expect(variantSwitchersTemplate).toContain(
      "aria-checked={option.value === value}",
    );
    expect(dropdownTemplate).toContain("aria-haspopup={role}");
    expect(dropdownTemplate).toContain(
      "aria-expanded={role ? isOpen && !isClosing : undefined}",
    );
    expect(dropdownTemplate).toContain(
      "aria-controls={role ? menuId : undefined}",
    );
    expect(dropdownTemplate).toContain("id={role ? menuId : undefined}");
    expect(dropdownTemplate).toContain("aria-label={role ? label : undefined}");
    for (const key of ["Escape", "ArrowDown", "ArrowUp"]) {
      expect(dropdownTemplate).toContain(key);
    }
    // Focus lands on the current entry, and the ring is drawn inset so the
    // menu's overflow clipping cannot hide it.
    expect(dropdownTemplate).toContain('[aria-checked="true"]');
    expect(dropdownTemplate).toContain("&:focus-visible");
    expect(dropdownTemplate).toContain("box-shadow: inset 0 0 0 2px");
    // Every button in the sidebar footer is decorated with an accessible
    // name, so the glyphs beside them stay decorative.
    expect(variantSwitchersTemplate).toContain('aria-hidden="true"');
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
