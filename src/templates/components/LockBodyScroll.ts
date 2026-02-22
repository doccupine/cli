export const lockBodyScrollTemplate = `import { useEffect } from "react";

export function useLockBodyScroll(isActive: boolean) {
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 992px)");
    function update() {
      document.body.style.overflow = isActive && mql.matches ? "hidden" : "";
    }
    update();
    mql.addEventListener("change", update);
    return () => {
      mql.removeEventListener("change", update);
      document.body.style.overflow = "";
    };
  }, [isActive]);
}
`;
