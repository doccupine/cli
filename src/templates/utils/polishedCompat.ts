export const polishedCompatTemplate = `// Compatibility shim aliased over the "polished" package in next.config.ts.
//
// Every color this app paints with is a var(--color-*) reference, because that
// is what lets a statically rendered page arrive in the right theme on its
// first frame (see app/theme.ts). cherry-styled-components releases before
// 0.2.12 fade and shade theme colors with polished, which parses color strings
// in JavaScript and throws "Couldn't parse the color string" on a var()
// reference - taking the whole render down with it. These replacements do the
// same operations in CSS instead, where the custom properties resolve.
//
// Only the three functions Cherry calls are implemented, with polished's
// argument order. From 0.2.12 on Cherry uses color-mix itself, so an install
// that resolves to it imports polished nowhere and this file goes unused.

/** polished's rgba(color, alpha) - the two-argument form. */
export const rgba = (color: string, alpha: number) =>
  \`color-mix(in srgb, \${color} \${alpha * 100}%, transparent)\`;

/** polished's darken(amount, color). Mixes toward black rather than reducing
 *  HSL lightness, so the result differs slightly at large amounts. */
export const darken = (amount: number, color: string) =>
  \`color-mix(in srgb, \${color} \${(1 - amount) * 100}%, black)\`;

/** polished's lighten(amount, color). Mixes toward white; see darken. */
export const lighten = (amount: number, color: string) =>
  \`color-mix(in srgb, \${color} \${(1 - amount) * 100}%, white)\`;
`;
