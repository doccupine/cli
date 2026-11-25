import type { DesignStyles } from "./index.js";

// Spinner (components/Spinner.tsx): a loader icon turning once a second.
//
//   .dcp-spinner    the rotating wrapper around the icon
export const spinnerStyles: DesignStyles = {
  shared: `@keyframes dcp-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dcp-spinner {
  display: inline-flex;
  animation: dcp-spin 1s linear infinite;
  color: inherit;
}`,
};
