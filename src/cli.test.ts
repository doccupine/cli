import { EventEmitter } from "node:events";
import fs from "fs-extra";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { superviseWatchLifecycle } from "./cli.js";

class FakeChildProcess extends EventEmitter {
  pid: number | undefined;
  exitCode: number | null = null;
  signalCode: NodeJS.Signals | null = null;
  killCalls = 0;

  kill(_signal?: number | NodeJS.Signals): boolean {
    this.killCalls += 1;
    queueMicrotask(() => {
      if (this.exitCode === null && this.signalCode === null) {
        this.signalCode = "SIGTERM";
        this.emit("close", null, this.signalCode);
      }
    });
    return true;
  }
}

describe("watch lifecycle", () => {
  it("stays pending while the dev server is running", async () => {
    const child = new FakeChildProcess();
    const signals = new EventEmitter();
    const stopGenerator = vi.fn(async () => {});
    const lifecycle = superviseWatchLifecycle(child, stopGenerator, signals);
    let settled = false;
    void lifecycle.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    await Promise.resolve();

    expect(settled).toBe(false);
    expect(stopGenerator).not.toHaveBeenCalled();

    signals.emit("SIGINT");
    await lifecycle;
  });

  it("stops once and rejects when the dev server emits an error", async () => {
    const child = new FakeChildProcess();
    const signals = new EventEmitter();
    const stopGenerator = vi.fn(async () => {});
    const lifecycle = superviseWatchLifecycle(child, stopGenerator, signals);

    child.emit("error", new Error("spawn failed"));
    child.emit("close", 1, null);

    await expect(lifecycle).rejects.toThrow(
      "Error starting Next.js dev server: spawn failed",
    );
    expect(child.killCalls).toBe(0);
    expect(stopGenerator).toHaveBeenCalledOnce();
  });

  it.each([0, 1])(
    "stops once and rejects an unexpected exit with code %i",
    async (code) => {
      const child = new FakeChildProcess();
      const signals = new EventEmitter();
      const stopGenerator = vi.fn(async () => {});
      const lifecycle = superviseWatchLifecycle(child, stopGenerator, signals);

      child.exitCode = code;
      child.emit("close", code, null);

      await expect(lifecycle).rejects.toThrow(
        `Next.js dev server exited unexpectedly with code ${code}`,
      );
      expect(child.killCalls).toBe(0);
      expect(stopGenerator).toHaveBeenCalledOnce();
    },
  );

  it.each(["SIGINT", "SIGTERM"] as const)(
    "terminates the child and stops once on %s",
    async (signal) => {
      const child = new FakeChildProcess();
      const signals = new EventEmitter();
      const stopGenerator = vi.fn(async () => {});
      const lifecycle = superviseWatchLifecycle(child, stopGenerator, signals);

      signals.emit(signal);
      child.emit("close", null, "SIGTERM");
      signals.emit(signal === "SIGINT" ? "SIGTERM" : "SIGINT");

      await expect(lifecycle).resolves.toBe(signal);
      expect(child.killCalls).toBe(1);
      expect(stopGenerator).toHaveBeenCalledOnce();
    },
  );
});

describe("package metadata", () => {
  it("requires Node.js 22.12.0 or newer", async () => {
    const packageJsonPath = fileURLToPath(
      new URL("../package.json", import.meta.url),
    );
    const packageJson = (await fs.readJson(packageJsonPath)) as {
      engines?: { node?: string };
    };

    expect(packageJson.engines?.node).toBe(">=22.12.0");
  });
});
