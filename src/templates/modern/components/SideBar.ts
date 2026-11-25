import { deriveTemplate } from "../../../lib/derive-template.js";
import { sideBarTemplate } from "../../components/SideBar.js";

// The classic SideBar.tsx with the modern design's edits. Rows still indent
// 14px per nesting level, but their base inset comes from the stylesheet
// (--sidebar-row-inset), so the modern styles can line the links up with the
// group label's text. The footer swaps Cherry's ThemeToggle for a switch drawn
// like the page header's view toggle.
export const modernSideBarTemplate = deriveTemplate(
  "modern components/SideBar.tsx",
  sideBarTemplate,
  [
    [
      'import { Space, ThemeToggle } from "cherry-styled-components";',
      'import { Space, useColorMode } from "cherry-styled-components";',
    ],
    [
      "  StyledSidebarFooterToggle,\n",
      "  StyledSidebarFooterToggle,\n  StyledThemeSwitch,\n",
    ],
    [
      "function SideBar({ result, pages = [] }: SideBarProps) {",
      `// Light/dark switch. The knob follows the dark class on <html> in CSS;
// useColorMode only reports the state to assistive tech. Cmd/Ctrl+Shift+L
// flips the mode too, the chord Cherry's ThemeToggle binds.
function ThemeSwitch() {
  const { mode, toggleTheme } = useColorMode();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== "l") return;
      e.preventDefault();
      toggleTheme();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return (
    <StyledThemeSwitch
      type="button"
      role="switch"
      aria-checked={mode === "dark"}
      aria-label="Dark mode"
      title="Dark mode (⌘⇧L)"
      onClick={toggleTheme}
    >
      <Icon name="Sun" />
      <Icon name="MoonStar" />
    </StyledThemeSwitch>
  );
}

function SideBar({ result, pages = [] }: SideBarProps) {`,
    ],
    ["            <ThemeToggle $shortcut />", "            <ThemeSwitch />"],
    [
      "const indent = { paddingLeft: `${20 + depth * 14}px` };",
      "const indent = {\n    paddingLeft: `calc(var(--sidebar-row-inset, 20px) + ${depth * 14}px)`,\n  };",
    ],
  ],
);
