import { describe, expect, it } from "vitest";

import { orderNavItemsTemplate } from "./utils/orderNavItems.js";

describe("generated navigation ordering utility", () => {
  it("emits a whitespace regex for category slugs", () => {
    expect(orderNavItemsTemplate).toContain('.replace(/\\s+/g, "-")');
    expect(orderNavItemsTemplate).not.toContain('.replace(/s+/g, "-")');
  });
});
