# Grok MCP Server

> **Give Claude Code the power of Grok 4.20**

An MCP server that connects Claude Code to xAI's Grok, unlocking real-time web search and X (Twitter) search capabilities.

## Why Grok + Claude?

| Grok's Strengths | Use Case |
|-------------------|----------|
| **Web + X Search** | Real-time information with transparent source URLs |
| **X/Twitter Search** | Track social media trends, public opinion, breaking news |
| **4-Agent Architecture** | Harper (research) + Benjamin (logic) + Lucas (creative) collaboration |
| **2M Token Context** | Massive context window with grok-4.20-beta |

> **Philosophy**: Claude is the commander, Grok is the specialist for real-time search and social media intelligence.

## Quick Start

### 1. Get API Key

Visit [xAI Console](https://console.x.ai/) and create an API key.

### 2. Configure Claude Code

Add to your MCP config file:

- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "grok-mcp": {
      "command": "npx",
      "args": ["-y", "@lkbaba/grok-mcp"],
      "env": {
        "XAI_API_KEY": "your_xai_api_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Code

## Tools (2)

### grok_agent_search - Smart Search

Real-time web and X (Twitter) search powered by Grok.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query |
| `search_type` | enum | No | `mixed` | `web` / `x` / `mixed` (recommended) |
| `model` | enum | No | `grok-4.20-beta` | `grok-4.20-beta` (fast) / `grok-4-latest` (best quality) |
| `output_format` | enum | No | `text` | `text` (Markdown) / `json` (structured) |
| `web_search_config` | object | No | - | Domain filters, image understanding |
| `x_search_config` | object | No | - | Date range, handle filters, video understanding |

**Example:**
```
"Search for the latest Claude Code updates on X and the web"
```

### grok_brainstorm - Creative Brainstorming

Multi-perspective idea generation with project context support.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | Yes | - | Brainstorming topic |
| `context` | string | No | - | Additional context |
| `context_files` | string[] | No | - | Project files to read as context |
| `count` | number | No | `5` | Number of ideas (1-10) |
| `style` | enum | No | `balanced` | `innovative` / `practical` / `radical` / `balanced` |
| `model` | enum | No | `grok-4.20-beta` | Model selection |
| `output_format` | enum | No | `text` | `text` (Markdown) / `json` (structured with pros/cons/feasibility) |

**Example:**
```
"Brainstorm 3 practical ideas for improving user onboarding, read ./README.md for context"
```

## Model Selection

| Model | Price (input/output) | Context | Speed | Best For |
|-------|---------------------|---------|-------|----------|
| `grok-4.20-beta` | $0.20 / $0.50 per M | 2M | Fast | Default, 4-Agent native, lowest hallucination |
| `grok-4-latest` | $2.50 / $10.00 per M | 256K | Slow | Complex tasks requiring highest quality |

## Performance

Tested on 2026-03-12:

| Operation | Model | Time | Tokens |
|-----------|-------|------|--------|
| Web Search | grok-4.20-beta | ~29s | ~70K |
| X Search | grok-4.20-beta | ~28s | ~48K |
| Brainstorm (3 ideas) | grok-4.20-beta | ~16s | ~3.6K |

## Proxy Configuration

<details>
<summary>For users behind proxy/VPN</summary>

Add proxy environment variable to your config:

```json
{
  "mcpServers": {
    "grok-mcp": {
      "command": "npx",
      "args": ["-y", "@lkbaba/grok-mcp"],
      "env": {
        "XAI_API_KEY": "your_xai_api_key_here",
        "HTTPS_PROXY": "http://127.0.0.1:7897"
      }
    }
  }
}
```

Native `fetch` (undici) automatically reads proxy environment variables.
</details>

## Local Development

<details>
<summary>Build from source</summary>

```bash
git clone https://github.com/LKbaba/Grok-mcp.git
cd Grok-mcp
npm install
npm run build
export XAI_API_KEY="your_xai_api_key_here"
npm start
```
</details>

## Project Structure

```
src/
├── config/
│   └── index.ts          # Configuration (zod validation)
├── types/
│   └── index.ts          # TypeScript type definitions
├── tools/
│   ├── definitions.ts    # MCP tool JSON Schema definitions
│   ├── agent-search.ts   # grok_agent_search implementation
│   └── brainstorm.ts     # grok_brainstorm implementation
├── utils/
│   ├── grok-client.ts    # xAI API client (native fetch)
│   ├── tool-builder.ts   # Search tool parameter builder
│   └── logger.ts         # Logging and performance monitoring
└── index.ts              # MCP server entry point
```

## Comparison with Gemini MCP

| Feature | Gemini MCP | Grok MCP |
|---------|-----------|----------|
| Web Search | Google Search (grounding) | Grok Web Search |
| X/Twitter Search | Not available | **Native support** |
| Citation URLs | Google redirect (opaque) | **Direct URLs (transparent)** |
| Search Speed | ~8-10s (flash) | ~16-29s (grok-4.20) |
| Codebase Analysis | 1M token context | Not available |
| Multimodal | Image analysis | Not available |
| Brainstorm | Structured JSON | **Structured JSON + style/count/context_files** |

**Best strategy**: Use both! Gemini for speed and code analysis, Grok for deep search and X/Twitter intelligence.

## License

MIT
