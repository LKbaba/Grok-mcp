# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-12

### Security

- **Path traversal protection**: `context_files` paths are now sandboxed to the working directory; attempts to read `../../etc/passwd` etc. are blocked
- **Sensitive file blocking**: `.env`, `.pem`, `.key`, credentials, and database files are automatically excluded from `context_files`
- **context_files limit**: Maximum 10 files enforced (both JSON Schema and runtime)
- **Domain validation hardening**: Added max length (253 chars) to domain strings to prevent ReDoS

## [1.0.0] - 2026-03-12

### Added

- **grok_agent_search** - Smart search tool with Web + X (Twitter) search
  - `search_type`: web / x / mixed (default: mixed)
  - `model`: grok-4.20-beta (default) / grok-4-latest
  - `output_format`: text (Markdown) / json (structured)
  - `web_search_config`: domain filters, image understanding
  - `x_search_config`: date range, handle filters, video understanding
  - Transparent citation URLs (not redirects)

- **grok_brainstorm** - Creative brainstorming tool
  - `count`: generate 1-10 ideas (default: 5)
  - `style`: innovative / practical / radical / balanced
  - `context_files`: read project files as context
  - `output_format`: text / json (with title/description/pros/cons/feasibility)
  - Temperature auto-adjustment based on style

- **Core Infrastructure**
  - Native fetch (undici) for xAI API calls, auto proxy support
  - Zod-based parameter validation
  - Retry logic with exponential backoff (3 attempts)
  - Performance monitoring and logging (all to stderr)
  - TypeScript ESM with strict mode

### Technical Details

- Runtime: Node.js 20+
- MCP SDK: @modelcontextprotocol/sdk ^1.0.0
- Default model: grok-4.20-beta ($0.20/$0.50 per M tokens, 2M context)
- API endpoint: xAI Responses API (`/v1/responses`)
- No OpenAI SDK dependency (native fetch for better xAI compatibility)
