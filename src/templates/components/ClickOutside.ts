export const clickOutsideTemplate = `import { RefObject, useCallback, useEffect } from "react";

export function useOnClickOutside(
  refs: RefObject<HTMLElement | null>[],
  cb: () => void,
) {
  // Stable callback ref to avoid re-subscribing on every render
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        refs.every(
          (ref) => !ref.current || !ref.current.contains(event.target as Node),
        )
      ) {
        cb();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...refs, cb],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);
}
`;
