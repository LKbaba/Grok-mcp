# Grok-MCP 产品需求文档 (PRD)

**版本**: v4.0.0
**创建日期**: 2026-03-09
**最后更新**: 2026-03-12
**状态**: 🟡 v4 重构中（模型体系、输出质量、引用系统全面升级）

---

## 1. 项目概述

### 1.1 项目目标

创建一个基于 **Model Context Protocol (MCP)** 的 xAI Grok API 服务器，使 Claude Code 和其他 MCP 客户端能够调用 Grok 的核心能力：

- **实时搜索能力**：Web Search + X (Twitter) Search
- **4-Agent 协作架构**：Grok（协调者）+ Harper（研究）+ Benjamin（逻辑）+ Lucas（创意/反常识）
- **智能推理**：自动包含 reasoning tokens
- **创意生成**：多角度头脑风暴，支持结构化输出

### 1.2 核心模型：Grok 4.20 系列

**v4 决策**：仅支持 Grok 4.20 系列三个变体，移除所有旧模型别名。

| 模型 ID | 架构 | 输入 ($/1M) | 输出 ($/1M) | 上下文 | 特点 |
|---------|------|------------|------------|--------|------|
| `grok-4.20-multi-agent-beta-0309` | **4-Agent 协作** | $2.00 | $6.00 | 2M | **默认模型**。Harper 研究+Benjamin 逻辑+Lucas 反常识，幻觉率最低 (~4.2%) |
| `grok-4.20-beta-0309-reasoning` | 单模型思维链 | $2.00 | $6.00 | 2M | 线性深度推理，适合技术分析 |
| `grok-4.20-beta-0309-non-reasoning` | 单模型标准推理 | $2.00 | $6.00 | 2M | 速度最快，适合快速创意发散 |

> **v4 变更**：
> - 移除 `grok-4-latest`（动态别名，不在官方模型列表中）
> - 移除 `grok-4.20-beta`（非正式 ID）
> - 修正定价：4.20 系列实际为 $2.00/$6.00，非之前错误记录的 $0.20/$0.50

### 1.3 与 Gemini-MCP 的差异化定位

| 特性 | Gemini-MCP | Grok-MCP |
|------|-----------|----------|
| 核心优势 | 代码生成、多模态分析 | **实时搜索、X 平台集成** |
| 搜索能力 | Google Search (Grounding) | **Web + X Search（原生）** |
| 引用来源 | Google 重定向 URL（不透明） | **直接 URL + 标题（透明可访问）** |
| 独特能力 | 代码库分析、多模态 | **X/Twitter 社交媒体搜索** |
| 智能体架构 | 单一模型 | **4-Agent 协作** |
| 输出格式 | text/json | **text/json（原生 JSON Schema 强制）** |

**核心定位**：Grok-MCP 专注于**实时信息获取**和**社交媒体搜索**，与 Gemini-MCP 形成互补。

---

## 2. 核心工具

### 2.1 grok_agent_search — 智能搜索

**功能**：集成 Web Search 和 X Search 的智能搜索工具。Grok 服务端 Agent 自动分析查询、执行搜索（可能多轮）、整合信息并返回带引用的综合答案。

**工作原理**：这不是一个搜索引擎，而是一个**会搜索的 AI 助手入口**。Grok 自己决定搜什么关键词、搜几次、用哪个搜索引擎，最终返回综合分析。

#### 输入参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | **是** | - | 搜索查询内容 |
| `search_type` | enum | 否 | `'mixed'` | `'web'` / `'x'` / `'mixed'`（推荐） |
| `model` | enum | 否 | `'grok-4.20-multi-agent-beta-0309'` | 三个 4.20 变体可选 |
| `output_format` | enum | 否 | `'text'` | `'text'`（Markdown）/ `'json'`（原生 JSON Schema 强制） |

**Web 搜索配置**（`web_search_config`）：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `allowed_domains` | string[] | - | 白名单域名（max 5）。**与 excluded_domains 互斥** |
| `excluded_domains` | string[] | - | 黑名单域名（max 5）。**与 allowed_domains 互斥** |
| `enable_image_understanding` | boolean | **true** | **v4 默认开启**。让 Grok 分析搜索结果中的图片 |

**X 搜索配置**（`x_search_config`）：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `from_date` | string | - | 开始日期（ISO8601）。不设默认，Grok 自行判断时效性 |
| `to_date` | string | - | 结束日期（ISO8601） |
| `allowed_x_handles` | string[] | - | 白名单账号（max 10）。**与 excluded_x_handles 互斥** |
| `excluded_x_handles` | string[] | - | 黑名单账号（max 10）。**与 allowed_x_handles 互斥** |
| `enable_image_understanding` | boolean | **true** | **v4 默认开启**（web_search 开启后 mixed 模式自动生效） |
| `enable_video_understanding` | boolean | false | 视频理解，留给 LLM 按需开启 |

**不暴露的内部设置**：
- `temperature`: 固定 **0.6**（搜索需要事实准确性）
- `enable_image_understanding`: 始终 true（用户不需要关心）

#### 输出结构

```
# Search Results

{Grok 生成的综合分析文章（Markdown）}

## Search Queries                    ← v4 新增
Grok 实际执行的搜索关键词列表

## Sources                           ← v4 改进
带标题的来源链接列表（从 annotations 提取）
1. [来源标题](https://url)
2. [来源标题](https://url)

## Usage Statistics
- Model / Tokens / Search Calls / Duration
```

**v4 输出改进**：
1. **搜索关键词**：从 API 返回的 `web_search_call`/`x_search_call` output 条目中提取 Grok 实际搜了什么
2. **带标题的来源**：从 `annotations` 中提取标题和 URL，不再仅靠正则提取裸 URL
3. **费用**：在统计中展示本次调用费用

---

### 2.2 grok_brainstorm — 创意头脑风暴

**功能**：基于给定主题生成创新想法、多角度分析和创意建议。不使用搜索工具，纯粹依靠 Grok 的推理能力。默认使用 multi-agent 模型时，Lucas agent 会提供反常识视角。

#### 输入参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `topic` | string | **是** | - | 头脑风暴主题 |
| `context` | string | 否 | - | 额外上下文信息 |
| `context_files` | string[] | 否 | - | 项目文件路径（max 10），读取后作为上下文 |
| `count` | number | 否 | `5` | 生成创意数量，1-10 |
| `style` | enum | 否 | `'balanced'` | 思维风格（见下表） |
| `model` | enum | 否 | `'grok-4.20-multi-agent-beta-0309'` | 三个 4.20 变体可选 |
| `output_format` | enum | 否 | `'text'` | `'text'`（Markdown）/ `'json'`（原生 JSON Schema 强制） |

**风格与温度映射**：

| style | 中文含义 | temperature | 适用场景 |
|-------|---------|-------------|---------|
| `practical` | 务实 | **0.5** | 关注 ROI 和落地性 |
| `balanced` | 平衡 | **0.7** | 默认，兼顾创新与可行性 |
| `innovative` | 创新 | **0.95** | 鼓励新颖角度 |
| `radical` | 激进 | **1.0** | 打破常规（Grok 稳定输出上限） |

> **v4 变更**：
> - 默认温度从"模型默认"改为明确的 **0.7**
> - `radical` 从 1.2 降至 **1.0**（社区反馈：>1.0 质量下降）
> - `innovative` 从 0.9 调至 **0.95**（与 balanced 拉开差距）

**JSON 输出格式**（使用原生 JSON Schema 强制，保证 100% 符合结构）：

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

---

## 3. 技术架构

### 3.1 技术栈

| 组件 | 选型 | 说明 |
|------|------|------|
| 语言 | TypeScript (ES2022, ESM) | 类型安全 |
| 运行时 | Node.js 20+ | LTS 版本 |
| MCP SDK | `@modelcontextprotocol/sdk ^1.0.0` | 官方 SDK |
| 参数验证 | `zod ^3.22.0` | 运行时类型验证 |
| HTTP 客户端 | **原生 fetch (undici)** | 自动读取代理环境变量 |

### 3.2 API 端点

- **当前端点**：`https://api.x.ai/v1/responses`（Responses API）
- **已废弃**：`/v1/chat/completions`（2026-01-12 废弃）

### 3.3 请求格式

```json
{
  "model": "grok-4.20-multi-agent-beta-0309",
  "input": [{ "role": "user", "content": "查询内容" }],
  "stream": false,
  "temperature": 0.6,
  "tools": [
    {
      "type": "web_search",
      "enable_image_understanding": true
    },
    {
      "type": "x_search",
      "enable_image_understanding": true
    }
  ],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "search_result",
      "schema": { ... },
      "strict": true
    }
  }
}
```

**v4 关键变更**：
- `text.format` 参数：当 output_format=json 时使用原生 JSON Schema 强制结构化输出
- `enable_image_understanding: true` 默认开启
- `temperature` 明确设置（搜索 0.6 / 头脑风暴按 style 映射）

### 3.4 响应结构与数据提取

```json
{
  "output": [
    {
      "type": "web_search_call",
      "action": { "query": "Grok 实际搜索的关键词" }
    },
    {
      "type": "x_search_call",
      "action": { "query": "Grok 在 X 上搜索的关键词" }
    },
    {
      "type": "message",
      "content": [{
        "type": "output_text",
        "text": "综合答案...",
        "annotations": [
          {
            "type": "url_citation",
            "url": "https://example.com",
            "title": "来源标题",
            "start_index": 45,
            "end_index": 60
          }
        ]
      }]
    }
  ],
  "usage": { ... }
}
```

**v4 数据提取策略**：
1. **搜索关键词**：遍历 `output` 数组，提取所有 `web_search_call`/`x_search_call` 条目的 `action.query`
2. **来源引用**：优先从 `annotations` 提取（有标题），降级到正则提取 `[[n]](url)`（无标题时）
3. **内容**：从 `message` 类型的 `output_text` 提取

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
├── specs/                    # 开发计划
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

### 3.6 日志规范

- **stdout**（`console.log`）：**禁止**用于日志，仅用于 JSON-RPC 协议通信
- **stderr**（`console.error`）：所有日志输出到这里

---

## 4. 配置

### 4.1 环境变量

```bash
# 必需
XAI_API_KEY=your_xai_api_key_here

# 可选
DEBUG=false
HTTPS_PROXY=http://127.0.0.1:7897
HTTP_PROXY=http://127.0.0.1:7897
```

### 4.2 默认参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 模型 | `grok-4.20-multi-agent-beta-0309` | v4 更新 |
| 超时 | 120,000ms | 搜索需要较长时间 |
| 重试 | 3 次 | 指数退避（1s, 2s） |
| API URL | `https://api.x.ai/v1` | 官方端点 |

---

## 5. 搜索工具费用

| 工具 | 费用 |
|------|------|
| Web Search | $5.00 / 1000 次 |
| X Search | $5.00 / 1000 次 |

---

## 6. 安全特性（v1.0.1+）

| 特性 | 说明 |
|------|------|
| 路径遍历防护 | `context_files` 限制在工作目录内 |
| 敏感文件拦截 | `.env`/`.pem`/`.key`/credentials 等自动屏蔽 |
| 文件数量限制 | context_files 最多 10 个 |
| 域名长度限制 | 最大 253 字符，防止 ReDoS |
| 互斥校验 | allowed/excluded domains 和 handles **不能同时设置**（v4 新增） |

---

## 7. v4 更新决策记录

以下决策基于 2026-03-12 产品设计讨论和社区调研：

### 确认执行

| 序号 | 决策 | 原因 |
|------|------|------|
| 1 | 模型体系切换到 4.20 三变体 | 官方模型列表确认，旧别名不可靠 |
| 2 | 默认模型 → multi-agent | 搜索：Harper agent 最强；头脑风暴：Lucas 反常识视角有价值 |
| 3 | 默认开启图片理解 | 用户不在意 token 消耗，图片信息有价值 |
| 4 | 时间范围不设默认 | Grok agent 自行判断时效性更准确 |
| 5 | 原生 JSON Schema 结构化输出 | prompt 提示不可靠，API 原生支持保证 100% 合规 |
| 6 | 搜索温度固定 0.6 | 事实准确性优先，不暴露给用户 |
| 7 | 头脑风暴默认温度 0.7 | 用户决定，style 在此基础上调整 |
| 8 | radical 温度上限 1.0 | 社区反馈：>1.0 质量下降 |
| 9 | 来源索引结构化返回 | 对标 Gemini MCP 的 groundingMetadata |
| 10 | 搜索加轻量 system prompt | 引导 Grok 更好地标注来源（不暴露给用户） |
| 11 | allowed/excluded 互斥校验 | xAI API 要求，当前代码缺失 |

### 明确不做

| 序号 | 特性 | 原因 |
|------|------|------|
| 1 | 流式输出 | MCP 一次性输出即可，时间可接受 |
| 2 | 多轮对话 (previous_response_id) | 增加复杂度，收益不明确 |
| 3 | 暴露 system prompt (instructions) | 4.20 有 agent 集群，身份设定可能冲突 |
| 4 | 代码执行沙箱 | Grok 代码能力弱，Claude 自身是顶级代码模型 |
| 5 | grok-4-1-fast 系列 | 能力较弱，不符合产品定位 |

---

## 8. 参考资料

### 官方文档

- xAI 模型列表：https://docs.x.ai/developers/models
- Web Search：https://docs.x.ai/docs/tools/web-search
- X Search：https://docs.x.ai/docs/tools/x-search
- Responses API：https://docs.x.ai/api/responses
- 结构化输出：https://docs.x.ai/developers/model-capabilities/text/structured-outputs

### 项目参考

- Gemini-MCP：`E:\Github\Gemini-mcp`
- MCP 协议：https://modelcontextprotocol.io/

---

**文档版本**: v4.0.0
**最后更新**: 2026-03-12
