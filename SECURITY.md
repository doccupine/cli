# Security Policy

## Supported Versions

Doccupine is published to npm and released frequently. Security fixes are issued only for the latest published version. Before reporting an issue, please upgrade to the newest release and confirm it still reproduces:

```bash
npx doccupine@latest --version
```

| Version        | Supported          |
| -------------- | ------------------ |
| Latest release | :white_check_mark: |
| Older releases | :x:                |

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Use one of these private channels instead:

1. **GitHub private advisories (preferred)** - open a report at
   https://github.com/doccupine/cli/security/advisories/new.
   This keeps the details private until a fix is released.
2. **Email** - team@doccupine.com

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce, ideally a minimal proof of concept
- The Doccupine version (`npx doccupine --version`) and your environment
- Any suggested remediation

## What to Expect

- We will acknowledge your report within 3 business days.
- We will confirm the issue, assess its severity, and keep you updated on progress.
- Once a fix ships, we will credit you in the release notes unless you prefer to stay anonymous.

## Security Model and Scope

Doccupine is a CLI that generates a Next.js application you run and host yourself. A few points matter when assessing the security surface:

- **API keys and secrets** - the generated app reads provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`), an optional `DOCS_API_KEY`, and an optional `SITE_PASSWORD` from environment variables. These belong in the generated app's `.env` file, which is git-ignored by default. Never commit real keys.
- **MCP endpoint** - the `/api/mcp` route requires a bearer token only when `DOCS_API_KEY` is set. If `DOCS_API_KEY` is not set, the endpoint is publicly accessible with no authentication. Set `DOCS_API_KEY` before exposing the generated site publicly.
- **Site password** - `SITE_PASSWORD` gates the whole site behind a single shared password. It is a lightweight access gate, not a substitute for per-user authentication.
- **Generated output** - review generated code before deploying to production, especially if you customize templates.

Reports about the Doccupine CLI itself and about insecure defaults in the code it generates are both in scope. Vulnerabilities in third-party dependencies should be reported upstream, but we welcome a heads-up so we can bump versions promptly.
