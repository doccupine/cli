import { stripTypeScriptTypes } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { llmConfigTemplate } from "./config.js";
import { llmFactoryTemplate } from "./factory.js";

type LLMConfig = { chatModel: string; temperature?: number };
type ConfigModule = { getLLMConfig: () => LLMConfig };

// The generated module only imports types, so it runs once they are stripped. A fresh
// import per test resets its warn-once state.
async function loadConfig(): Promise<ConfigModule> {
  const js = stripTypeScriptTypes(llmConfigTemplate);
  const nonce = `\n// ${Math.random()}`;
  return import(
    `data:text/javascript,${encodeURIComponent(js + nonce)}`
  ) as Promise<ConfigModule>;
}

const ENV_KEYS = [
  "LLM_PROVIDER",
  "LLM_CHAT_MODEL",
  "LLM_TEMPERATURE",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
];

describe("generated LLM config temperature", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    for (const key of ENV_KEYS) vi.stubEnv(key, "");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    vi.stubEnv("GOOGLE_API_KEY", "g-test");
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it.each([
    ["openai", "gpt-6-luna"],
    ["anthropic", "claude-haiku-5-5"],
    ["google", "gemini-3.5-flash-lite"],
  ])("defaults %s to %s with no temperature", async (provider, model) => {
    vi.stubEnv("LLM_PROVIDER", provider);
    const config = (await loadConfig()).getLLMConfig();
    expect(config.chatModel).toBe(model);
    expect(config.temperature).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("uses a valid LLM_TEMPERATURE within the provider's range", async () => {
    vi.stubEnv("LLM_CHAT_MODEL", "gpt-4.1");
    vi.stubEnv("LLM_TEMPERATURE", "1.5");
    expect((await loadConfig()).getLLMConfig().temperature).toBe(1.5);

    vi.stubEnv("LLM_PROVIDER", "google");
    vi.stubEnv("LLM_CHAT_MODEL", "gemini-2.5-flash");
    vi.stubEnv("LLM_TEMPERATURE", "2");
    expect((await loadConfig()).getLLMConfig().temperature).toBe(2);
  });

  it("defaults to temperature 0 for a model that accepts one", async () => {
    vi.stubEnv("LLM_CHAT_MODEL", "gpt-4.1");
    expect((await loadConfig()).getLLMConfig().temperature).toBe(0);
  });

  it("sends no temperature for LLM_TEMPERATURE=default", async () => {
    vi.stubEnv("LLM_CHAT_MODEL", "gpt-4.1");
    vi.stubEnv("LLM_TEMPERATURE", " Default ");
    expect((await loadConfig()).getLLMConfig().temperature).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(["abc", "-1", "2.5", "NaN", "Infinity"])(
    "falls back to the default for an invalid value %s, warning once",
    async (raw) => {
      vi.stubEnv("LLM_CHAT_MODEL", "gpt-4.1");
      vi.stubEnv("LLM_TEMPERATURE", raw);
      const { getLLMConfig } = await loadConfig();
      expect(getLLMConfig().temperature).toBe(0);
      expect(getLLMConfig().temperature).toBe(0);
      expect(warn).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    "gpt-5",
    "gpt-5-mini",
    "gpt-5.6-luna",
    "gpt-6-luna",
    "gpt-6.1-terra",
    "gpt-10",
    "o1",
    "o3-mini",
    "o4-mini",
    "openai/gpt-5.6-luna",
  ])("sends no temperature to OpenAI's %s", async (model) => {
    vi.stubEnv("LLM_CHAT_MODEL", model);
    expect((await loadConfig()).getLLMConfig().temperature).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-4-hydrogen",
    "models/gemini-3.6-flash",
  ])("sends no temperature to Google's %s", async (model) => {
    vi.stubEnv("LLM_PROVIDER", "google");
    vi.stubEnv("LLM_CHAT_MODEL", model);
    expect((await loadConfig()).getLLMConfig().temperature).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(["claude-haiku-5-5", "claude-sonnet-4-6", "claude-haiku-4-5"])(
    "never sends a temperature to Anthropic's %s",
    async (model) => {
      vi.stubEnv("LLM_PROVIDER", "anthropic");
      vi.stubEnv("LLM_CHAT_MODEL", model);
      expect((await loadConfig()).getLLMConfig().temperature).toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["openai", "gpt-6-luna", "1"],
    ["anthropic", "claude-haiku-5-5", "0.5"],
    ["anthropic", "claude-haiku-5-5", "abc"],
    ["google", "gemini-3.5-flash-lite", "0"],
  ])(
    "drops an explicit temperature for %s's %s, warning once",
    async (provider, model, raw) => {
      vi.stubEnv("LLM_PROVIDER", provider);
      vi.stubEnv("LLM_CHAT_MODEL", model);
      vi.stubEnv("LLM_TEMPERATURE", raw);
      const { getLLMConfig } = await loadConfig();
      expect(getLLMConfig().temperature).toBeUndefined();
      expect(getLLMConfig().temperature).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(
        `${model} does not accept a custom temperature`,
      );
    },
  );

  it.each(["gpt-4.1", "gpt-4o-mini", "openai/gpt-4.1-mini"])(
    "keeps the temperature for OpenAI's %s",
    async (model) => {
      vi.stubEnv("LLM_CHAT_MODEL", model);
      expect((await loadConfig()).getLLMConfig().temperature).toBe(0);
    },
  );

  it.each(["gemini-2.5-flash", "gemini-2.0-flash-lite", "o3-like-model"])(
    "keeps the temperature for Google's %s",
    async (model) => {
      vi.stubEnv("LLM_PROVIDER", "google");
      vi.stubEnv("LLM_CHAT_MODEL", model);
      expect((await loadConfig()).getLLMConfig().temperature).toBe(0);
    },
  );
});

describe("generated LLM factory", () => {
  it("passes a temperature to chat models only when one is set", () => {
    expect(llmFactoryTemplate).not.toContain(
      "temperature: config.temperature,\n",
    );
    expect(llmFactoryTemplate).toContain(
      "config.temperature === undefined ? {} : { temperature: config.temperature }",
    );
    expect(llmFactoryTemplate.match(/\.\.\.temperature,/g)).toHaveLength(3);
  });
});
