import { describe, expect, it } from "vitest";

import { siteLayoutTemplate } from "../lib/layout.js";
import { appStructure, appStructureFor } from "../lib/structures.js";
import { SITE_TEMPLATES } from "../lib/templates.js";
import { chatTemplate } from "./components/Chat.js";
import { searchDocsTemplate } from "./components/SearchDocs.js";
import { searchModalContentTemplate } from "./components/SearchModalContent.js";
import { sideBarTemplate } from "./components/SideBar.js";
import { accordionTemplate } from "./components/layout/Accordion.js";
import { tabsTemplate } from "./components/layout/Tabs.js";
import { variantSwitchersTemplate } from "./components/layout/VariantSwitchers.js";
import { dropdownTemplate } from "./components/layout/Dropdown.js";
import { eslintConfigTemplate } from "./eslint.config.js";

describe("generated accessibility behavior", () => {
  it("gives search one modal aria-activedescendant combobox model", () => {
    // A native modal <dialog> (showModal): the browser makes the rest of the
    // page inert and puts the window in the top layer.
    expect(searchModalContentTemplate).toContain("<dialog");
    expect(searchModalContentTemplate).toContain("showModal()");
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
    // The live region is rendered before the results, so it exists before
    // the first announcement.
    const liveStatus = searchModalContentTemplate.indexOf('role="status"');
    expect(liveStatus).toBeGreaterThan(-1);
    expect(liveStatus).toBeLessThan(
      searchModalContentTemplate.indexOf('className="dcp-search__results'),
    );
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
    // Set in the component, not the styles, so a design's styles file can
    // never drop them.
    expect(sideBarTemplate).toContain("aria-hidden={!isOpen}");
    expect(sideBarTemplate).toContain("inert={!isOpen}");
    for (const template of SITE_TEMPLATES) {
      const structure = appStructureFor(template);
      expect(
        structure["app/styles/components.css"] +
          structure["app/styles/design.css"],
      ).toContain("visibility: hidden");
    }
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
    for (const template of SITE_TEMPLATES) {
      expect(appStructureFor(template)["app/styles/design.css"]).toMatch(
        /\.dcp-tabs__tab(\.dcp-tabs__tab)?:focus-visible \{/,
      );
    }
  });

  it("connects sidebar toggles to their controlled regions", () => {
    expect(sideBarTemplate).toContain("aria-controls={groupContentId}");
    expect(sideBarTemplate).toContain("id={groupContentId}");
    expect(sideBarTemplate).toContain("aria-controls={sidebarId}");
    expect(sideBarTemplate).toContain("id={sidebarId}");
  });

  it("closes the mobile menu on Escape and returns focus to its button", () => {
    expect(sideBarTemplate).toContain('e.key !== "Escape"');
    expect(sideBarTemplate).toContain("setIsMobileMenuOpen(false);");
    expect(sideBarTemplate).toContain("toggleRef.current?.focus();");
    expect(sideBarTemplate).toContain("ref={toggleRef}");
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
    expect(appStructureFor("classic")["app/styles/components.css"]).toMatch(
      /\.dcp-dropdown__item:focus-visible \{[^}]*box-shadow: inset 0 0 0 2px/,
    );
    // Every button in the sidebar footer is decorated with an accessible
    // name, so the glyphs beside them stay decorative.
    expect(variantSwitchersTemplate).toContain('aria-hidden="true"');
  });

  it("resets inherited button heights on compact custom controls", () => {
    for (const template of SITE_TEMPLATES) {
      const structure = appStructureFor(template);
      expect(
        structure["app/styles/components.css"] +
          structure["app/styles/design.css"],
      ).toMatch(
        /\.dcp-sidebar__group-button[^{]*\{[^}]*height: auto;\s*min-height: 0;/,
      );
      expect(structure["app/styles/design.css"]).toMatch(
        /\.dcp-tabs__tab \{[^}]*height: auto;\s*min-height: 0;/,
      );
    }
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
  it("passes the axe landmark, keyboard and skip-link checks", () => {
    for (const template of SITE_TEMPLATES) {
      const files = appStructureFor(template);
      const docs = files["components/layout/DocsComponents.tsx"];
      // A skip link first, jumping to the article.
      expect(docs).toContain('<a className="dcp-skip-link" href="#content">');
      expect(docs).toMatch(
        /<main\s+className="dcp-docs"\s+id="content"\s+tabIndex=\{-1\}/,
      );
      // The llms.txt pointer is for agents: hidden and out of the tab order.
      expect(docs).toContain('aria-hidden="true"');
      expect(docs.match(/tabIndex=\{-1\}/g)?.length).toBeGreaterThanOrEqual(3);
      // Every nav landmark has its own name.
      expect(files["components/SideBar.tsx"]).toContain(
        "aria-label={t.navigation}",
      );
      expect(files["components/layout/SectionBar.tsx"]).toContain(
        "aria-label={t.sections}",
      );
      expect(files["components/DocsSideBar.tsx"]).toContain(
        '<nav className="dcp-toc-nav" aria-label={t.onThisPage}>',
      );
      expect(files["components/layout/DocsNavigation.tsx"]).toContain(
        "aria-label={t.pageNavigation}",
      );
      // Code blocks scroll sideways, so keyboard users can reach them.
      expect(files["components/layout/Code.tsx"]).toContain(
        '<pre tabindex="0">',
      );
    }
    expect(siteLayoutTemplate([], null).indexOf("<SkipLink />")).toBeLessThan(
      siteLayoutTemplate([], null).indexOf("<Header"),
    );
  });
});
