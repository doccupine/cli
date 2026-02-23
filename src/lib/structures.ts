import { envExampleTemplate } from "../templates/env.example.js";
import { gitignoreTemplate } from "../templates/gitignore.js";
import { eslintConfigTemplate } from "../templates/eslint.config.js";
import { nextConfigTemplate } from "../templates/next.config.js";
import { packageJsonTemplate } from "../templates/package.js";
import { prettierrcTemplate } from "../templates/prettierrc.js";
import { prettierignoreTemplate } from "../templates/prettierignore.js";
import { proxyTemplate } from "../templates/proxy.js";
import { tsconfigTemplate } from "../templates/tsconfig.js";

import { mcpRoutesTemplate } from "../templates/app/api/mcp/route.js";
import { ragRoutesTemplate } from "../templates/app/api/rag/route.js";
import { routesTemplate } from "../templates/app/api/theme/routes.js";
import { notFoundTemplate } from "../templates/app/not-found.js";
import { themeTemplate } from "../templates/app/theme.js";

import { chatTemplate } from "../templates/components/Chat.js";
import { clickOutsideTemplate } from "../templates/components/ClickOutside.js";
import { lockBodyScrollTemplate } from "../templates/components/LockBodyScroll.js";
import { docsTemplate } from "../templates/components/Docs.js";
import { docsSideBarTemplate } from "../templates/components/DocsSideBar.js";
import { mdxComponentsTemplate } from "../templates/components/MDXComponents.js";
import { sectionNavProviderTemplate } from "../templates/components/SectionNavProvider.js";
import { sideBarTemplate } from "../templates/components/SideBar.js";

import { sectionBarTemplate } from "../templates/components/layout/SectionBar.js";
import { accordionTemplate } from "../templates/components/layout/Accordion.js";
import { actionBarTemplate } from "../templates/components/layout/ActionBar.js";
import { buttonTemplate } from "../templates/components/layout/Button.js";
import { calloutTemplate } from "../templates/components/layout/Callout.js";
import { cardTemplate } from "../templates/components/layout/Card.js";
import { cherryThemeProviderTemplate } from "../templates/components/layout/CherryThemeProvider.js";
import { clientThemeProviderTemplate } from "../templates/components/layout/ClientThemeProvider.js";
import { codeTemplate } from "../templates/components/layout/Code.js";
import { columnsTemplate } from "../templates/components/layout/Columns.js";
import { demoThemeTemplate } from "../templates/components/layout/DemoTheme.js";
import { docsComponentsTemplate } from "../templates/components/layout/DocsComponents.js";
import { docsNavigationTemplate } from "../templates/components/layout/DocsNavigation.js";
import { fieldTemplate } from "../templates/components/layout/Field.js";
import { footerTemplate } from "../templates/components/layout/Footer.js";
import { globalStylesTemplate } from "../templates/components/layout/GlobalStyles.js";
import { headerTemplate } from "../templates/components/layout/Header.js";
import { iconTemplate } from "../templates/components/layout/Icon.js";
import { pictogramsTemplate } from "../templates/components/layout/Pictograms.js";
import { sharedStyledTemplate } from "../templates/components/layout/SharedStyles.js";
import { staticLinksTemplate } from "../templates/components/layout/StaticLinks.js";
import { stepsTemplate } from "../templates/components/layout/Steps.js";
import { tabsTemplate } from "../templates/components/layout/Tabs.js";
import { themeToggleTemplate } from "../templates/components/layout/ThemeToggle.js";
import { typographyTemplate } from "../templates/components/layout/Typography.js";
import { updateTemplate } from "../templates/components/layout/Update.js";

import { mcpIndexTemplate } from "../templates/services/mcp/index.js";
import { mcpServerTemplate } from "../templates/services/mcp/server.js";
import { mcpToolsTemplate } from "../templates/services/mcp/tools.js";
import { mcpTypesTemplate } from "../templates/services/mcp/types.js";
import { llmConfigTemplate } from "../templates/services/llm/config.js";
import { llmFactoryTemplate } from "../templates/services/llm/factory.js";
import { llmIndexTemplate } from "../templates/services/llm/index.js";
import { llmTypesTemplate } from "../templates/services/llm/types.js";

import { styledDTemplate } from "../templates/types/styled.js";

import { orderNavItemsTemplate } from "../templates/utils/orderNavItems.js";
import { rateLimitTemplate } from "../templates/utils/rateLimit.js";
import { brandingTemplate } from "../templates/utils/branding.js";
import { configTemplate } from "../templates/utils/config.js";

import { accordionMdxTemplate } from "../templates/mdx/accordion.mdx.js";
import { aiAssistantMdxTemplate } from "../templates/mdx/ai-assistant.mdx.js";
import { buttonsMdxTemplate } from "../templates/mdx/buttons.mdx.js";
import { calloutsMdxTemplate } from "../templates/mdx/callouts.mdx.js";
import { cardsMdxTemplate } from "../templates/mdx/cards.mdx.js";
import { codeMdxTemplate } from "../templates/mdx/code.mdx.js";
import { columnsMdxTemplate } from "../templates/mdx/columns.mdx.js";
import { commandsMdxTemplate } from "../templates/mdx/commands.mdx.js";
import { componentsMdxTemplate } from "../templates/mdx/components.mdx.js";
import { deploymentAndHostingMdxTemplate } from "../templates/mdx/deployment-and-hosting.mdx.js";
import { fieldsMdxTemplate } from "../templates/mdx/fields.mdx.js";
import { fontsMdxTemplate } from "../templates/mdx/fonts.mdx.js";
import { globalsMdxTemplate } from "../templates/mdx/globals.mdx.js";
import { headersAndTextMdxTemplate } from "../templates/mdx/headers-and-text.mdx.js";
import { iconsMdxTemplate } from "../templates/mdx/icons.mdx.js";
import { imageAndEmbedsMdxTemplate } from "../templates/mdx/image-and-embeds.mdx.js";
import { indexMdxTemplate } from "../templates/mdx/index.mdx.js";
import { footerLinksMdxTemplate } from "../templates/mdx/footer-links.mdx.js";
import { listAndTablesMdxTemplate } from "../templates/mdx/list-and-tables.mdx.js";
import { mediaAndAssetsMdxTemplate } from "../templates/mdx/media-and-assets.mdx.js";
import { mcpMdxTemplate } from "../templates/mdx/model-context-protocol.mdx.js";
import { navigationMdxTemplate } from "../templates/mdx/navigation.mdx.js";
import { sectionsMdxTemplate } from "../templates/mdx/sections.mdx.js";
import { stepsMdxTemplate } from "../templates/mdx/steps.mdx.js";
import { tabsMdxTemplate } from "../templates/mdx/tabs.mdx.js";
import { themeMdxTemplate } from "../templates/mdx/theme.mdx.js";
import { updateMdxTemplate } from "../templates/mdx/update.mdx.js";

import { platformIndexMdxTemplate } from "../templates/mdx/platform/index.mdx.js";
import { platformFileEditorMdxTemplate } from "../templates/mdx/platform/file-editor.mdx.js";
import { platformPublishingMdxTemplate } from "../templates/mdx/platform/publishing.mdx.js";
import { platformCreatingAProjectMdxTemplate } from "../templates/mdx/platform/creating-a-project.mdx.js";
import { platformSiteSettingsMdxTemplate } from "../templates/mdx/platform/site-settings.mdx.js";
import { platformThemeSettingsMdxTemplate } from "../templates/mdx/platform/theme-settings.mdx.js";
import { platformNavigationSettingsMdxTemplate } from "../templates/mdx/platform/navigation-settings.mdx.js";
import { platformSectionsSettingsMdxTemplate } from "../templates/mdx/platform/sections-settings.mdx.js";
import { platformFontsSettingsMdxTemplate } from "../templates/mdx/platform/fonts-settings.mdx.js";
import { platformExternalLinksMdxTemplate } from "../templates/mdx/platform/external-links.mdx.js";
import { platformAiAssistantMdxTemplate } from "../templates/mdx/platform/ai-assistant.mdx.js";
import { platformCustomDomainsMdxTemplate } from "../templates/mdx/platform/custom-domains.mdx.js";
import { platformBuildAndDeployMdxTemplate } from "../templates/mdx/platform/build-and-deploy.mdx.js";
import { platformTeamMembersMdxTemplate } from "../templates/mdx/platform/team-members.mdx.js";
import { platformBillingMdxTemplate } from "../templates/mdx/platform/billing.mdx.js";
import { platformProjectSettingsMdxTemplate } from "../templates/mdx/platform/project-settings.mdx.js";

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
  "components/LockBodyScroll.ts": lockBodyScrollTemplate,
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
  "components.mdx": componentsMdxTemplate,
  "deployment-and-hosting.mdx": deploymentAndHostingMdxTemplate,
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
  "platform/build-and-deploy.mdx": platformBuildAndDeployMdxTemplate,
  "platform/team-members.mdx": platformTeamMembersMdxTemplate,
  "platform/billing.mdx": platformBillingMdxTemplate,
  "platform/project-settings.mdx": platformProjectSettingsMdxTemplate,
};
