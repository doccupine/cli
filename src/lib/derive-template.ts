/**
 * Builds a design's variant of a generated file from the classic template by
 * exact text edits, so the behavior both designs share is written once and a
 * design only states what it changes (an extra attribute, a different label,
 * a restyled block).
 *
 * Every `find` must occur exactly once in the source; anything else throws
 * when the module loads, so a classic edit that moves a patched spot fails
 * the build and the tests instead of silently dropping the design's change.
 */
export function deriveTemplate(
  name: string,
  source: string,
  edits: ReadonlyArray<readonly [find: string, replace: string]>,
): string {
  let result = source;
  for (const [find, replace] of edits) {
    const count = result.split(find).length - 1;
    if (count !== 1) {
      throw new Error(
        `${name}: expected exactly one match for an edit, found ${count}:\n${find}`,
      );
    }
    result = result.replace(find, () => replace);
  }
  return result;
}
