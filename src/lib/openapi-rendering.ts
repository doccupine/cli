import type { OperationDescriptor } from "./openapi-types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function firstLine(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.split("\n")[0]?.trim() ?? "";
}

/**
 * Builds the API-reference landing page as safe MDX. Endpoint metadata is
 * emitted through JSX string expressions, so arbitrary OpenAPI summaries,
 * paths, tags, and descriptions remain text rather than executable MDX.
 */
export function buildApiIndexBody(operations: OperationDescriptor[]): string {
  const bySpec = new Map<string, Map<string, OperationDescriptor[]>>();
  for (const operation of operations) {
    const tag = operation.tags[0] ?? "Endpoints";
    let byTag = bySpec.get(operation.specName);
    if (!byTag) {
      byTag = new Map();
      bySpec.set(operation.specName, byTag);
    }
    const endpoints = byTag.get(tag) ?? [];
    endpoints.push(operation);
    byTag.set(tag, endpoints);
  }

  const lines = [
    "# API Reference",
    "",
    `Browse all ${operations.length} API endpoint${operations.length === 1 ? "" : "s"}. Select an endpoint to view its parameters, responses, and live request playground.`,
  ];
  const multipleSpecs = bySpec.size > 1;

  for (const [specName, byTag] of bySpec) {
    if (multipleSpecs) {
      lines.push("", `<h2>{${JSON.stringify(specName)}}</h2>`);
    }
    for (const [tag, endpoints] of byTag) {
      const heading = multipleSpecs ? "h3" : "h2";
      lines.push(
        "",
        `<${heading}>{${JSON.stringify(tag)}}</${heading}>`,
        "",
        "<Columns cols={2}>",
      );

      for (const endpoint of endpoints) {
        const method = endpoint.method.toUpperCase();
        const title = endpoint.summary ?? `${method} ${endpoint.path}`;
        const description =
          firstLine(endpoint.description) ||
          `View the ${method} ${endpoint.path} endpoint.`;
        const badgeColor =
          endpoint.method === "get"
            ? "info"
            : endpoint.method === "post"
              ? "success"
              : endpoint.method === "put" || endpoint.method === "patch"
                ? "warning"
                : endpoint.method === "delete"
                  ? "error"
                  : "gray";
        lines.push(
          "",
          `<Card title={${JSON.stringify(title)}} href={${JSON.stringify(`/${endpoint.slug}`)}}>`,
          `  <Badge color=${JSON.stringify(badgeColor)} size="sm">{${JSON.stringify(method)}}</Badge>`,
          `  <code>{${JSON.stringify(endpoint.path)}}</code>`,
          `  <p>{${JSON.stringify(description)}}</p>`,
          "</Card>",
        );
      }

      lines.push("", "</Columns>");
    }
  }

  return lines.join("\n");
}

/** Minimal markdown body for an endpoint, used by the llms.txt aggregation. */
export function buildEndpointBody(
  title: string,
  methodUpper: string,
  pathKey: string,
  opRaw: any,
): string {
  const lines = [`# ${title}`, "", `\`${methodUpper} ${pathKey}\``];
  if (opRaw.description && typeof opRaw.description === "string") {
    lines.push("", opRaw.description);
  } else if (opRaw.summary && opRaw.summary !== title) {
    lines.push("", opRaw.summary);
  }
  return lines.join("\n");
}

/** Human-readable type label for a (dereferenced) JSON schema. */
function docSchemaType(schema: any): string {
  if (!schema || typeof schema !== "object") return "any";
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  if (schema.type === "array") return `array of ${docSchemaType(schema.items)}`;
  if (typeof schema.type === "string") {
    return schema.format ? `${schema.type} (${schema.format})` : schema.type;
  }
  if (schema.properties) return "object";
  if (Array.isArray(schema.enum)) return "enum";
  return "any";
}

/** Collapses a description to a single inline line safe inside JSX children. */
function inlineText(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

/** Emits untrusted prose as a JSX string expression, never as executable MDX. */
function jsxText(text: string): string {
  return `{${JSON.stringify(text)}}`;
}

function jsonCode(value: unknown): string {
  const serialized = JSON.stringify(value, null, 2) ?? "null";
  return `<Code language="json" code=${jsxText(serialized)} />`;
}

/** The object schema whose `properties` we can document (unwraps arrays). */
function objectShape(schema: any): any | null {
  if (!schema || typeof schema !== "object") return null;
  if (schema.type === "array") return objectShape(schema.items);
  if (schema.properties && typeof schema.properties === "object") return schema;
  return null;
}

/**
 * Renders one parameter/property as a `<Field>`, recursing into nested object
 * properties up to `MAX_FIELD_DEPTH` levels. Nested fields are emitted flush so
 * MDX does not treat the indentation as a code block.
 */
const MAX_FIELD_DEPTH = 2;
function renderDocField(
  name: string,
  schema: any,
  required: boolean,
  description: string | undefined,
  depth: number,
): string {
  const type = docSchemaType(schema);
  const desc = inlineText(description ?? schema?.description);
  const lines = [
    `<Field value={${JSON.stringify(name)}} type={${JSON.stringify(type)}}${required ? " required" : ""}>`,
  ];
  if (desc) lines.push(jsxText(desc));
  const shape = depth < MAX_FIELD_DEPTH ? objectShape(schema) : null;
  if (shape) {
    const req: string[] = Array.isArray(shape.required) ? shape.required : [];
    for (const [propName, propSchema] of Object.entries(shape.properties)) {
      lines.push(
        renderDocField(
          propName,
          propSchema,
          req.includes(propName),
          undefined,
          depth + 1,
        ),
      );
    }
  }
  lines.push(`</Field>`);
  return lines.join("\n");
}

const PARAM_LOCATION_TITLES: Record<string, string> = {
  path: "Path parameters",
  query: "Query parameters",
  header: "Header parameters",
  cookie: "Cookie parameters",
};

/**
 * Builds the MDX body for a generated endpoint page: the operation description,
 * followed by `<Field>` documentation for the parameters and request body, and
 * a schema/example code block per response. Spec-derived strings are emitted
 * only through serialized JSX expressions. Rendered above the playground.
 */
export function buildEndpointDoc(op: OperationDescriptor): string {
  const out: string[] = [];
  if (op.description) out.push(jsxText(op.description));
  else if (op.summary) out.push(jsxText(op.summary));

  for (const location of ["path", "query", "header", "cookie"] as const) {
    const params = op.parameters.filter((p) => p.in === location);
    if (params.length === 0) continue;
    out.push(`## ${PARAM_LOCATION_TITLES[location]}`);
    for (const p of params) {
      out.push(renderDocField(p.name, p.schema, p.required, p.description, 0));
    }
  }

  const body =
    op.requestBody?.content.find((m) => m.contentType.includes("json")) ??
    op.requestBody?.content[0];
  if (body?.schema !== undefined) {
    out.push("## Request body");
    const shape = objectShape(body.schema);
    if (shape) {
      const req: string[] = Array.isArray(shape.required) ? shape.required : [];
      for (const [propName, propSchema] of Object.entries(shape.properties)) {
        out.push(
          renderDocField(
            propName,
            propSchema,
            req.includes(propName),
            undefined,
            0,
          ),
        );
      }
    } else {
      out.push(jsonCode(body.schema));
    }
  }

  if (op.responses.length > 0) {
    out.push("## Responses");
    for (const response of op.responses) {
      out.push(`<h3>{${JSON.stringify(response.status)}}</h3>`);
      if (response.description) {
        out.push(jsxText(inlineText(response.description)));
      }
      const media =
        response.content.find((m) => m.contentType.includes("json")) ??
        response.content[0];
      const payload = media?.example ?? media?.schema;
      if (payload !== undefined) {
        out.push(jsonCode(payload));
      }
    }
  }

  return out.join("\n\n");
}
