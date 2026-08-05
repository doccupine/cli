import { envExampleTemplate } from "../templates/env.example.js";
import { gitignoreTemplate } from "../templates/gitignore.js";
import { eslintConfigTemplate } from "../templates/eslint.config.js";
import { packageJsonTemplate } from "../templates/package.js";
import { prettierrcTemplate } from "../templates/prettierrc.js";
import { prettierignoreTemplate } from "../templates/prettierignore.js";
import { npmrcTemplate } from "../templates/npmrc.js";
import { tsconfigTemplate } from "../templates/tsconfig.js";

import { gatePageTemplate } from "../templates/app/gate/page.js";
import { gateRoutesTemplate } from "../templates/app/api/gate/route.js";
import { mcpRoutesTemplate } from "../templates/app/api/mcp/route.js";
import { ragRoutesTemplate } from "../templates/app/api/rag/route.js";
import { searchRoutesTemplate } from "../templates/app/api/search/route.js";
import { notFoundTemplate } from "../templates/app/not-found.js";
import { manifestTemplate } from "../templates/app/manifest.js";
import { themeTemplate } from "../templates/app/theme.js";

import { chatTemplate } from "../templates/components/Chat.js";
import { lockBodyScrollTemplate } from "../templates/components/LockBodyScroll.js";
import { docsTemplate } from "../templates/components/Docs.js";
import { docsSideBarTemplate } from "../templates/components/DocsSideBar.js";
import { mdxComponentsTemplate } from "../templates/components/MDXComponents.js";
import { mermaidPreTemplate } from "../templates/components/MermaidPre.js";
import { mermaidViewTemplate } from "../templates/components/layout/Mermaid.js";
import { mermaidTemplate } from "../templates/utils/mermaid.js";
import { parseCodeMetaTemplate } from "../templates/utils/parseCodeMeta.js";
import { rehypeCodeMetaTemplate } from "../templates/utils/rehypeCodeMeta.js";
import { sectionNavProviderTemplate } from "../templates/components/SectionNavProvider.js";
import { postHogProviderTemplate } from "../templates/components/PostHogProvider.js";
import { postHogProviderLazyTemplate } from "../templates/components/PostHogProviderLazy.js";
import { searchDocsTemplate } from "../templates/components/SearchDocs.js";
import { searchModalContentTemplate } from "../templates/components/SearchModalContent.js";
import { sideBarTemplate } from "../templates/components/SideBar.js";
import { spinnerTemplate } from "../templates/components/Spinner.js";

import { sectionBarTemplate } from "../templates/components/layout/SectionBar.js";
import { accordionTemplate } from "../templates/components/layout/Accordion.js";
import { actionBarTemplate } from "../templates/components/layout/ActionBar.js";
import { badgeTemplate } from "../templates/components/layout/Badge.js";
import { buttonTemplate } from "../templates/components/layout/Button.js";
import { calloutTemplate } from "../templates/components/layout/Callout.js";
import { cardTemplate } from "../templates/components/layout/Card.js";
import { cherryThemeProviderTemplate } from "../templates/components/layout/CherryThemeProvider.js";
import { colorSwatchTemplate } from "../templates/components/layout/ColorSwatch.js";
import { codeTemplate } from "../templates/components/layout/Code.js";
import { columnsTemplate } from "../templates/components/layout/Columns.js";
import { demoThemeTemplate } from "../templates/components/layout/DemoTheme.js";
import { docsComponentsTemplate } from "../templates/components/layout/DocsComponents.js";
import { docsNavigationTemplate } from "../templates/components/layout/DocsNavigation.js";
import { fieldTemplate } from "../templates/components/layout/Field.js";
import { focusModeToggleTemplate } from "../templates/components/layout/FocusModeToggle.js";
import { footerTemplate } from "../templates/components/layout/Footer.js";
import { frameTemplate } from "../templates/components/layout/Frame.js";
import { globalStylesTemplate } from "../templates/components/layout/GlobalStyles.js";
import { headerTemplate } from "../templates/components/layout/Header.js";
import { iconTemplate } from "../templates/components/layout/Icon.js";
import { pictogramsTemplate } from "../templates/components/layout/Pictograms.js";
import { promptTemplate } from "../templates/components/layout/Prompt.js";
import { sharedStyledTemplate } from "../templates/components/layout/SharedStyles.js";
import { sidePanelTemplate } from "../templates/components/layout/SidePanel.js";
import { notFoundComponentTemplate } from "../templates/components/layout/NotFound.js";
import { siteGateComponentTemplate } from "../templates/components/layout/SiteGate.js";
import { slugTemplate } from "../templates/components/layout/Slug.js";
import { spaceTemplate } from "../templates/components/layout/Space.js";
import { staticLinksTemplate } from "../templates/components/layout/StaticLinks.js";
import { stepsTemplate } from "../templates/components/layout/Steps.js";
import { tabsTemplate } from "../templates/components/layout/Tabs.js";
import { tooltipTemplate } from "../templates/components/layout/Tooltip.js";
import { treeTemplate } from "../templates/components/layout/Tree.js";
import { treeDataTemplate } from "../templates/components/layout/TreeData.js";
import { typographyTemplate } from "../templates/components/layout/Typography.js";
import { updateTemplate } from "../templates/components/layout/Update.js";

import { searchServiceTemplate } from "../templates/services/search.js";
import { mcpIndexTemplate } from "../templates/services/mcp/index.js";
import { mcpServerTemplate } from "../templates/services/mcp/server.js";
import { mcpToolsTemplate } from "../templates/services/mcp/tools.js";
import { mcpTypesTemplate } from "../templates/services/mcp/types.js";
import { vectorHelpersTemplate } from "../templates/services/mcp/vector.js";
import { docsIndexStubTemplate } from "../templates/services/mcp/docsIndexStub.js";
import { docsContentStubTemplate } from "../templates/services/mcp/docsContentStub.js";
import { llmConfigTemplate } from "../templates/services/llm/config.js";
import { llmFactoryTemplate } from "../templates/services/llm/factory.js";
import { llmIndexTemplate } from "../templates/services/llm/index.js";
import { llmTypesTemplate } from "../templates/services/llm/types.js";
import { buildDocsIndexScriptTemplate } from "../templates/scripts/build-docs-index.js";

import { posthogServerTemplate } from "../templates/lib/posthog.js";
import { rssLibTemplate } from "../templates/lib/rss.js";
import { siteGateTemplate } from "../templates/lib/siteGate.js";
import { accessControlTemplate } from "../templates/lib/access.js";

import { styledDTemplate } from "../templates/types/styled.js";
import { openapiTypesTemplate } from "../templates/types/openapi.js";

import { orderNavItemsTemplate } from "../templates/utils/orderNavItems.js";
import { rateLimitTemplate } from "../templates/utils/rateLimit.js";
import { brandingTemplate } from "../templates/utils/branding.js";
import { configTemplate } from "../templates/utils/config.js";
import { iconsTemplate } from "../templates/utils/icons.js";
import { playgroundAllowlistTemplate } from "../templates/utils/playgroundAllowlist.js";
import { ssrfGuardTemplate } from "../templates/utils/ssrfGuard.js";
import { apiSnippetsTemplate } from "../templates/utils/apiSnippets.js";
import { apiPlaygroundUtilsTemplate } from "../templates/utils/apiPlayground.js";
import { requestBodyTemplate } from "../templates/utils/requestBody.js";
import { playgroundRoutesTemplate } from "../templates/app/api/playground/route.js";
import { playgroundAllowlistStubTemplate } from "../templates/services/openapi/playgroundAllowlistStub.js";
import { copyButtonTemplate } from "../templates/components/layout/CopyButton.js";
import { apiPlaygroundTemplate } from "../templates/components/layout/ApiPlayground.js";
import { apiPlaygroundDemoTemplate } from "../templates/components/layout/ApiPlaygroundDemo.js";

import { accordionMdxTemplate } from "../templates/mdx/accordion.mdx.js";
import { aiAssistantMdxTemplate } from "../templates/mdx/ai-assistant.mdx.js";
import { analyticsMdxTemplate } from "../templates/mdx/analytics.mdx.js";
import { apiPlaygroundMdxTemplate } from "../templates/mdx/api-playground.mdx.js";
import { authenticationMdxTemplate } from "../templates/mdx/authentication.mdx.js";
import { badgesMdxTemplate } from "../templates/mdx/badges.mdx.js";
import { buttonsMdxTemplate } from "../templates/mdx/buttons.mdx.js";
import { calloutsMdxTemplate } from "../templates/mdx/callouts.mdx.js";
import { cardsMdxTemplate } from "../templates/mdx/cards.mdx.js";
import { codeMdxTemplate } from "../templates/mdx/code.mdx.js";
import { colorSwatchesMdxTemplate } from "../templates/mdx/color-swatches.mdx.js";
import { columnsMdxTemplate } from "../templates/mdx/columns.mdx.js";
import { commandsMdxTemplate } from "../templates/mdx/commands.mdx.js";
import { componentsMdxTemplate } from "../templates/mdx/components.mdx.js";
import { deploymentAndHostingMdxTemplate } from "../templates/mdx/deployment-and-hosting.mdx.js";
import { fieldsMdxTemplate } from "../templates/mdx/fields.mdx.js";
import { fontsMdxTemplate } from "../templates/mdx/fonts.mdx.js";
import { globalsMdxTemplate } from "../templates/mdx/globals.mdx.js";
import { headersAndTextMdxTemplate } from "../templates/mdx/headers-and-text.mdx.js";
import { iconsMdxTemplate } from "../templates/mdx/icons.mdx.js";
import { imagesAndEmbedsMdxTemplate } from "../templates/mdx/images-and-embeds.mdx.js";
import { indexMdxTemplate } from "../templates/mdx/index.mdx.js";
import { footerLinksMdxTemplate } from "../templates/mdx/footer-links.mdx.js";
import { framesMdxTemplate } from "../templates/mdx/frames.mdx.js";
import { listsAndTablesMdxTemplate } from "../templates/mdx/lists-and-tables.mdx.js";
import { mediaAndAssetsMdxTemplate } from "../templates/mdx/media-and-assets.mdx.js";
import { mermaidMdxTemplate } from "../templates/mdx/mermaid.mdx.js";
import { mcpMdxTemplate } from "../templates/mdx/model-context-protocol.mdx.js";
import { navigationMdxTemplate } from "../templates/mdx/navigation.mdx.js";
import { promptMdxTemplate } from "../templates/mdx/prompt.mdx.js";
import { sectionsMdxTemplate } from "../templates/mdx/sections.mdx.js";
import { sidePanelMdxTemplate } from "../templates/mdx/side-panel.mdx.js";
import { spaceMdxTemplate } from "../templates/mdx/space.mdx.js";
import { stepsMdxTemplate } from "../templates/mdx/steps.mdx.js";
import { tabsMdxTemplate } from "../templates/mdx/tabs.mdx.js";
import { themeMdxTemplate } from "../templates/mdx/theme.mdx.js";
import { tooltipsMdxTemplate } from "../templates/mdx/tooltips.mdx.js";
import { treeMdxTemplate } from "../templates/mdx/tree.mdx.js";
import { updateMdxTemplate } from "../templates/mdx/update.mdx.js";
import { whatIsDoccupineMdxTemplate } from "../templates/mdx/what-is-doccupine.mdx.js";

import { platformIndexMdxTemplate } from "../templates/mdx/platform/index.mdx.js";
import { platformFileEditorMdxTemplate } from "../templates/mdx/platform/file-editor.mdx.js";
import { platformPublishingMdxTemplate } from "../templates/mdx/platform/publishing.mdx.js";
import { platformCreatingAProjectMdxTemplate } from "../templates/mdx/platform/creating-a-project.mdx.js";
import { platformImportFromGithubMdxTemplate } from "../templates/mdx/platform/import-from-github.mdx.js";
import { platformSelfUpdatingDocsMdxTemplate } from "../templates/mdx/platform/self-updating-docs.mdx.js";
import { platformSiteSettingsMdxTemplate } from "../templates/mdx/platform/site-settings.mdx.js";
import { platformThemeSettingsMdxTemplate } from "../templates/mdx/platform/theme-settings.mdx.js";
import { platformNavigationSettingsMdxTemplate } from "../templates/mdx/platform/navigation-settings.mdx.js";
import { platformFontsSettingsMdxTemplate } from "../templates/mdx/platform/fonts-settings.mdx.js";
import { platformFooterLinksMdxTemplate } from "../templates/mdx/platform/footer-links.mdx.js";
import { platformAuthenticationMdxTemplate } from "../templates/mdx/platform/authentication.mdx.js";
import { platformAnalyticsMdxTemplate } from "../templates/mdx/platform/analytics.mdx.js";
import { platformApiPlaygroundMdxTemplate } from "../templates/mdx/platform/api-playground.mdx.js";
import { platformAiAssistantMdxTemplate } from "../templates/mdx/platform/ai-assistant.mdx.js";
import { platformMcpMdxTemplate } from "../templates/mdx/platform/mcp.mdx.js";
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
  ".npmrc": npmrcTemplate,
  "eslint.config.mjs": eslintConfigTemplate,
  "package.json": packageJsonTemplate,
  "tsconfig.json": tsconfigTemplate,

  "app/not-found.tsx": notFoundTemplate,
  "app/gate/page.tsx": gatePageTemplate,
  "app/manifest.ts": manifestTemplate,
  "app/theme.ts": themeTemplate,
  "app/api/gate/route.ts": gateRoutesTemplate,
  "app/api/mcp/route.ts": mcpRoutesTemplate,
  "app/api/rag/route.ts": ragRoutesTemplate,
  "app/api/search/route.ts": searchRoutesTemplate,
  "app/api/playground/route.ts": playgroundRoutesTemplate,

  "services/search.ts": searchServiceTemplate,
  "services/mcp/index.ts": mcpIndexTemplate,
  "services/mcp/server.ts": mcpServerTemplate,
  "services/mcp/tools.ts": mcpToolsTemplate,
  "services/mcp/types.ts": mcpTypesTemplate,
  "services/mcp/vector.ts": vectorHelpersTemplate,
  "services/mcp/docs-index.json": docsIndexStubTemplate,
  "services/mcp/docs-content.json": docsContentStubTemplate,
  "services/llm/config.ts": llmConfigTemplate,
  "services/llm/factory.ts": llmFactoryTemplate,
  "services/llm/index.ts": llmIndexTemplate,
  "services/llm/types.ts": llmTypesTemplate,
  "services/openapi/playground-allowlist.json": playgroundAllowlistStubTemplate,

  "scripts/build-docs-index.mts": buildDocsIndexScriptTemplate,

  "types/styled.d.ts": styledDTemplate,
  "types/openapi.ts": openapiTypesTemplate,

  "lib/posthog.ts": posthogServerTemplate,
  "lib/rss.ts": rssLibTemplate,
  "lib/siteGate.ts": siteGateTemplate,
  "lib/access.ts": accessControlTemplate,

  "utils/branding.ts": brandingTemplate,
  "utils/mermaid.ts": mermaidTemplate,
  "utils/orderNavItems.ts": orderNavItemsTemplate,
  "utils/parseCodeMeta.ts": parseCodeMetaTemplate,
  "utils/rateLimit.ts": rateLimitTemplate,
  "utils/rehypeCodeMeta.ts": rehypeCodeMetaTemplate,
  "utils/config.ts": configTemplate,
  "utils/icons.ts": iconsTemplate,
  "utils/playgroundAllowlist.ts": playgroundAllowlistTemplate,
  "utils/ssrfGuard.ts": ssrfGuardTemplate,
  "utils/apiSnippets.ts": apiSnippetsTemplate,
  "utils/apiPlayground.ts": apiPlaygroundUtilsTemplate,
  "utils/requestBody.ts": requestBodyTemplate,

  "components/Chat.tsx": chatTemplate,
  "components/LockBodyScroll.ts": lockBodyScrollTemplate,
  "components/Docs.tsx": docsTemplate,
  "components/DocsSideBar.tsx": docsSideBarTemplate,
  "components/MDXComponents.tsx": mdxComponentsTemplate,
  "components/MermaidPre.tsx": mermaidPreTemplate,
  "components/SectionNavProvider.tsx": sectionNavProviderTemplate,
  "components/PostHogProvider.tsx": postHogProviderTemplate,
  "components/PostHogProviderLazy.tsx": postHogProviderLazyTemplate,
  "components/SearchDocs.tsx": searchDocsTemplate,
  "components/SearchModalContent.tsx": searchModalContentTemplate,
  "components/SideBar.tsx": sideBarTemplate,
  "components/Spinner.tsx": spinnerTemplate,

  "components/layout/Accordion.tsx": accordionTemplate,
  "components/layout/ActionBar.tsx": actionBarTemplate,
  "components/layout/ApiPlayground.tsx": apiPlaygroundTemplate,
  "components/layout/ApiPlaygroundDemo.tsx": apiPlaygroundDemoTemplate,
  "components/layout/Badge.tsx": badgeTemplate,
  "components/layout/Button.tsx": buttonTemplate,
  "components/layout/Callout.tsx": calloutTemplate,
  "components/layout/Card.tsx": cardTemplate,
  "components/layout/CherryThemeProvider.tsx": cherryThemeProviderTemplate,
  "components/layout/ColorSwatch.tsx": colorSwatchTemplate,
  "components/layout/Code.tsx": codeTemplate,
  "components/layout/CopyButton.tsx": copyButtonTemplate,
  "components/layout/Columns.tsx": columnsTemplate,
  "components/layout/DemoTheme.tsx": demoThemeTemplate,
  "components/layout/DocsComponents.tsx": docsComponentsTemplate,
  "components/layout/DocsNavigation.tsx": docsNavigationTemplate,
  "components/layout/SectionBar.tsx": sectionBarTemplate,
  "components/layout/Field.tsx": fieldTemplate,
  "components/layout/FocusModeToggle.tsx": focusModeToggleTemplate,
  "components/layout/Footer.tsx": footerTemplate,
  "components/layout/Frame.tsx": frameTemplate,
  "components/layout/GlobalStyles.ts": globalStylesTemplate,
  "components/layout/Header.tsx": headerTemplate,
  "components/layout/Icon.tsx": iconTemplate,
  "components/layout/Mermaid.tsx": mermaidViewTemplate,
  "components/layout/Pictograms.tsx": pictogramsTemplate,
  "components/layout/Prompt.tsx": promptTemplate,
  "components/layout/SharedStyled.ts": sharedStyledTemplate,
  "components/layout/SidePanel.tsx": sidePanelTemplate,
  "components/layout/NotFound.tsx": notFoundComponentTemplate,
  "components/layout/SiteGate.tsx": siteGateComponentTemplate,
  "components/layout/Slug.ts": slugTemplate,
  "components/layout/Space.tsx": spaceTemplate,
  "components/layout/StaticLinks.tsx": staticLinksTemplate,
  "components/layout/Steps.tsx": stepsTemplate,
  "components/layout/Tabs.tsx": tabsTemplate,
  "components/layout/Tooltip.tsx": tooltipTemplate,
  "components/layout/Tree.tsx": treeTemplate,
  "components/layout/TreeData.ts": treeDataTemplate,
  "components/layout/Typography.ts": typographyTemplate,
  "components/layout/Update.tsx": updateTemplate,
};

// Files generated by earlier CLI versions that no longer exist in the
// template set. Unlike app/ (wiped on every run), components/ and friends
// are only overwritten, so upgraded projects would otherwise keep stale
// copies around — failing lint or importing modules that are gone.
export const obsoleteFiles: string[] = [
  "components/ClickOutside.ts",
  "utils/polishedCompat.ts",
  "components/layout/ClientThemeProvider.tsx",
  "components/layout/ThemeToggle.tsx",
];

export const startingDocsStructure: Record<string, string> = {
  "accordion.mdx": accordionMdxTemplate,
  "ai-assistant.mdx": aiAssistantMdxTemplate,
  "analytics.mdx": analyticsMdxTemplate,
  "api-playground.mdx": apiPlaygroundMdxTemplate,
  "authentication.mdx": authenticationMdxTemplate,
  "badges.mdx": badgesMdxTemplate,
  "buttons.mdx": buttonsMdxTemplate,
  "callouts.mdx": calloutsMdxTemplate,
  "cards.mdx": cardsMdxTemplate,
  "code.mdx": codeMdxTemplate,
  "color-swatches.mdx": colorSwatchesMdxTemplate,
  "columns.mdx": columnsMdxTemplate,
  "commands.mdx": commandsMdxTemplate,
  "components.mdx": componentsMdxTemplate,
  "deployment-and-hosting.mdx": deploymentAndHostingMdxTemplate,
  "fields.mdx": fieldsMdxTemplate,
  "fonts.mdx": fontsMdxTemplate,
  "globals.mdx": globalsMdxTemplate,
  "headers-and-text.mdx": headersAndTextMdxTemplate,
  "icons.mdx": iconsMdxTemplate,
  "images-and-embeds.mdx": imagesAndEmbedsMdxTemplate,
  "index.mdx": indexMdxTemplate,
  "footer-links.mdx": footerLinksMdxTemplate,
  "frames.mdx": framesMdxTemplate,
  "lists-and-tables.mdx": listsAndTablesMdxTemplate,
  "media-and-assets.mdx": mediaAndAssetsMdxTemplate,
  "mermaid.mdx": mermaidMdxTemplate,
  "model-context-protocol.mdx": mcpMdxTemplate,
  "navigation.mdx": navigationMdxTemplate,
  "prompt.mdx": promptMdxTemplate,
  "sections.mdx": sectionsMdxTemplate,
  "side-panel.mdx": sidePanelMdxTemplate,
  "space.mdx": spaceMdxTemplate,
  "steps.mdx": stepsMdxTemplate,
  "tabs.mdx": tabsMdxTemplate,
  "theme.mdx": themeMdxTemplate,
  "tooltips.mdx": tooltipsMdxTemplate,
  "tree.mdx": treeMdxTemplate,
  "update.mdx": updateMdxTemplate,
  "what-is-doccupine.mdx": whatIsDoccupineMdxTemplate,
  "platform/index.mdx": platformIndexMdxTemplate,
  "platform/file-editor.mdx": platformFileEditorMdxTemplate,
  "platform/publishing.mdx": platformPublishingMdxTemplate,
  "platform/creating-a-project.mdx": platformCreatingAProjectMdxTemplate,
  "platform/import-from-github.mdx": platformImportFromGithubMdxTemplate,
  "platform/self-updating-docs.mdx": platformSelfUpdatingDocsMdxTemplate,
  "platform/site-settings.mdx": platformSiteSettingsMdxTemplate,
  "platform/theme-settings.mdx": platformThemeSettingsMdxTemplate,
  "platform/navigation-settings.mdx": platformNavigationSettingsMdxTemplate,
  "platform/fonts-settings.mdx": platformFontsSettingsMdxTemplate,
  "platform/footer-links.mdx": platformFooterLinksMdxTemplate,
  "platform/authentication.mdx": platformAuthenticationMdxTemplate,
  "platform/analytics.mdx": platformAnalyticsMdxTemplate,
  "platform/ai-assistant.mdx": platformAiAssistantMdxTemplate,
  "platform/mcp.mdx": platformMcpMdxTemplate,
  "platform/api-playground.mdx": platformApiPlaygroundMdxTemplate,
  "platform/custom-domains.mdx": platformCustomDomainsMdxTemplate,
  "platform/build-and-deploy.mdx": platformBuildAndDeployMdxTemplate,
  "platform/team-members.mdx": platformTeamMembersMdxTemplate,
  "platform/billing.mdx": platformBillingMdxTemplate,
  "platform/project-settings.mdx": platformProjectSettingsMdxTemplate,
};
