export const styledDTemplate = `import "styled-components";
import { Theme } from "@/app/theme";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
`;
