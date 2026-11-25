// app/styles/reset.css: the cascade layer order for every stylesheet of the
// site (it is imported first), then the box model and the element resets.
export const resetCss = `/* The cascade layers of the site's stylesheets, lowest priority first.
   Unlayered CSS (your own stylesheet) wins over all of them. */
@layer reset, tokens, base, components, design, utilities;

@layer reset {
  * {
    box-sizing: border-box;
    min-width: 0;
  }

  ol,
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    max-width: 100%;
  }

  figure {
    margin: 0;
  }

  fieldset {
    appearance: none;
    border: none;
  }
}
`;
