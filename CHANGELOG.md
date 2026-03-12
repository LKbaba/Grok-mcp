# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-12

### Breaking Changes

- **Model system overhaul**: Removed `grok-4.20-beta` and `grok-4-latest`, replaced with 3 official Grok 4.20 variants
  - `grok-4.20-multi-agent-beta-0309` — 4-Agent collaboration (default)
  - `grok-4.20-beta-0309-reasoning` — Deep chain-of-thought reasoning
  - `grok-4.20-beta-0309-non-reasoning` — Fastest speed
- **Pricing correction**: All 4.20 models are $2.00/$6.00 per M tokens (not $0.20/$0.50 as previously documented)

### Added

- **Native JSON Schema structured output**: `output_format: 'json'` now enforced via xAI's `text.format` parameter (100% schema compliance)
- **Search query extraction**: Shows actual search keywords Grok used (from `web_search_call`/`x_search_call` output entries)
- **Source citations with titles**: Extracts titled sources from API `annotations` (fallback to regex-extracted URLs)
- **Smart URL-to-title generation**: Generates readable titles from URLs when annotation titles are missing (e.g., `@handle — x.com` for X/Twitter URLs)
- **Mutual exclusivity validation**: `allowed_domains`/`excluded_domains` and `allowed_x_handles`/`excluded_x_handles` now properly validated as mutually exclusive

### Changed

- **Default model**: `grok-4.20-multi-agent-beta-0309` (4-Agent: Grok+Harper+Benjamin+Lucas)
- **Image understanding**: Now enabled by default for both Web and X search (internal setting, not user-visible)
- **Search temperature**: Fixed at 0.6 (not user-configurable, optimized for factual accuracy)
- **Brainstorm temperature**: Explicit mapping — practical=0.5, balanced=0.7 (default), innovative=0.95, radical=1.0 (capped from 1.2)
- **Search output format**: Added "Search Queries" and "Sources" sections with numbered titled links
- **System prompt**: Added lightweight research assistant prompt for better citation behavior

### Removed

- `enable_image_understanding` from user-visible parameters (now always-on internally)
- Old prompt-based JSON formatting hints (replaced by native JSON Schema)

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
