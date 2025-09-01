export const clickOutsideTemplate = `import { RefObject, useEffect } from "react";

export function useOnClickOutside(
  refs: RefObject<HTMLElement | null>[],
  cb: () => void,
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        refs &&
        refs
          .map(
            (ref) =>
              ref && ref.current && ref.current.contains(event.target as Node),
          )
          .every((i) => i === false)
      ) {
        cb();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [refs, cb]);
}
`;
