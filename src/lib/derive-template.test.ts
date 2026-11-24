import { describe, expect, it } from "vitest";

import { deriveTemplate } from "./derive-template.js";

describe("deriveTemplate", () => {
  it("applies each edit in order", () => {
    expect(
      deriveTemplate("t", "a b c", [
        ["b", "B"],
        ["B c", "B C"],
      ]),
    ).toBe("a B C");
  });

  it("keeps replacement text literal", () => {
    expect(deriveTemplate("t", "x", [["x", "$& $1 $$"]])).toBe("$& $1 $$");
  });

  it("throws when an edit matches nothing or more than once", () => {
    expect(() => deriveTemplate("t", "abc", [["z", "y"]])).toThrow(
      "t: expected exactly one match for an edit, found 0",
    );
    expect(() => deriveTemplate("t", "aa", [["a", "b"]])).toThrow("found 2");
  });
});
