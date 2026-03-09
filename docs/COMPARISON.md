# Grok MCP 实现对比分析

## 📊 三个现有实现对比

### 1. **joemccann/xai-mcp-server**（最流行，v1.0.7）

**技术栈：**
- SDK: `@modelcontextprotocol/sdk` v1.0.0
- 验证: `zod` v3.23.0
- 测试: `vitest` v2.0.0
- 语言: TypeScript (ESM)

**工具集（5个）：**
1. `generate_image` - 图像生成（Grok Imagine）
2. `chat` - 基础对话
3. `analyze_image` - 视觉分析
4. `live_search` - 实时网络搜索
5. `generate_video` - 视频生成

**特点：**
- ✅ 完整的测试覆盖（单元测试 + 集成测试）
- ✅ 使用 Zod 进行参数验证
- ✅ 模块化设计（每个工具独立文件）
- ✅ 详细的错误处理
- ❌ 不使用官方 SDK（直接 fetch 调用）
- ❌ 没有代理支持

**API 调用方式：**
```typescript
// 直接使用 fetch
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

---

### 2. **Bob-lance/grok-mcp**（轻量级，v1.0.1）

**技术栈：**
- SDK: `@modelcontextprotocol/sdk` v1.8.0
- HTTP: `axios` v1.6.2
- 语言: TypeScript (ESM)

**工具集（2个）：**
1. `chat_completion` - 对话完成
2. `image_understanding` - 图像理解

**特点：**
- ✅ 极简设计，易于理解
- ✅ 支持多种 Grok 模型（grok-2-latest, grok-3, grok-3-reasoner, grok-3-deepsearch, grok-3-mini-beta）
- ✅ 支持流式输出
- ✅ 支持函数调用（Function Calling）
- ❌ 功能较少（只有 2 个工具）
- ❌ 没有测试
- ❌ 没有代理支持

**API 调用方式：**
```typescript
// 使用 axios
const response = await axios.post(
  'https://api.x.ai/v1/chat/completions',
  payload,
  {
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

### 3. **merterbak/Grok-MCP**（智能体能力，v0.1.0）

**技术栈：**
- SDK: `xai-sdk` v1.6.1（官方 SDK）
- MCP: `mcp[cli]` v1.13.1（FastMCP）
- HTTP: `httpx` v0.28.1
- 验证: `pydantic` v2.9.0
- 语言: Python 3.11+

**工具集（7个）：**
1. `list_models` - 列出可用模型
2. `generate_image` - 图像生成
3. `generate_video` - 视频生成
4. `chat_with_vision` - 视觉对话
5. `chat_with_files` - 文件对话（PDF/文档）
6. `chat_with_web_search` - 网络搜索对话
7. `chat_with_x_search` - X 平台搜索对话

**特点：**
- ✅ 使用官方 xAI SDK
- ✅ 支持 web_search 和 x_search 工具（服务器端智能体）
- ✅ 支持文件上传和分析（Files API）
- ✅ 有状态对话（store_messages）
- ✅ 支持代码执行工具
- ✅ Docker 部署支持
- ❌ Python 实现（我们需要 TypeScript）
- ❌ 没有测试

**API 调用方式：**
```python
# 使用官方 xai-sdk
from xai_sdk import Client
from xai_sdk.tools import web_search, x_search, code_execution

client = Client(api_key=XAI_API_KEY)
chat = client.chat.create(
    model="grok-4",
    tools=[web_search(), x_search(), code_execution()]
)
response = chat.sample()
```

---

## 🎯 关键发现

### 1. **SDK 选择**

| 方案 | 优点 | 缺点 |
|------|------|------|
| **官方 xai-sdk**（Python） | 完整功能、自动工具编排 | 只有 Python 版本 |
| **OpenAI SDK** | 成熟稳定、TypeScript 支持 | 需要手动处理工具调用 |
| **直接 fetch/axios** | 无依赖、完全控制 | 需要手动实现所有功能 |

**结论**：使用 **OpenAI SDK**（因为 Grok API 完全兼容）

---

### 2. **工具集设计**

**必备工具（核心功能）：**
1. ✅ `grok_chat` - 基础对话
2. ✅ `grok_vision_query` - 视觉理解
3. ✅ `grok_web_search` - 网络搜索（核心）
4. ✅ `grok_x_search` - X 平台搜索（核心）

**可选工具（扩展功能）：**
5. ⚠️ `grok_generate_image` - 图像生成（Grok Imagine）
6. ⚠️ `grok_generate_video` - 视频生成
7. ⚠️ `grok_analyze_content` - 内容分析
8. ⚠️ `grok_analyze_codebase` - 代码库分析

**不需要的工具：**
- ❌ `list_models` - 用户不需要在 MCP 中列出模型
- ❌ `chat_with_files` - Claude Code 已有文件处理能力

---

### 3. **搜索工具实现方式**

**方式 A：手动工具调用（joemccann/Bob-lance）**
```typescript
// 用户需要在 MCP 工具中手动调用搜索
const searchResults = await fetch('https://api.x.ai/v1/search', {...});
return searchResults;
```
❌ 需要两次调用（搜索 + 总结）
❌ 用户体验差

**方式 B：服务器端智能体工具（merterbak）**
```python
# Grok 自动决定何时使用搜索
chat = client.chat.create(
    model="grok-4",
    tools=[web_search(), x_search()]
)
response = chat.sample()  # Grok 自动调用搜索并总结
```
✅ 一次调用完成
✅ Grok 自动编排
✅ 用户体验好

**结论**：使用 **方式 B（服务器端智能体工具）**

---

### 4. **代理支持**

**Gemini-mcp 的实现：**
```typescript
import { ProxyAgent } from 'undici';

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

// 在 API 调用时使用
fetch(url, { dispatcher });
```

**OpenAI SDK 的代理支持：**
```typescript
import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = process.env.HTTPS_PROXY
  ? new HttpsProxyAgent(process.env.HTTPS_PROXY)
  : undefined;

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
  httpAgent: agent
});
```

---

## 💡 推荐的实施方案

### 技术栈
- **MCP SDK**: `@modelcontextprotocol/sdk` (最新版)
- **AI SDK**: `openai` (Grok API 兼容)
- **验证**: `zod` (类型安全的参数验证)
- **文件处理**: `fast-glob` + `micromatch` (复用 Gemini-mcp)
- **代理**: `https-proxy-agent`
- **测试**: `vitest` (现代化测试框架)

### 工具集（6个核心工具）

1. **grok_chat** - 基础对话
   - 支持推理努力度（reasoning_effort: low/high）
   - 支持流式输出
   - 支持函数调用

2. **grok_vision_query** - 视觉理解
   - 支持 Base64 和 URL
   - 支持多图输入
   - 支持详细度控制（detail: low/high/auto）

3. **grok_web_search** - 网络搜索（核心）
   - 使用服务器端智能体工具
   - 支持域名过滤（allowed_domains/excluded_domains）
   - 支持图像理解（enable_image_understanding）

4. **grok_x_search** - X 平台搜索（核心）
   - 使用服务器端智能体工具
   - 支持账号过滤（allowed_x_handles）
   - 支持时间范围（from_date/to_date）
   - 支持视频理解（enable_video_understanding）

5. **grok_analyze_content** - 内容分析
   - 支持文件路径和直接内容
   - 支持代码/文档/数据分析
   - 自动语言检测

6. **grok_analyze_codebase** - 代码库分析
   - 利用 2M token 上下文
   - 支持目录/文件列表/glob 模式
   - 安全验证（复用 Gemini-mcp 的 security.ts）

### 项目结构
```
src/
├── config/
│   ├── constants.ts       # MCP 版本、错误码、工具名称
│   └── models.ts          # Grok 模型配置
├── tools/
│   ├── definitions.ts     # MCP 工具定义（使用 Zod）
│   ├── chat.ts
│   ├── vision-query.ts
│   ├── web-search.ts      # 核心
│   ├── x-search.ts        # 核心
│   ├── analyze-content.ts
│   └── analyze-codebase.ts
├── utils/
│   ├── grok-client.ts     # OpenAI SDK 封装
│   ├── file-reader.ts     # 复用 Gemini-mcp
│   ├── security.ts        # 复用 Gemini-mcp
│   ├── validators.ts      # 复用 Gemini-mcp
│   └── error-handler.ts   # 复用 Gemini-mcp
├── types.ts
└── server.ts
```

---

## 🚀 下一步行动

1. ✅ 已完成：复制参考项目到 reference/
2. ✅ 已完成：对比分析现有实现
3. ⏭️ **下一步：编写 PRD.md**
   - 项目概述与目标
   - 技术栈选型（基于本对比分析）
   - 工具集详细设计
   - API 集成方案（服务器端智能体工具）
   - 安全与性能考虑
   - 开发路线图

---

## 📝 关键决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| SDK | OpenAI SDK | Grok API 完全兼容，成熟稳定 |
| 搜索实现 | 服务器端智能体工具 | 一次调用，Grok 自动编排 |
| 工具数量 | 6 个核心工具 | 平衡功能与复杂度 |
| 代理支持 | https-proxy-agent | 标准方案，易于配置 |
| 测试框架 | vitest | 现代化，速度快 |
| 参数验证 | zod | 类型安全，运行时验证 |
