# Grok-mcp 产品需求文档 (PRD)

**版本**: v0.1.0
**日期**: 2026-03-09
**状态**: 初稿 - 待讨论

---

## 📋 项目概述

### 1.1 项目目标

创建一个基于 Model Context Protocol (MCP) 的 xAI Grok API 服务器，使 Claude Code 和其他 MCP 客户端能够利用 Grok 的核心能力：

- **智能体级别的搜索**：利用 Grok 的服务器端智能体工具（web_search、x_search）
- **多智能体推理**：利用 grok-4-heavy 的"Council of Agents"架构
- **实时信息获取**：X 平台实时动态和全网搜索
- **视觉理解**：图像分析和多模态交互

### 1.2 核心价值主张

**与 Gemini-mcp 的差异化定位：**

| 特性 | Gemini-mcp | Grok-mcp |
|------|-----------|----------|
| 核心优势 | 代码生成、UI 设计 | **实时搜索、X 平台集成** |
| 搜索能力 | Google Search（通过 Grounding） | **DeepSearch + X Search（原生）** |
| 智能体架构 | 单一模型 | **Council of Agents（16 个并行智能体）** |
| 实时性 | 一般 | **秒级实时（X 平台）** |
| 代码分析 | 强 | 一般 |

**核心定位**：Grok-mcp 专注于**实时信息获取和智能体级别的搜索**，与 Gemini-mcp 形成互补。

---

## 🎯 核心功能需求

### 2.1 必备工具（4个）

#### 2.1.1 grok_chat - 基础对话

**功能描述**：
- 基础对话能力
- 支持推理努力度控制（reasoning_effort: low/high）
- 支持流式输出
- 支持函数调用

**参数设计**：
```typescript
{
  prompt: string;                    // 用户提示
  model?: string;                    // 默认: grok-4-1-fast-reasoning
  reasoning_effort?: 'low' | 'high'; // 推理努力度
  temperature?: number;              // 0-2，默认 1
  max_tokens?: number;               // 最大 token 数
  stream?: boolean;                  // 是否流式输出
}
```

**推荐模型**：
- `grok-4-1-fast-reasoning` - 默认，2M token 上下文
- `grok-4-heavy` - 多智能体推理（Council of Agents）
- `grok-code-fast-1` - 代码专用

---

#### 2.1.2 grok_vision_query - 视觉理解

**功能描述**：
- 图像分析和理解
- 支持 Base64 和 URL 输入
- 支持多图输入
- 支持详细度控制

**参数设计**：
```typescript
{
  prompt: string;                    // 分析提示
  images: string[];                  // 图像数组（Base64 或 URL）
  model?: string;                    // 默认: grok-4
  detail?: 'low' | 'high' | 'auto'; // 详细度
  max_tokens?: number;
}
```

**技术细节**：
- 支持 JPEG/PNG（最大 20MB）
- 分块逻辑：448×448 像素，每块 256 tokens
- 最大 6 块/图像

---

#### 2.1.3 grok_web_search - 网络搜索（核心）

**功能描述**：
- **服务器端智能体工具**：Grok 自动决定何时搜索并总结结果
- 全网实时信息检索
- 自动引用来源
- 支持域名过滤

**参数设计**：
```typescript
{
  query: string;                     // 搜索查询
  model?: string;                    // 默认: grok-4-1-fast-reasoning
  allowed_domains?: string[];        // 允许的域名列表
  excluded_domains?: string[];       // 排除的域名列表
  enable_image_understanding?: boolean; // 是否理解图像
  max_results?: number;              // 最大结果数
}
```

**实现方式**：
- 使用 `/v1/responses` API（而非旧的 `/v1/chat/completions`）
- Grok 自动编排搜索循环
- 返回包含引用的总结

**关键优势**：
- ✅ 一次调用完成（无需手动工具调用循环）
- ✅ Grok 自动决定搜索时机
- ✅ 自动生成引用和来源

---

#### 2.1.4 grok_x_search - X 平台搜索（核心）

**功能描述**：
- **Grok 独有功能**：实时检索 X 平台动态
- 秒级延迟的实时信息
- 支持账号过滤
- 支持时间范围
- 支持视频理解

**参数设计**：
```typescript
{
  query: string;                     // 搜索查询
  model?: string;                    // 默认: grok-4-1-fast-reasoning
  allowed_x_handles?: string[];      // 允许的 X 账号列表
  from_date?: string;                // 开始时间（ISO8601）
  to_date?: string;                  // 结束时间（ISO8601）
  enable_video_understanding?: boolean; // 是否理解视频
  max_results?: number;              // 最大结果数
}
```

**实现方式**：
- 使用 `/v1/responses` API
- 利用 Grok 的 X 平台实时数据流
- 自动编排搜索和总结

**应用场景**：
- 实时新闻追踪
- 舆情分析
- 趋势发现
- 特定账号动态监控

---

### 2.2 可选工具（2-3个）

#### 2.2.1 grok_analyze_content - 内容分析

**功能描述**：
- 代码/文档/数据分析
- 支持文件路径和直接内容
- 自动语言检测

**参数设计**：
```typescript
{
  content?: string;                  // 直接内容
  file_path?: string;                // 文件路径
  task?: 'summarize' | 'review' | 'explain' | 'optimize';
  model?: string;                    // 默认: grok-4-1-fast
  focus?: string[];                  // 关注点
}
```

**复用组件**：
- 文件读取：复用 Gemini-mcp 的 `file-reader.ts`
- 安全验证：复用 Gemini-mcp 的 `security.ts`

---

#### 2.2.2 grok_analyze_codebase - 代码库分析

**功能描述**：
- 利用 2M token 上下文分析整个代码库
- 支持目录/文件列表/glob 模式
- 架构分析、模式识别

**参数设计**：
```typescript
{
  directory?: string;                // 目录路径
  file_paths?: string[];             // 文件路径列表
  include?: string[];                // Glob 包含模式
  exclude?: string[];                // Glob 排除模式
  focus?: 'architecture' | 'security' | 'performance';
  model?: string;                    // 默认: grok-4-1-fast-reasoning
}
```

**技术限制**：
- 最大 2M tokens（约 150 万字）
- 自动文件过滤（排除 node_modules、.git 等）

---

#### 2.2.3 grok_generate_image - 图像生成（待定）

**功能描述**：
- 使用 Grok Imagine 生成图像
- 支持文本到图像
- 支持图像到图像

**参数设计**：
```typescript
{
  prompt: string;                    // 生成提示
  image_url?: string;                // 参考图像（可选）
  aspect_ratio?: string;             // 宽高比
  n?: number;                        // 生成数量
}
```

**注意**：此功能待讨论是否包含。

---

## 🏗️ 技术架构

### 3.1 技术栈选型

#### 3.1.1 核心依赖

| 依赖 | 版本 | 用途 | 理由 |
|------|------|------|------|
| `@modelcontextprotocol/sdk` | ^1.8.0 | MCP 协议实现 | 官方 SDK，最新版本 |
| `openai` | ^4.x | Grok API 客户端 | **完全兼容 Grok API** |
| `zod` | ^3.23.0 | 参数验证 | 类型安全的运行时验证 |
| `fast-glob` | ^3.3.3 | 文件匹配 | 复用 Gemini-mcp |
| `micromatch` | ^4.0.8 | 模式匹配 | 复用 Gemini-mcp |
| `https-proxy-agent` | ^7.x | 代理支持 | 国内网络环境 |

#### 3.1.2 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `typescript` | ^5.3.3 | TypeScript 编译 |
| `vitest` | ^2.0.0 | 现代化测试框架 |
| `@types/node` | ^20.10.0 | Node.js 类型定义 |

---

### 3.2 SDK 选择：OpenAI SDK

**核心发现**（基于 Gemini 调研）：

✅ **完全兼容**：
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'  // 只需修改 baseURL
});
```

✅ **支持所有功能**：
- Chat Completions
- Vision（多模态）
- Function Calling
- Streaming
- 2M token 上下文

✅ **与 Gemini-mcp 架构一致**：
- Gemini-mcp 使用 `@google/genai`
- Grok-mcp 使用 `openai`
- 架构模式相同，易于维护

---

### 3.3 关键技术决策

#### 3.3.1 搜索工具实现：服务器端智能体

**核心发现**（基于 Gemini 调研）：

xAI 在 2026 年推出了 **Responses API (`/v1/responses`)**，支持服务器端智能体工具：

```typescript
// ❌ 旧方式：手动工具调用循环（复杂）
const response = await client.chat.completions.create({
  model: 'grok-4',
  messages: [...],
  tools: [web_search_tool]
});
// 需要检查 finish_reason，执行工具，返回结果...

// ✅ 新方式：服务器端智能体（简单）
const response = await client.responses.create({
  model: 'grok-4-1-fast-reasoning',
  query: '最新的 AI 法规是什么？',
  tools: [
    { type: 'web_search', allowed_domains: ['techcrunch.com'] }
  ]
});
// Grok 自动搜索并返回总结 + 引用
```

**实现策略**：
1. 优先使用 `/v1/responses` API（如果 OpenAI SDK 支持）
2. 如果不支持，手动实现工具调用循环
3. 封装为统一接口，对 MCP 客户端透明

---

#### 3.3.2 多智能体推理：grok-4-heavy

**核心发现**（基于 Gemini 调研）：

**Council of Agents 架构**：
- `grok-4-heavy`：16 个并行智能体
- 内部辩论和共识构建
- 性能提升 2 倍（HLE 基准：44.4% vs 25%）

**使用场景**：
- 复杂推理任务
- 需要多角度分析
- 高准确度要求

**实现方式**：
```typescript
// 用户可以选择模型
{
  model: 'grok-4-heavy',  // 启用 Council of Agents
  query: '分析这个架构设计的优缺点'
}
```

---

#### 3.3.3 代理支持

**实现方式**：
```typescript
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
  httpAgent: agent  // 代理支持
});
```

**环境变量**：
- `HTTPS_PROXY`
- `HTTP_PROXY`
- `XAI_API_KEY`

---

### 3.4 项目结构

```
src/
├── config/
│   ├── constants.ts       # MCP 版本、错误码、工具名称
│   └── models.ts          # Grok 模型配置和映射
├── tools/
│   ├── definitions.ts     # MCP 工具定义（使用 Zod）
│   ├── chat.ts            # 基础对话
│   ├── vision-query.ts    # 视觉理解
│   ├── web-search.ts      # 网络搜索（核心）
│   ├── x-search.ts        # X 平台搜索（核心）
│   ├── analyze-content.ts # 内容分析（可选）
│   └── analyze-codebase.ts # 代码库分析（可选）
├── utils/
│   ├── grok-client.ts     # OpenAI SDK 封装
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
- 敏感文件保护（.env、.ssh、credentials 等）
- 目录白名单验证
- 符号链接检测
- 文件大小和数量限制

**API 密钥管理**：
- 环境变量：`XAI_API_KEY`
- 不在代码中硬编码
- 支持 .env 文件

---

### 4.2 性能优化

**速率限制**：
- 免费层：60 RPM / 100K TPM
- 标准层：600 RPM / 1M TPM
- 实现指数退避重试

**错误处理**：
- 429（速率限制）：指数退避 + 抖动
- 500/502/503（服务器瞬态）：立即重试 1-3 次
- 400/401/403（客户端永久）：中止并报错
- 超时：默认 90-120s（推理模型需要更长时间）

**成本优化**：
- 默认使用 `grok-4-1-fast`（性价比高）
- 仅在需要时使用 `grok-4-heavy`（成本高）
- 搜索工具：$5/1000 次（需要提醒用户）

---

## 📊 定价与限制

### 5.1 Grok API 定价（2026）

| 模型 | 输入（$/1M tokens） | 输出（$/1M tokens） | 上下文窗口 |
|------|---------------------|---------------------|------------|
| grok-4-1-fast-reasoning | $0.20 | $0.50 | 2M |
| grok-4-heavy | $3.00 | $15.00 | 256K |
| grok-code-fast-1 | $0.20 | $1.50 | 256K |
| grok-3-mini | $0.30 | $0.50 | 131K |

**工具调用费用**：
- Web Search: $5.00/1000 次
- X Search: $2.50/1000 次

---

### 5.2 OpenRouter vs 官方 API

**核心发现**（基于 Gemini 调研）：

| 对比项 | 官方 xAI API | OpenRouter |
|--------|--------------|------------|
| 延迟 | 最低 | +100-300ms |
| 功能支持 | 完整 | 基本完整 |
| 定价 | 原价 | +5% 加价 |
| 搜索工具 | 原生支持 | 额外计费 |
| 统一计费 | ❌ | ✅ |

**建议**：
- 默认使用**官方 xAI API**（延迟低、功能全）
- 可选支持 OpenRouter（统一计费）
- 通过环境变量切换：`XAI_BASE_URL`

---

## 🚀 开发路线图

### Phase 1：核心框架（第 1 周）
- [x] 项目初始化
- [ ] MCP 服务器框架
- [ ] OpenAI SDK 集成
- [ ] 错误处理和验证
- [ ] 代理支持

### Phase 2：必备工具（第 2 周）
- [ ] grok_chat - 基础对话
- [ ] grok_vision_query - 视觉理解
- [ ] grok_web_search - 网络搜索（核心）
- [ ] grok_x_search - X 平台搜索（核心）

### Phase 3：可选工具（第 3 周）
- [ ] grok_analyze_content - 内容分析
- [ ] grok_analyze_codebase - 代码库分析
- [ ] grok_generate_image - 图像生成（待定）

### Phase 4：测试和文档（第 4 周）
- [ ] 单元测试（vitest）
- [ ] 集成测试
- [ ] README 文档
- [ ] Claude Code 集成指南
- [ ] 发布到 npm

---

## ❓ 待讨论的问题

### 1. 工具集最终确认

**当前建议**：4-6 个工具

**必备（4个）**：
- ✅ grok_chat
- ✅ grok_vision_query
- ✅ grok_web_search（核心）
- ✅ grok_x_search（核心）

**可选（2-3个）**：
- ⚠️ grok_analyze_content
- ⚠️ grok_analyze_codebase
- ⚠️ grok_generate_image（你倾向于包含 1 个图像生成）

**问题**：
1. 是否包含 `grok_generate_image`？
2. 是否包含 `grok_analyze_content` 和 `grok_analyze_codebase`？
3. 还有其他需要的工具吗？

---

### 2. Responses API 实现

**问题**：OpenAI SDK 是否支持 `/v1/responses` API？

**调研需要**：
- 查看 OpenAI SDK 文档
- 测试 xAI API 的 `/v1/responses` 端点
- 如果不支持，需要手动实现

**你提到可以提供 OpenRouter key 测试**：
- 我可以用它测试 API 兼容性
- 验证搜索工具的实现方式
- 确认参数映射

---

### 3. 多智能体功能暴露

**问题**：是否需要单独的工具来使用 grok-4-heavy？

**选项 A**：通过 model 参数选择
```typescript
grok_chat({
  prompt: '...',
  model: 'grok-4-heavy'  // 用户自己选择
})
```

**选项 B**：单独的工具
```typescript
grok_multi_agent_reasoning({
  prompt: '...',
  // 自动使用 grok-4-heavy
})
```

**建议**：选项 A（更灵活）

---

## 📝 附录

### A. 参考资料

1. **Gemini 调研结果**：
   - Grok API 完全兼容 OpenAI SDK
   - Responses API 支持服务器端智能体工具
   - Council of Agents 架构（grok-4-heavy）
   - OpenRouter vs 官方 API 对比

2. **现有实现分析**：
   - joemccann/xai-mcp-server（最流行）
   - Bob-lance/grok-mcp（轻量级）
   - merterbak/Grok-MCP（Python，智能体能力）

3. **技术文档**：
   - xAI API 文档：https://api.x.ai/v1
   - MCP 规范：2024-11-05
   - OpenAI SDK：v4.x

---

### B. 环境变量

```bash
# 必需
XAI_API_KEY=your_api_key_here

# 可选
HTTPS_PROXY=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890
XAI_BASE_URL=https://api.x.ai/v1  # 或 OpenRouter URL
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
        "XAI_API_KEY": "your_api_key_here",
        "HTTPS_PROXY": "http://127.0.0.1:7890"
      }
    }
  }
}
```

---

## 🎯 下一步行动

1. **讨论并确认**：
   - 工具集最终方案（4-6 个工具）
   - 是否包含图像生成
   - Responses API 实现方式

2. **API 测试**：
   - 使用 OpenRouter key 测试兼容性
   - 验证搜索工具实现
   - 确认参数映射

3. **开始实施**：
   - 创建项目结构
   - 实现核心框架
   - 逐步添加工具

---

**文档状态**：初稿，等待反馈和讨论
