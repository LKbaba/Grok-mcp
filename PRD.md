# Grok-MCP 产品需求文档 (PRD)

**版本**: v3.0.0
**创建日期**: 2026-03-09
**最后更新**: 2026-03-12
**状态**: 🟡 开发中（核心功能已完成，v3 优化进行中）

---

## 1. 项目概述

### 1.1 项目目标

创建一个基于 **Model Context Protocol (MCP)** 的 xAI Grok API 服务器，使 Claude Code 和其他 MCP 客户端能够调用 Grok 的核心能力：

- **实时搜索能力**：Web Search + X (Twitter) Search
- **4-Agent 协作架构**：Grok（协调者）+ Harper（研究）+ Benjamin（逻辑）+ Lucas（创意）（grok-4.20 原生支持）
- **智能推理**：自动包含 reasoning tokens
- **创意生成**：多角度头脑风暴，支持结构化输出

### 1.2 核心模型：Grok 4.20

**v3 决策**：默认模型从 `grok-4-latest` 切换到 `grok-4.20-beta`。

| 对比项 | grok-4-latest | grok-4.20-beta |
|--------|--------------|----------------|
| 价格（输入） | $2.50/M | **$0.20/M**（便宜 12x） |
| 价格（输出） | $10.00/M | **$0.50/M**（便宜 20x） |
| 上下文窗口 | 256K | **2M**（大 8x） |
| 速度 | 慢（60-80s） | **快**（待实测） |
| 幻觉率 | 正常 | **最低** |
| 4-Agent 架构 | 不支持 | **原生支持** |
| 结构化输出 | 支持 | **支持** |
| temperature | 支持 | **支持** |
| reasoning effort | 不支持 | **不支持** |

### 1.3 与 Gemini-MCP 的差异化定位

| 特性 | Gemini-MCP | Grok-MCP |
|------|-----------|----------|
| 核心优势 | 代码生成、多模态分析 | **实时搜索、X 平台集成** |
| 搜索能力 | Google Search (Grounding) | **Web + X Search（原生）** |
| 搜索速度 | ~8-10s (flash 模型) | 待实测（grok-4.20） |
| 引用来源 | Google 重定向 URL（不透明） | **直接 URL（透明可访问）** |
| 独特能力 | 代码库分析、多模态 | **X/Twitter 社交媒体搜索** |
| 智能体架构 | 单一模型 | **4-Agent 协作** |
| 模型可选 | flash/pro 可选 | **多模型可选** |
| 输出格式 | text/json 可选 | **text/json 可选**（v3 新增） |
| brainstorm | 结构化 JSON + count/style | **结构化 JSON + count/style**（v3 新增） |
| 读取项目文件 | contextFiles 参数 | **context_files 参数**（v3 新增） |

**核心定位**：Grok-MCP 专注于**实时信息获取**和**社交媒体搜索**，与 Gemini-MCP 形成互补。

---

## 2. 核心工具

### 2.1 grok_agent_search — 智能搜索

**功能**：集成 Web Search 和 X Search 的智能搜索工具，Grok 服务端自动执行搜索、整合信息并返回带引用的答案。

**输入参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | - | 搜索查询内容 |
| `search_type` | enum | 否 | `'mixed'` | `'web'`（网页搜索）/ `'x'`（X/Twitter 搜索）/ `'mixed'`（两者同时，默认推荐） |
| `model` | enum | 否 | `'grok-4.20-beta'` | 可选模型（v3 新增） |
| `output_format` | enum | 否 | `'text'` | `'text'`（Markdown）/ `'json'`（结构化 JSON）（v3 新增） |
| `web_search_config.allowed_domains` | string[] | 否 | - | 仅搜索指定域名（最多 5 个），如 `["github.com"]` |
| `web_search_config.excluded_domains` | string[] | 否 | - | 排除指定域名（最多 5 个） |
| `web_search_config.enable_image_understanding` | boolean | 否 | - | 启用图片理解 |
| `x_search_config.from_date` | string | 否 | - | 开始日期（ISO8601） |
| `x_search_config.to_date` | string | 否 | - | 结束日期（ISO8601） |
| `x_search_config.allowed_x_handles` | string[] | 否 | - | 仅搜索指定账号（最多 10 个） |
| `x_search_config.excluded_x_handles` | string[] | 否 | - | 排除指定账号（最多 10 个） |
| `x_search_config.enable_image_understanding` | boolean | 否 | - | 启用图片理解 |
| `x_search_config.enable_video_understanding` | boolean | 否 | - | 启用视频理解 |

**输出**：Markdown 或 JSON 格式的搜索结果 + 引用来源列表 + Token 使用统计

**实测性能**（2026-03-12，grok-4-latest）：

| 搜索类型 | 耗时 | Tokens | 引用数 |
|----------|------|--------|--------|
| Web | ~72s | ~6,600 | 9-14 |
| X (Twitter) | ~59s | ~8,900 | 7 |
| Mixed | ~66s | ~8,200 | 10 |

> **注意**：以上数据基于 grok-4-latest，切换到 grok-4.20-beta 后速度预计大幅提升，待实测更新。

---

### 2.2 grok_brainstorm — 创意头脑风暴

**功能**：基于给定主题生成创新想法、多角度分析和创意建议。不使用搜索工具，纯粹依靠 Grok 的推理能力。

**输入参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `topic` | string | 是 | - | 头脑风暴主题 |
| `context` | string | 否 | - | 额外上下文信息 |
| `context_files` | string[] | 否 | - | 项目文件路径，读取后作为上下文（v3 新增） |
| `count` | number | 否 | `5` | 生成创意数量，1-10（v3 新增） |
| `style` | enum | 否 | `'balanced'` | 风格：`'innovative'`（创新）/ `'practical'`（务实）/ `'radical'`（激进）/ `'balanced'`（平衡）（v3 新增） |
| `model` | enum | 否 | `'grok-4.20-beta'` | 可选模型（v3 新增） |
| `output_format` | enum | 否 | `'text'` | `'text'`（Markdown）/ `'json'`（结构化 JSON）（v3 新增） |

**JSON 输出格式**（当 `output_format: 'json'` 时）：

```json
{
  "ideas": [
    {
      "title": "想法标题",
      "description": "详细描述",
      "pros": ["优点1", "优点2"],
      "cons": ["挑战1"],
      "feasibility": "high" | "medium" | "low",
      "implementation": "实施建议"
    }
  ]
}
```

**实测性能**（2026-03-12，grok-4-latest）：

| 指标 | 数据 |
|------|------|
| 耗时 | ~65-78s |
| Tokens | ~2,600-2,800 |

---

## 3. 技术架构

### 3.1 技术栈

| 组件 | 选型 | 说明 |
|------|------|------|
| 语言 | TypeScript (ES2022, ESM) | 类型安全 |
| 运行时 | Node.js 20+ | LTS 版本 |
| MCP SDK | `@modelcontextprotocol/sdk ^1.0.0` | 官方 SDK |
| 参数验证 | `zod ^3.22.0` | 运行时类型验证 |
| 环境变量 | `dotenv ^16.0.0` | .env 文件支持 |
| HTTP 客户端 | **原生 fetch (undici)** | 自动读取代理环境变量 |
| 测试 | vitest | 现代化测试框架 |

> **注意**：未使用 OpenAI SDK。原生 fetch 更简洁，避免了 SDK 类型不兼容问题（xAI 工具格式与 OpenAI 标准不同）。

### 3.2 API 端点

- **当前端点**：`https://api.x.ai/v1/responses`（Responses API）
- **已废弃**：`/v1/chat/completions`（2026-01-12 废弃）

### 3.3 请求格式

```json
{
  "model": "grok-4.20-beta",
  "input": [{ "role": "user", "content": "查询内容" }],
  "stream": false,
  "tools": [
    {
      "type": "web_search",
      "enable_image_understanding": true
    },
    {
      "type": "x_search",
      "from_date": "2026-03-01T00:00:00Z"
    }
  ]
}
```

**关键点**：
- 使用 `input` 字段（非 `messages`）
- 工具参数在**顶层**（非嵌套 `web_search: {...}`）
- 搜索在**服务端执行**，无需客户端实现工具调用循环

### 3.4 响应结构

```json
{
  "id": "resp_...",
  "model": "grok-4.20-beta",
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [
        { "type": "output_text", "text": "..." }
      ]
    }
  ],
  "usage": {
    "input_tokens": 4695,
    "output_tokens": 1640,
    "output_tokens_details": { "reasoning_tokens": 758 },
    "input_tokens_details": { "cached_tokens": 2430 },
    "total_tokens": 6335,
    "cost_in_usd_ticks": 382175000,
    "server_side_tool_usage_details": {
      "web_search_calls": 1,
      "x_search_calls": 0
    }
  }
}
```

**关键点**：
- 引用嵌入在文本中，格式：`[[1]](https://example.com)`，需正则提取
- `server_side_tool_usage_details` 在未使用搜索工具时**可能不存在**（需可选链访问）
- 成本单位：1 tick = 0.0000000001 USD（10,000,000,000 ticks = 1 USD）

### 3.5 项目结构

```
grok-mcp/
├── src/
│   ├── index.ts              # MCP 服务器入口
│   ├── config/
│   │   └── index.ts          # 配置管理（zod 验证）
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   ├── tools/
│   │   ├── definitions.ts    # MCP 工具 JSON Schema 定义
│   │   ├── agent-search.ts   # grok_agent_search 实现
│   │   └── brainstorm.ts     # grok_brainstorm 实现
│   └── utils/
│       ├── grok-client.ts    # xAI API 客户端（原生 fetch）
│       ├── tool-builder.ts   # 搜索工具参数构建器
│       └── logger.ts         # 日志和性能监控
├── dist/                     # TypeScript 编译输出
├── tests/                    # 测试目录
├── docs/                     # 历史文档归档
├── reference/                # 参考项目（gemini-mcp 源码）
├── package.json
├── tsconfig.json
├── .env.example
└── CLAUDE.md
```

### 3.6 日志规范

MCP 服务器使用 stdio 传输协议，日志必须遵守以下规范：

- **stdout**（`console.log`）：**禁止**用于日志，仅用于 JSON-RPC 协议通信
- **stderr**（`console.error`）：所有日志输出到这里（与 Gemini-MCP 一致）
- 原因：stdout 上的非 JSON-RPC 内容会干扰 MCP 协议通信，导致客户端解析失败

---

## 4. 配置

### 4.1 环境变量

```bash
# 必需
XAI_API_KEY=your_xai_api_key_here

# 可选
DEBUG=false                          # 调试模式
HTTPS_PROXY=http://127.0.0.1:7897   # 代理（原生 fetch 自动读取）
HTTP_PROXY=http://127.0.0.1:7897
```

### 4.2 Claude Code 配置

```json
{
  "mcpServers": {
    "grok-mcp": {
      "command": "node",
      "args": ["E:/Github/Grok-mcp/dist/index.js"],
      "env": {
        "XAI_API_KEY": "xai-..."
      }
    }
  }
}
```

### 4.3 默认参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 模型 | `grok-4.20-beta` | v3 更新：从 grok-4-latest 切换 |
| 超时 | 120,000ms | 搜索需要较长时间 |
| 重试 | 3 次 | 指数退避（1s, 2s） |
| API URL | `https://api.x.ai/v1` | 官方端点 |

---

## 5. 模型与成本

### 5.1 支持的模型

| 模型 | 输入 ($/1M) | 输出 ($/1M) | 上下文 | 速度 | 适用场景 |
|------|------------|------------|--------|------|----------|
| `grok-4.20-beta` | $0.20 | $0.50 | 2M | **快** | **默认模型**，4-Agent 原生，性价比最高 |
| `grok-4-latest` | $2.50 | $10.00 | 256K | 慢 | 最高质量，复杂任务备选 |

> **v3 决策**：仅支持这两个模型。`grok-4.20-beta` 作为默认，`grok-4-latest` 作为高质量备选。不支持 grok-4-fast 等其他变体，避免选择过多。

### 5.2 搜索工具费用

| 工具 | 费用 |
|------|------|
| Web Search | $5.00 / 1000 次 |
| X Search | $2.50 / 1000 次 |

### 5.3 Grok 4.20 已确认能力

来源：2026-03-12 实际搜索 xAI 官方文档确认。

| 能力 | 支持？ | 说明 |
|------|--------|------|
| 结构化 JSON 输出 | ✅ | 可强制 JSON Schema 格式返回 |
| temperature 控制 | ✅ | 控制创意随机性 |
| reasoning effort 控制 | ❌ | Grok 4 系列均不支持 |
| 多模态（图片/视频） | ✅ | text + vision |
| 并行工具调用 | ✅ | 增强的 agentic 能力 |
| Web/X Search | ✅ | 与 grok-4-latest 相同 |

---

## 6. 待修复的代码问题

### 6.1 P0（必须修复）

| # | 文件 | 问题 | 修复方案 |
|---|------|------|----------|
| 1 | `types/index.ts:117` | `server_side_tool_usage_details` 标记为必填，但 brainstorm 不返回此字段 | 改为可选字段 `?`，保留所有子字段供未来扩展 |
| 2 | `tool-builder.ts:19` | `z.string().url()` 要求完整 URL，但 xAI API 接受纯域名 `github.com` | 改为域名格式验证 |
| 3 | `agent-search.ts:42` | `search_type` 为 undefined 时 tools 为空导致报错 | 添加默认值 fallback：`input.search_type \|\| 'web'` |

### 6.2 P1（建议修复）

| # | 文件 | 问题 | 修复方案 |
|---|------|------|----------|
| 4 | `index.ts:152` | `errorMessage` 变量声明未使用 | 删除无用变量 |
| 5 | `config/index.ts:107` | `printConfig` 使用 `console.log` 污染 stdio 协议通道 | 改为 `console.error`，与 Gemini-MCP 做法一致 |
| 6 | `index.ts:198` | `unhandledRejection` 处理器强制 `process.exit(1)`，单次网络错误会杀掉整个 MCP 服务器 | 仅记录错误，不退出进程（Gemini-MCP 无此处理器） |

### 6.3 已修复

| 日期 | 问题 | 修复 |
|------|------|------|
| 2026-03-12 | brainstorm 崩溃：`server_side_tool_usage_details` 为 undefined | 添加可选链 `?.` 和默认值 |

---

## 7. 开发进度

### 阶段 1: 项目初始化 ✅

- [x] Task 1: 项目结构和配置文件
- [x] Task 2: TypeScript 类型定义
- [x] Task 3: 配置管理模块

### 阶段 2: 核心基础设施 ✅

- [x] Task 4: Grok API 客户端（原生 fetch 实现）
- [x] Task 5: 搜索工具构建器
- [x] Task 6: MCP 服务器框架
- [x] Task 7: 工具定义模块

### 阶段 3: 工具实现 ✅

- [x] Task 8: grok_agent_search
- [x] Task 9: grok_brainstorm
- [x] Task 10: 集成工具到 MCP 服务器
- [x] Task 11: 日志和调试功能

### 阶段 4: v3 优化 🔲（当前阶段）

- [ ] Task 12: 修复 P0/P1 代码问题（6 项）
- [ ] Task 13: 默认模型切换到 grok-4.20-beta + model 参数支持
- [ ] Task 14: brainstorm 增强（count/style/context_files/output_format）
- [ ] Task 15: search 增强（model/output_format）
- [ ] Task 16: grok-4.20-beta 性能实测

### 阶段 5: 测试和发布 🔲

- [ ] Task 17: 单元测试
- [ ] Task 18: 集成测试
- [ ] Task 19: README 文档
- [ ] Task 20: 发布准备

---

## 8. 参考资料

### 官方文档

- xAI 模型列表：https://docs.x.ai/developers/models
- Web Search：https://docs.x.ai/docs/tools/web-search
- X Search：https://docs.x.ai/docs/tools/x-search
- Responses API：https://docs.x.ai/api/responses
- 结构化输出：https://docs.x.ai/developers/model-capabilities/text/structured-outputs
- Reasoning：https://docs.x.ai/developers/model-capabilities/text/reasoning

### 项目参考

- Gemini-MCP：`E:\Github\Gemini-mcp`
- MCP 协议：https://modelcontextprotocol.io/

### 技术文档（docs/）

| 文档 | 说明 |
|------|------|
| `docs/GROK_42_REPORT.md` | Grok 4.20 调研报告 |
| `docs/TECHNICAL_REVIEW_PLAN_B.md` | 方案 B 技术核查 |
| `docs/RESPONSES_API_FINDINGS.md` | Responses API 发现 |
| `docs/COMPARISON.md` | SDK 对比分析 |
| `docs/FINAL_TEST_RESULTS.md` | 最终测试结果 |
| `docs/TEST_RESULTS.md` | 测试结果汇总 |
| `docs/SEARCH_TOOL_IMPLEMENTATION.md` | 搜索工具实现详解 |

---

**文档版本**: v3.0.0
**最后更新**: 2026-03-12
