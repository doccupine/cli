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

  it("defaults OpenAI to gpt-4.1-mini at temperature 0", async () => {
    const config = (await loadConfig()).getLLMConfig();
    expect(config.chatModel).toBe("gpt-4.1-mini");
    expect(config.temperature).toBe(0);
  });

  it("uses a valid LLM_TEMPERATURE within the provider's range", async () => {
    vi.stubEnv("LLM_TEMPERATURE", "1.5");
    expect((await loadConfig()).getLLMConfig().temperature).toBe(1.5);

    vi.stubEnv("LLM_PROVIDER", "anthropic");
    vi.stubEnv("LLM_TEMPERATURE", "1");
    expect((await loadConfig()).getLLMConfig().temperature).toBe(1);
  });

  it("sends no temperature for LLM_TEMPERATURE=default", async () => {
    vi.stubEnv("LLM_TEMPERATURE", " Default ");
    expect((await loadConfig()).getLLMConfig().temperature).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(["abc", "-1", "2.5", "NaN", "Infinity"])(
    "falls back to the default for an invalid value %s, warning once",
    async (raw) => {
      vi.stubEnv("LLM_TEMPERATURE", raw);
      const { getLLMConfig } = await loadConfig();
      expect(getLLMConfig().temperature).toBe(0);
      expect(getLLMConfig().temperature).toBe(0);
      expect(warn).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects a value above Anthropic's range of 0 to 1", async () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    vi.stubEnv("LLM_TEMPERATURE", "1.5");
    expect((await loadConfig()).getLLMConfig().temperature).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each([
    "gpt-5",
    "gpt-5-mini",
    "gpt-5.6-luna",
    "gpt-10",
    "o1",
    "o3-mini",
    "o4-mini",
    "openai/gpt-5.6-luna",
  ])("sends no temperature to %s", async (model) => {
    vi.stubEnv("LLM_CHAT_MODEL", model);
    expect((await loadConfig()).getLLMConfig().temperature).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("drops an explicit temperature for a model that rejects one, warning once", async () => {
    vi.stubEnv("LLM_CHAT_MODEL", "gpt-5.6-luna");
    vi.stubEnv("LLM_TEMPERATURE", "1");
    const { getLLMConfig } = await loadConfig();
    expect(getLLMConfig().temperature).toBeUndefined();
    expect(getLLMConfig().temperature).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("gpt-5.6-luna");
  });

  it.each(["gpt-4.1", "gpt-4o-mini", "openai/gpt-4.1-mini"])(
    "keeps the temperature for %s",
    async (model) => {
      vi.stubEnv("LLM_CHAT_MODEL", model);
      expect((await loadConfig()).getLLMConfig().temperature).toBe(0);
    },
  );

  it("only applies the model check to OpenAI", async () => {
    vi.stubEnv("LLM_PROVIDER", "google");
    vi.stubEnv("LLM_CHAT_MODEL", "o3-like-model");
    expect((await loadConfig()).getLLMConfig().temperature).toBe(0);
  });
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
