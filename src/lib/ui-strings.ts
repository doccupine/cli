// The generated site's own chrome strings: search, sidebar, action bar,
// footer, chat, and the language/version switchers. A `languages.json` entry
// may override any of them through its `strings` object, so a translated
// site is not stuck with English labels around translated pages. The keys
// are the contract: `validateLanguagesConfig` warns on one it does not know.
export const DEFAULT_UI_STRINGS = {
  searchButton: "Search docs",
  searchDialog: "Search documentation",
  searchPlaceholder: "Search docs...",
  searchResults: "Search results",
  searching: "Searching documentation",
  noResults: "No results found",
  resultsAvailable: "{count} search results available",
  resultAvailable: "1 search result available",
  askAi: "Ask AI",
  askAiAssistant: "Ask AI Assistant",
  closeSearch: "Close search",
  onThisPage: "On this page",
  previous: "Previous",
  next: "Next",
  openNavigation: "Open navigation menu",
  closeNavigation: "Close navigation menu",
  expandGroup: "Expand {title}",
  collapseGroup: "Collapse {title}",
  enterFocusMode: "Enter focus mode",
  exitFocusMode: "Exit focus mode",
  focusMode: "Focus mode",
  copyContent: "Copy content",
  copied: "Copied!",
  copyCode: "Copy code",
  codeVariants: "Code variants",
  rss: "RSS",
  rssFeed: "RSS feed",
  viewAsMarkdown: "View as Markdown",
  toggleView: "Toggle View",
  poweredBy: "Powered by",
  githubLink: "Doccupine on GitHub",
  aiAssistant: "AI Assistant",
  resetChat: "Reset chat history",
  chatGreeting: "Hey there, how can I assist you?",
  chatPlaceholder: "Ask AI Assistant...",
  chatInputLabel: "Ask a question",
  chatAnswering: "Answering",
  chatError: "Error:",
  language: "Language",
  version: "Version",
} as const;

export type UiStringKey = keyof typeof DEFAULT_UI_STRINGS;

export const UI_STRING_KEYS: readonly string[] =
  Object.keys(DEFAULT_UI_STRINGS);
