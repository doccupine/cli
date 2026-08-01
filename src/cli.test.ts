import { EventEmitter } from "node:events";
import fs from "fs-extra";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { reportCliError, superviseWatchLifecycle } from "./cli.js";

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

describe("reportCliError", () => {
  function captureErrors(error: unknown, argv: string[] = []): string {
    const lines: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    });
    reportCliError(error, argv);
    return lines.join("\n");
  }

  it("leads with the actionable message instead of a stack trace", () => {
    const error = new Error("Refusing to overwrite non-empty directory /site.");
    error.stack = "Error: Refusing\n    at claimOutputDirectory (out.js:1:1)";

    const output = captureErrors(error);

    expect(output).toContain(
      "Refusing to overwrite non-empty directory /site.",
    );
    expect(output).not.toContain("at claimOutputDirectory");
    expect(output).toContain("--verbose");
  });

  it("prints the stack when --verbose asked for it", () => {
    const error = new Error("boom");
    error.stack = "Error: boom\n    at somewhere (out.js:1:1)";

    const output = captureErrors(error, ["node", "doccupine", "--verbose"]);

    expect(output).toContain("at somewhere");
  });

  it("unwraps causes and aggregate members under the summary", () => {
    const output = captureErrors(
      new AggregateError(
        [
          new Error("watcher close failed", { cause: new Error("EBUSY") }),
          new Error("generator stop failed"),
        ],
        "Failed to shut down cleanly",
      ),
    );

    expect(output).toContain("❌ Failed to shut down cleanly");
    expect(output).toContain("↳ watcher close failed");
    expect(output).toContain("↳ EBUSY");
    expect(output).toContain("↳ generator stop failed");
  });

  it("survives a self-referencing cause chain", () => {
    const error = new Error("looping") as Error & { cause?: unknown };
    error.cause = error;

    expect(() => captureErrors(error)).not.toThrow();
  });

  it("reports a non-Error rejection", () => {
    expect(captureErrors("plain string failure")).toContain(
      "plain string failure",
    );
  });
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
