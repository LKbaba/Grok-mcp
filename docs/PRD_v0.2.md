# Grok-mcp 产品需求文档 (PRD)

**版本**: v0.2.0
**日期**: 2026-03-09
**状态**: 基于测试结果更新

---

## 📋 项目概述

### 1.1 项目目标

创建一个基于 Model Context Protocol (MCP) 的 xAI Grok API 服务器，使 Claude Code 和其他 MCP 客户端能够利用 Grok 的**核心能力**：

- **🔍 智能体级别的搜索**：web_search + x_search（核心功能）
- **🤖 多智能体推理**：4-Agent 协作系统（Captain Grok + Harper + Benjamin + Lucas）
- **⚡ 实时信息获取**：X 平台秒级实时动态 + 全网搜索
- **💡 创意头脑风暴**：多角度分析和创意生成

### 1.2 核心价值主张

**与 Gemini-mcp 的差异化定位：**

| 特性 | Gemini-mcp | Grok-mcp |
|------|-----------|----------|
| 核心优势 | 代码生成、UI 设计 | **实时搜索、X 平台集成** |
| 搜索能力 | Google Search（通过 Grounding） | **DeepSearch + X Search（原生）** |
| 智能体架构 | 单一模型 | **4-Agent 协作系统** |
| 实时性 | 一般 | **秒级实时（X 平台）** |
| 代码分析 | 强 | 一般 |

**核心定位**：Grok-mcp 专注于**实时信息获取和智能体级别的搜索**，与 Gemini-mcp 形成互补。

---

## 🎯 核心功能需求

### 2.1 工具集设计（2-3个工具）

基于 API 测试结果和你的需求，最终工具集：

#### 2.1.1 grok_agent_search - 智能体搜索（核心）⭐

**功能描述**：
- **核心功能**：集成 web_search 和 x_search 的智能体搜索
- **自动决策**：Grok 自动决定使用哪种搜索（或两者结合）
- **服务器端编排**：MCP 服务器实现工具调用循环
- **自动总结**：返回包含引用的总结

**参数设计**：
```typescript
{
  query: string;                     // 搜索查询
  model?: string;                    // 默认: x-ai/grok-4.1-fast
  search_type?: 'web' | 'x' | 'auto'; // 搜索类型（auto 让 Grok 决定）

  // Web 搜索参数
  allowed_domains?: string[];        // 允许的域名列表
  excluded_domains?: string[];       // 排除的域名列表

  // X 搜索参数
  allowed_x_handles?: string[];      // 允许的 X 账号列表
  from_date?: string;                // 开始时间（ISO8601）
  to_date?: string;                  // 结束时间（ISO8601）

  max_results?: number;              // 最大结果数
  include_citations?: boolean;       // 是否包含引用（默认 true）
}
```

**实现方式**（基于测试结果）：
```typescript
// 1. 定义搜索函数
const tools = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '搜索网络获取实时信息',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          allowed_domains: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'x_search',
      description: '搜索 X 平台获取实时动态',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          from_date: { type: 'string' },
          to_date: { type: 'string' }
        }
      }
    }
  }
];

// 2. Grok 决定调用哪个工具
const response = await client.chat.completions.create({
  model: 'x-ai/grok-4.1-fast',
  messages: [{ role: 'user', content: query }],
  tools
});

// 3. 执行工具调用循环（MCP 服务器端）
if (response.choices[0].finish_reason === 'tool_calls') {
  // 执行搜索并返回结果给 Grok
  // Grok 自动总结并返回
}
```

**应用场景**：
- 实时新闻追踪
- 技术趋势分析
- X 平台舆情监控
- 市场动态研究

---

#### 2.1.2 grok_brainstorm - 头脑风暴（类似 Gemini）⭐

**功能描述**：
- **多角度分析**：利用 Grok 的推理能力（自动包含 reasoning_tokens）
- **创意生成**：适合复杂问题的多维度思考
- **模拟多智能体**：通过提示工程模拟 4-Agent 协作

**参数设计**：
```typescript
{
  topic: string;                     // 头脑风暴主题
  model?: string;                    // 默认: x-ai/grok-4.1-fast
  context?: string;                  // 额外上下文
  count?: number;                    // 生成想法数量（默认 5）
  style?: 'innovative' | 'practical' | 'radical'; // 风格
}
```

**实现方式**：
```typescript
const systemPrompt = `你是一个创意头脑风暴专家。请从以下四个角度分析问题：
1. 技术可行性（Benjamin 视角）
2. 市场和用户需求（Harper 视角）
3. 创新和替代方案（Lucas 视角）
4. 综合评估和建议（Captain Grok 视角）

为每个想法提供：
- 核心概念
- 优点和缺点
- 可行性评估
- 实施建议`;

const response = await client.chat.completions.create({
  model: 'x-ai/grok-4.1-fast',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `主题: ${topic}\n\n请生成 ${count} 个创意想法` }
  ],
  temperature: 0.8  // 提高创造性
});
```

**应用场景**：
- 产品创意生成
- 技术方案设计
- 问题解决策略
- 战略规划分析

---

#### 2.1.3 grok_chat - 基础对话（可选）

**功能描述**：
- 简单的对话接口
- 支持自定义模型和参数
- 支持流式输出

**参数设计**：
```typescript
{
  prompt: string;                    // 用户提示
  model?: string;                    // 默认: x-ai/grok-4.1-fast
  temperature?: number;              // 0-2，默认 1
  max_tokens?: number;               // 最大 token 数
  stream?: boolean;                  // 是否流式输出
}
```

**注意**：此工具可能不需要，因为 Claude Code 本身就有对话能力。

---

## 🏗️ 技术架构

### 3.1 技术栈选型（基于测试结果）

#### 3.1.1 核心依赖

| 依赖 | 版本 | 用途 | 测试结果 |
|------|------|------|----------|
| `@modelcontextprotocol/sdk` | ^1.8.0 | MCP 协议实现 | - |
| `openai` | ^4.77.0 | Grok API 客户端 | ✅ 完全兼容 |
| `zod` | ^3.23.0 | 参数验证 | - |
| `fast-glob` | ^3.3.3 | 文件匹配 | - |
| `micromatch` | ^4.0.8 | 模式匹配 | - |
| `https-proxy-agent` | ^7.x | 代理支持 | ✅ 工作正常 |

#### 3.1.2 测试结果总结

✅ **成功的功能**：
- 基础对话（OpenAI SDK 完全兼容）
- 函数调用（Function Calling）
- 流式输出（Streaming）
- 推理能力（自动包含 reasoning_tokens）

❌ **失败的功能**：
- 原生搜索工具（OpenRouter 不支持 `type: 'web_search'`）
- 特定模型 ID（`grok-4-heavy`、`grok-4.1-fast-reasoning` 在 OpenRouter 上不存在）

⚠️ **需要特殊处理**：
- 搜索工具：使用 Function Calling 模拟
- 多智能体：使用提示工程模拟

---

### 3.2 API 策略：混合方案（推荐）

#### 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **OpenRouter** | 统一计费、简单 | 功能受限、需要手动实现工具循环 | 快速原型、测试 |
| **官方 xAI API** | 功能完整、原生支持 | 无 TypeScript SDK、需要手动实现 | 生产环境 |
| **混合方案** ⭐ | 灵活、可切换 | 实现复杂度中等 | **推荐** |

#### 混合方案实现

```typescript
// 环境变量配置
const API_KEY = process.env.XAI_API_KEY || process.env.OPENROUTER_API_KEY;
const BASE_URL = process.env.XAI_BASE_URL || 'https://openrouter.ai/api/v1';

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  httpAgent: proxyAgent  // 代理支持
});
```

**优势**：
- 开发时使用 OpenRouter（统一计费）
- 生产时切换到官方 API（完整功能）
- 通过环境变量控制

---

### 3.3 搜索工具实现：工具调用循环

**核心流程**：

```typescript
async function agentSearch(query: string, options: SearchOptions) {
  // 1. 定义搜索函数
  const tools = [
    { type: 'function', function: webSearchTool },
    { type: 'function', function: xSearchTool }
  ];

  let messages = [{ role: 'user', content: query }];
  let maxIterations = 5;  // 防止无限循环

  for (let i = 0; i < maxIterations; i++) {
    // 2. 调用 Grok
    const response = await client.chat.completions.create({
      model: 'x-ai/grok-4.1-fast',
      messages,
      tools
    });

    const choice = response.choices[0];

    // 3. 检查是否完成
    if (choice.finish_reason === 'stop') {
      return choice.message.content;  // 返回最终结果
    }

    // 4. 执行工具调用
    if (choice.finish_reason === 'tool_calls') {
      messages.push(choice.message);  // 添加 Grok 的消息

      for (const toolCall of choice.message.tool_calls) {
        // 执行实际的搜索
        const result = await executeSearch(toolCall);

        // 添加工具结果
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // 继续循环，让 Grok 总结结果
      continue;
    }

    // 5. 其他情况
    throw new Error(`Unexpected finish_reason: ${choice.finish_reason}`);
  }

  throw new Error('Max iterations reached');
}
```

---

### 3.4 项目结构

```
src/
├── config/
│   ├── constants.ts       # MCP 版本、错误码、工具名称
│   └── models.ts          # Grok 模型配置
├── tools/
│   ├── definitions.ts     # MCP 工具定义（使用 Zod）
│   ├── agent-search.ts    # 智能体搜索（核心）
│   ├── brainstorm.ts      # 头脑风暴
│   └── chat.ts            # 基础对话（可选）
├── utils/
│   ├── grok-client.ts     # OpenAI SDK 封装
│   ├── tool-executor.ts   # 工具调用循环实现
│   ├── search-executor.ts # 搜索执行器
│   ├── file-reader.ts     # 文件系统访问（复用 Gemini-mcp）
│   ├── security.ts        # 安全验证（复用 Gemini-mcp）
│   ├── validators.ts      # 参数验证（复用 Gemini-mcp）
│   └── error-handler.ts   # 错误处理（复用 Gemini-mcp）
├── types.ts               # TypeScript 类型定义
└── server.ts              # MCP 服务器主入口
```

---

## 🔒 安全与性能

### 4.1 安全考虑

**复用 Gemini-mcp 的安全机制**：
- 路径遍历攻击防护
- 敏感文件保护
- 目录白名单验证
- 符号链接检测
- 文件大小和数量限制

**API 密钥管理**：
```bash
# 官方 xAI API
XAI_API_KEY=your_xai_key_here
XAI_BASE_URL=https://api.x.ai/v1

# 或 OpenRouter
OPENROUTER_API_KEY=your_openrouter_key_here

# 代理（可选）
HTTPS_PROXY=http://127.0.0.1:7890
```

---

### 4.2 性能优化

**速率限制处理**：
- 429（速率限制）：指数退避 + 抖动
- 500/502/503（服务器瞬态）：立即重试 1-3 次
- 超时：默认 90-120s（推理模型需要更长时间）

**成本优化**：
- 默认使用 `x-ai/grok-4.1-fast`（性价比高）
- 利用 OpenRouter 的缓存机制（cached_tokens）
- 监控 token 使用情况

**测试结果**：
```json
{
  "prompt_tokens": 163,
  "completion_tokens": 237,
  "total_tokens": 400,
  "cost": 0.00012845,  // 约 $0.13/1000 次调用
  "prompt_tokens_details": {
    "cached_tokens": 151  // ← 缓存节省成本
  },
  "completion_tokens_details": {
    "reasoning_tokens": 198  // ← 自动包含推理
  }
}
```

---

## 📊 定价与限制

### 5.1 OpenRouter 定价（测试结果）

**实际成本**（基于测试）：
- 输入：163 tokens × $0.061/1M = $0.00000995
- 输出：237 tokens × $0.50/1M = $0.0001185
- **总计**：$0.00012845/次调用

**推算**：
- 1000 次调用 ≈ $0.13
- 10000 次调用 ≈ $1.30

**注意**：
- 包含 5% OpenRouter 加价
- 推理 tokens 计入输出成本
- 缓存可节省 ~90% 输入成本

---

## 🚀 开发路线图

### Phase 1：核心框架（第 1 周）
- [x] 项目初始化
- [x] API 测试和验证
- [ ] MCP 服务器框架
- [ ] OpenAI SDK 集成
- [ ] 工具调用循环实现
- [ ] 错误处理和验证
- [ ] 代理支持

### Phase 2：核心工具（第 2 周）
- [ ] grok_agent_search - 智能体搜索（核心）
  - [ ] Function Calling 定义
  - [ ] 工具调用循环
  - [ ] Web 搜索执行器
  - [ ] X 搜索执行器
  - [ ] 结果总结和引用
- [ ] grok_brainstorm - 头脑风暴
  - [ ] 提示工程（模拟 4-Agent）
  - [ ] 多角度分析
  - [ ] 创意生成

### Phase 3：测试和文档（第 3 周）
- [ ] 单元测试（vitest）
- [ ] 集成测试
- [ ] README 文档
- [ ] Claude Code 集成指南
- [ ] 发布到 npm

---

## ❓ 待讨论的问题

### 1. 工具集最终确认

**当前方案**：2-3 个工具

**必备（2个）**：
1. ✅ `grok_agent_search` - 智能体搜索（核心）
2. ✅ `grok_brainstorm` - 头脑风暴

**可选（1个）**：
3. ⚠️ `grok_chat` - 基础对话（可能不需要）

**你的意见**：
- 是否需要 `grok_chat`？
- 还有其他需要的工具吗？

---

### 2. 搜索执行器实现

**问题**：如何实际执行搜索？

**选项 A**：调用官方 xAI API 的搜索端点
- 需要官方 API Key
- 功能完整
- 成本额外

**选项 B**：使用第三方搜索 API
- Google Custom Search API
- Bing Search API
- SerpAPI
- 成本可控

**选项 C**：混合方案
- 优先使用官方 API（如果有 Key）
- 降级到第三方 API

**建议**：选项 C（最灵活）

---

### 3. 多智能体功能

**问题**：如何实现多智能体推理？

**选项 A**：提示工程（当前方案）
- 通过 system prompt 模拟 4-Agent
- 无需特殊模型
- 效果可能不如原生

**选项 B**：等待官方 API 支持
- 使用 `grok-4-heavy` 或 `grok-4.20-beta`
- 需要官方 API
- 效果最好

**建议**：先用选项 A，后续升级到选项 B

---

## 📝 附录

### A. 测试结果

详见 `TEST_RESULTS.md`

**关键发现**：
- ✅ OpenAI SDK 完全兼容
- ✅ Function Calling 完美支持
- ✅ 自动包含 reasoning_tokens
- ❌ OpenRouter 不支持原生搜索工具
- ❌ 某些模型 ID 不存在

---

### B. 环境变量

```bash
# 必需（二选一）
XAI_API_KEY=your_xai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here

# 可选
XAI_BASE_URL=https://api.x.ai/v1  # 或 https://openrouter.ai/api/v1
HTTPS_PROXY=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890
```

---

### C. Claude Code 配置示例

```json
{
  "mcpServers": {
    "grok": {
      "command": "npx",
      "args": ["-y", "@your-org/mcp-server-grok"],
      "env": {
        "OPENROUTER_API_KEY": "your_key_here",
        "HTTPS_PROXY": "http://127.0.0.1:7890"
      }
    }
  }
}
```

---

## 🎯 下一步行动

1. **确认工具集**：
   - 2 个核心工具（agent_search + brainstorm）
   - 是否需要第 3 个工具？

2. **确认搜索执行器**：
   - 使用哪种搜索 API？
   - 官方 API vs 第三方 API

3. **开始实施**：
   - 创建项目结构
   - 实现核心框架
   - 实现工具调用循环
   - 逐步添加工具

---

**文档状态**：v0.2.0 - 基于测试结果更新，等待最终确认
