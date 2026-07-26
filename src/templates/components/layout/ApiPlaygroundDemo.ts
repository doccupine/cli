export const apiPlaygroundDemoTemplate = `"use client";
import dynamic from "next/dynamic";
import type { OperationDescriptor } from "@/types/openapi";
import type { AllowlistEntry } from "@/utils/playgroundAllowlist";

// Lazy-load the playground so it only ships to pages that actually render the
// demo (this wrapper is registered globally for MDX, but the heavy component
// stays in its own chunk). SSR is left on (the default) so the compact bar is
// present in the initial HTML and does not flash in after hydration - the
// modal is closed on first render, so there is nothing browser-only to run.
const ApiPlayground = dynamic(() =>
  import("@/components/layout/ApiPlayground").then((m) => m.ApiPlayground),
);

// A self-contained live demo for the docs. It calls a public, CORS-enabled test
// API in direct mode, so it works even without a configured OpenAPI spec. The
// server proxy is unaffected - it still only forwards to allowlisted servers;
// this inline allowlist only relaxes the client-side pre-flight for the demo.
const DEMO_OPERATION: OperationDescriptor = {
  specName: "demo",
  operationId: "createPost",
  method: "post",
  path: "/posts",
  summary: "Create a post",
  description:
    "Creates a blog post for a user. This demo calls JSONPlaceholder, a free public test API, so it is safe to run - it echoes your request back with a new id. Edit the body below and press Send.",
  tags: ["Posts"],
  parameters: [],
  requestBody: {
    required: true,
    content: [
      {
        contentType: "application/json",
        schema: {
          type: "object",
          required: ["title", "userId"],
          properties: {
            title: { type: "string", description: "The title of the post." },
            body: { type: "string", description: "The post's body text." },
            userId: {
              type: "integer",
              description: "Id of the user creating the post.",
            },
          },
        },
        example: {
          title: "Hello from the playground",
          body: "This request was sent straight from the docs.",
          userId: 1,
        },
      },
    ],
  },
  responses: [
    {
      status: "201",
      description: "The created post, echoed back with a new id.",
      content: [{ contentType: "application/json" }],
      headers: [],
    },
  ],
  servers: [{ url: "https://jsonplaceholder.typicode.com" }],
  security: [],
  slug: "",
  endpointAnchor: "demo",
};

const DEMO_ALLOWLIST: AllowlistEntry[] = [
  { scheme: "https", host: "jsonplaceholder.typicode.com", port: null },
];

export function ApiPlaygroundDemo() {
  return (
    <ApiPlayground
      operation={DEMO_OPERATION}
      allowlist={DEMO_ALLOWLIST}
      defaultMode="direct"
    />
  );
}
`;
