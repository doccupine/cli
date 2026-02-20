import { envExampleTemplate } from "./env.example.js";
import { gitignoreTemplate } from "./gitignore.js";
import { eslintConfigTemplate } from "./eslint.config.js";
import { nextConfigTemplate } from "./next.config.js";
import { packageJsonTemplate } from "./package.js";
import { prettierrcTemplate } from "./prettierrc.js";
import { prettierignoreTemplate } from "./prettierignore.js";
import { proxyTemplate } from "./proxy.js";
import { tsconfigTemplate } from "./tsconfig.js";

import { mcpRoutesTemplate } from "./app/api/mcp/route.js";
import { ragRoutesTemplate } from "./app/api/rag/route.js";
import { routesTemplate } from "./app/api/theme/routes.js";
import { notFoundTemplate } from "./app/not-found.js";
import { themeTemplate } from "./app/theme.js";

import { chatTemplate } from "./components/Chat.js";
import { clickOutsideTemplate } from "./components/ClickOutside.js";
import { docsTemplate } from "./components/Docs.js";
import { docsSideBarTemplate } from "./components/DocsSideBar.js";
import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { sectionNavProviderTemplate } from "./components/SectionNavProvider.js";
import { sideBarTemplate } from "./components/SideBar.js";

import { sectionBarTemplate } from "./components/layout/SectionBar.js";
import { accordionTemplate } from "./components/layout/Accordion.js";
import { actionBarTemplate } from "./components/layout/ActionBar.js";
import { buttonTemplate } from "./components/layout/Button.js";
import { calloutTemplate } from "./components/layout/Callout.js";
import { cardTemplate } from "./components/layout/Card.js";
import { cherryThemeProviderTemplate } from "./components/layout/CherryThemeProvider.js";
import { clientThemeProviderTemplate } from "./components/layout/ClientThemeProvider.js";
import { codeTemplate } from "./components/layout/Code.js";
import { columnsTemplate } from "./components/layout/Columns.js";
import { demoThemeTemplate } from "./components/layout/DemoTheme.js";
import { docsComponentsTemplate } from "./components/layout/DocsComponents.js";
import { docsNavigationTemplate } from "./components/layout/DocsNavigation.js";
import { fieldTemplate } from "./components/layout/Field.js";
import { footerTemplate } from "./components/layout/Footer.js";
import { globalStylesTemplate } from "./components/layout/GlobalStyles.js";
import { headerTemplate } from "./components/layout/Header.js";
import { iconTemplate } from "./components/layout/Icon.js";
import { pictogramsTemplate } from "./components/layout/Pictograms.js";
import { sharedStyledTemplate } from "./components/layout/SharedStyles.js";
import { staticLinksTemplate } from "./components/layout/StaticLinks.js";
import { stepsTemplate } from "./components/layout/Steps.js";
import { tabsTemplate } from "./components/layout/Tabs.js";
import { themeToggleTemplate } from "./components/layout/ThemeToggle.js";
import { typographyTemplate } from "./components/layout/Typography.js";
import { updateTemplate } from "./components/layout/Update.js";

import { mcpIndexTemplate } from "./services/mcp/index.js";
import { mcpServerTemplate } from "./services/mcp/server.js";
import { mcpToolsTemplate } from "./services/mcp/tools.js";
import { mcpTypesTemplate } from "./services/mcp/types.js";
import { llmConfigTemplate } from "./services/llm/config.js";
import { llmFactoryTemplate } from "./services/llm/factory.js";
import { llmIndexTemplate } from "./services/llm/index.js";
import { llmTypesTemplate } from "./services/llm/types.js";

import { styledDTemplate } from "./types/styled.js";

import { orderNavItemsTemplate } from "./utils/orderNavItems.js";
import { rateLimitTemplate } from "./utils/rateLimit.js";
import { brandingTemplate } from "./utils/branding.js";
import { configTemplate } from "./utils/config.js";

import { accordionMdxTemplate } from "./mdx/accordion.mdx.js";
import { aiAssistantMdxTemplate } from "./mdx/ai-assistant.mdx.js";
import { buttonsMdxTemplate } from "./mdx/buttons.mdx.js";
import { calloutsMdxTemplate } from "./mdx/callouts.mdx.js";
import { cardsMdxTemplate } from "./mdx/cards.mdx.js";
import { codeMdxTemplate } from "./mdx/code.mdx.js";
import { columnsMdxTemplate } from "./mdx/columns.mdx.js";
import { commandsMdxTemplate } from "./mdx/commands.mdx.js";
import { deploymentMdxTemplate } from "./mdx/deployment.mdx.js";
import { fieldsMdxTemplate } from "./mdx/fields.mdx.js";
import { fontsMdxTemplate } from "./mdx/fonts.mdx.js";
import { globalsMdxTemplate } from "./mdx/globals.mdx.js";
import { headersAndTextMdxTemplate } from "./mdx/headers-and-text.mdx.js";
import { iconsMdxTemplate } from "./mdx/icons.mdx.js";
import { imageAndEmbedsMdxTemplate } from "./mdx/image-and-embeds.mdx.js";
import { indexMdxTemplate } from "./mdx/index.mdx.js";
import { footerLinksMdxTemplate } from "./mdx/footer-links.mdx.js";
import { listAndTablesMdxTemplate } from "./mdx/list-and-tables.mdx.js";
import { mediaAndAssetsMdxTemplate } from "./mdx/media-and-assets.mdx.js";
import { mcpMdxTemplate } from "./mdx/model-context-protocol.mdx.js";
import { navigationMdxTemplate } from "./mdx/navigation.mdx.js";
import { sectionsMdxTemplate } from "./mdx/sections.mdx.js";
import { stepsMdxTemplate } from "./mdx/steps.mdx.js";
import { tabsMdxTemplate } from "./mdx/tabs.mdx.js";
import { themeMdxTemplate } from "./mdx/theme.mdx.js";
import { updateMdxTemplate } from "./mdx/update.mdx.js";

import { platformIndexMdxTemplate } from "./mdx/platform/index.mdx.js";
import { platformFileEditorMdxTemplate } from "./mdx/platform/file-editor.mdx.js";
import { platformPublishingMdxTemplate } from "./mdx/platform/publishing.mdx.js";
import { platformCreatingAProjectMdxTemplate } from "./mdx/platform/creating-a-project.mdx.js";
import { platformSiteSettingsMdxTemplate } from "./mdx/platform/site-settings.mdx.js";
import { platformThemeSettingsMdxTemplate } from "./mdx/platform/theme-settings.mdx.js";
import { platformNavigationSettingsMdxTemplate } from "./mdx/platform/navigation-settings.mdx.js";
import { platformSectionsSettingsMdxTemplate } from "./mdx/platform/sections-settings.mdx.js";
import { platformFontsSettingsMdxTemplate } from "./mdx/platform/fonts-settings.mdx.js";
import { platformExternalLinksMdxTemplate } from "./mdx/platform/external-links.mdx.js";
import { platformAiAssistantMdxTemplate } from "./mdx/platform/ai-assistant.mdx.js";
import { platformCustomDomainsMdxTemplate } from "./mdx/platform/custom-domains.mdx.js";
import { platformDeploymentsMdxTemplate } from "./mdx/platform/deployments.mdx.js";
import { platformTeamMembersMdxTemplate } from "./mdx/platform/team-members.mdx.js";
import { platformBillingMdxTemplate } from "./mdx/platform/billing.mdx.js";
import { platformProjectSettingsMdxTemplate } from "./mdx/platform/project-settings.mdx.js";

export const appStructure: Record<string, string> = {
  ".env.example": envExampleTemplate,
  ".gitignore": gitignoreTemplate,
  ".prettierrc": prettierrcTemplate,
  ".prettierignore": prettierignoreTemplate,
  "eslint.config.mjs": eslintConfigTemplate,
  "next.config.ts": nextConfigTemplate,
  "package.json": packageJsonTemplate,
  "proxy.ts": proxyTemplate,
  "tsconfig.json": tsconfigTemplate,

  "app/not-found.tsx": notFoundTemplate,
  "app/theme.ts": themeTemplate,
  "app/api/mcp/route.ts": mcpRoutesTemplate,
  "app/api/rag/route.ts": ragRoutesTemplate,
  "app/api/theme/route.ts": routesTemplate,

  "services/mcp/index.ts": mcpIndexTemplate,
  "services/mcp/server.ts": mcpServerTemplate,
  "services/mcp/tools.ts": mcpToolsTemplate,
  "services/mcp/types.ts": mcpTypesTemplate,
  "services/llm/config.ts": llmConfigTemplate,
  "services/llm/factory.ts": llmFactoryTemplate,
  "services/llm/index.ts": llmIndexTemplate,
  "services/llm/types.ts": llmTypesTemplate,

  "types/styled.d.ts": styledDTemplate,

  "utils/branding.ts": brandingTemplate,
  "utils/orderNavItems.ts": orderNavItemsTemplate,
  "utils/rateLimit.ts": rateLimitTemplate,
  "utils/config.ts": configTemplate,

  "components/Chat.tsx": chatTemplate,
  "components/ClickOutside.ts": clickOutsideTemplate,
  "components/Docs.tsx": docsTemplate,
  "components/DocsSideBar.tsx": docsSideBarTemplate,
  "components/MDXComponents.tsx": mdxComponentsTemplate,
  "components/SectionNavProvider.tsx": sectionNavProviderTemplate,
  "components/SideBar.tsx": sideBarTemplate,

  "components/layout/Accordion.tsx": accordionTemplate,
  "components/layout/ActionBar.tsx": actionBarTemplate,
  "components/layout/Button.tsx": buttonTemplate,
  "components/layout/Callout.tsx": calloutTemplate,
  "components/layout/Card.tsx": cardTemplate,
  "components/layout/CherryThemeProvider.tsx": cherryThemeProviderTemplate,
  "components/layout/ClientThemeProvider.tsx": clientThemeProviderTemplate,
  "components/layout/Code.tsx": codeTemplate,
  "components/layout/Columns.tsx": columnsTemplate,
  "components/layout/DemoTheme.tsx": demoThemeTemplate,
  "components/layout/DocsComponents.tsx": docsComponentsTemplate,
  "components/layout/DocsNavigation.tsx": docsNavigationTemplate,
  "components/layout/SectionBar.tsx": sectionBarTemplate,
  "components/layout/Field.tsx": fieldTemplate,
  "components/layout/Footer.tsx": footerTemplate,
  "components/layout/GlobalStyles.ts": globalStylesTemplate,
  "components/layout/Header.tsx": headerTemplate,
  "components/layout/Icon.tsx": iconTemplate,
  "components/layout/Pictograms.tsx": pictogramsTemplate,
  "components/layout/SharedStyled.ts": sharedStyledTemplate,
  "components/layout/StaticLinks.tsx": staticLinksTemplate,
  "components/layout/Steps.tsx": stepsTemplate,
  "components/layout/Tabs.tsx": tabsTemplate,
  "components/layout/ThemeToggle.tsx": themeToggleTemplate,
  "components/layout/Typography.ts": typographyTemplate,
  "components/layout/Update.tsx": updateTemplate,
};

export const startingDocsStructure: Record<string, string> = {
  "accordion.mdx": accordionMdxTemplate,
  "ai-assistant.mdx": aiAssistantMdxTemplate,
  "buttons.mdx": buttonsMdxTemplate,
  "callouts.mdx": calloutsMdxTemplate,
  "cards.mdx": cardsMdxTemplate,
  "code.mdx": codeMdxTemplate,
  "columns.mdx": columnsMdxTemplate,
  "commands.mdx": commandsMdxTemplate,
  "deployment.mdx": deploymentMdxTemplate,
  "fields.mdx": fieldsMdxTemplate,
  "fonts.mdx": fontsMdxTemplate,
  "globals.mdx": globalsMdxTemplate,
  "headers-and-text.mdx": headersAndTextMdxTemplate,
  "icons.mdx": iconsMdxTemplate,
  "image-and-embeds.mdx": imageAndEmbedsMdxTemplate,
  "index.mdx": indexMdxTemplate,
  "footer-links.mdx": footerLinksMdxTemplate,
  "lists-and-tables.mdx": listAndTablesMdxTemplate,
  "media-and-assets.mdx": mediaAndAssetsMdxTemplate,
  "model-context-protocol.mdx": mcpMdxTemplate,
  "navigation.mdx": navigationMdxTemplate,
  "sections.mdx": sectionsMdxTemplate,
  "steps.mdx": stepsMdxTemplate,
  "tabs.mdx": tabsMdxTemplate,
  "theme.mdx": themeMdxTemplate,
  "update.mdx": updateMdxTemplate,
  "platform/index.mdx": platformIndexMdxTemplate,
  "platform/file-editor.mdx": platformFileEditorMdxTemplate,
  "platform/publishing.mdx": platformPublishingMdxTemplate,
  "platform/creating-a-project.mdx": platformCreatingAProjectMdxTemplate,
  "platform/site-settings.mdx": platformSiteSettingsMdxTemplate,
  "platform/theme-settings.mdx": platformThemeSettingsMdxTemplate,
  "platform/navigation-settings.mdx": platformNavigationSettingsMdxTemplate,
  "platform/sections-settings.mdx": platformSectionsSettingsMdxTemplate,
  "platform/fonts-settings.mdx": platformFontsSettingsMdxTemplate,
  "platform/external-links.mdx": platformExternalLinksMdxTemplate,
  "platform/ai-assistant.mdx": platformAiAssistantMdxTemplate,
  "platform/custom-domains.mdx": platformCustomDomainsMdxTemplate,
  "platform/deployments.mdx": platformDeploymentsMdxTemplate,
  "platform/team-members.mdx": platformTeamMembersMdxTemplate,
  "platform/billing.mdx": platformBillingMdxTemplate,
  "platform/project-settings.mdx": platformProjectSettingsMdxTemplate,
};
