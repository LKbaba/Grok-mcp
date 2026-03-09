# Grok-MCP 项目综合报告

**项目启动日期**: 2026-03-09
**当前状态**: 技术调研完成，准备实现阶段
**核心目标**: 创建一个基于 MCP 协议的 Grok API 服务，重点实现搜索和智能代理功能

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术调研成果](#技术调研成果)
3. [API 测试结果](#api-测试结果)
4. [核心技术发现](#核心技术发现)
5. [项目结构](#项目结构)
6. [下一步计划](#下一步计划)

---

## 项目概述

### 项目背景

本项目参考了 Gemini-MCP 项目（位于 `E:\Github\Gemini-mcp`），旨在为 xAI 的 Grok 模型创建一个 MCP（Model Context Protocol）服务器。

### 核心特性

1. **Grok 4-Agent 架构支持**
   - Grok（协调者）
   - Harper（搜索专家）
   - Benjamin（逻辑推理）
   - Lucas（创意思维）

2. **双搜索引擎**
   - Web Search：实时互联网搜索
   - X Search：X 平台（Twitter）实时搜索

3. **MCP 工具实现**
   - `grok_agent_search`：智能搜索工具
   - `grok_brainstorm`：创意头脑风暴工具

---

## 技术调研成果

### 1. API 端点变更（重要发现）

xAI 在 **2026年1月12日** 进行了重大 API 更新：

| 项目 | 旧版 (已废弃) | 新版 (当前) |
|------|--------------|------------|
| **端点** | `/v1/chat/completions` | `/v1/responses` |
| **输入字段** | `messages` | `input` |
| **搜索工具** | `live_search` | `web_search`, `x_search` |
| **工具格式** | 嵌套对象 | 顶层参数 |

### 2. 模型信息

- **测试模型**: `grok-4-latest`
- **实际模型**: `grok-4-0709`
- **目标模型**: `grok-4.20` (Grok 4.2，尚未在 API 中可用)

### 3. OpenAI SDK 兼容性

✅ **完全兼容** - 可以使用 OpenAI Python SDK 访问 xAI API：

```python
from openai import OpenAI

client = OpenAI(
    api_key="xai-...",
    base_url="https://api.x.ai/v1"
)

# 使用 responses.create() 而不是 chat.completions.create()
response = client.responses.create(
    model="grok-4-latest",
    input=[{"role": "user", "content": "..."}],
    tools=[{"type": "web_search"}]
)
```

---

## API 测试结果

### 测试环境

- **API Key**: xai-NAUr25WTBRAUQAf9oazCRgSf7AvGu0Vw4q0PlKgmlsg9NNsFP58FDODOAqgo9KHX2TeW9r34QZlPfa9R
- **代理**: http://127.0.0.1:7897
- **测试日期**: 2026-03-09

### 测试结果汇总

| 测试项 | 状态 | 响应时间 | 工具调用 | Reasoning Tokens | 成本 (usd_ticks) |
|--------|------|----------|----------|------------------|------------------|
| **Web Search** | ✅ 通过 | ~60s | web_search: 1 | 758 | 382,175,000 |
| **X Search** | ✅ 通过 | ~60s | x_search: 1 | 838 | 364,812,500 |
| **混合搜索** | ✅ 通过* | ~90s+ | 两者都用 | 取决于查询 | - |

*混合搜索在单独测试时成功，完整测试时因超时失败（需要 >90s）

### 详细测试数据

#### Test 1: Web Search
```json
{
  "query": "2026年3月9日，AI 领域有哪些重要新闻？",
  "model": "grok-4-0709",
  "usage": {
    "input_tokens": 4695,
    "cached_tokens": 2430,
    "output_tokens": 1640,
    "reasoning_tokens": 758,
    "total_tokens": 6335
  },
  "server_side_tool_usage": {
    "web_search_calls": 1
  }
}
```

**返回结果**: 5 条 AI 新闻，包含引用链接

#### Test 2: X Search
```json
{
  "query": "最近 X 平台上关于 Grok 4.2 的讨论有哪些？",
  "model": "grok-4-0709",
  "date_range": "2026-03-01 至今",
  "usage": {
    "input_tokens": 6249,
    "cached_tokens": 10735,
    "output_tokens": 1562,
    "reasoning_tokens": 838,
    "total_tokens": 7811
  },
  "server_side_tool_usage": {
    "x_search_calls": 1
  }
}
```

**返回结果**: 5 条相关 X 帖子，包含用户反馈和讨论

---

## 核心技术发现

### 1. 正确的工具格式

#### ✅ 正确格式（顶层参数）

```json
{
  "type": "web_search",
  "enable_image_understanding": true,
  "filters": {
    "allowed_domains": ["example.com"],
    "excluded_domains": ["spam.com"]
  }
}
```

```json
{
  "type": "x_search",
  "from_date": "2026-03-01",
  "to_date": "2026-03-09",
  "enable_image_understanding": true,
  "enable_video_understanding": true,
  "allowed_x_handles": ["elonmusk"],
  "excluded_x_handles": ["spammer"]
}
```

#### ❌ 错误格式（嵌套对象）

```json
{
  "type": "web_search",
  "web_search": {  // ❌ 不要嵌套
    "enable_image_understanding": true
  }
}
```

### 2. 响应结构

Responses API 返回的结构与 Chat Completions 完全不同：

```json
{
  "id": "resp_...",
  "object": "response",
  "model": "grok-4-0709",
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "...",
          "annotations": [...]
        }
      ]
    }
  ],
  "citations": ["https://...", "https://..."],
  "usage": {
    "input_tokens": 4695,
    "output_tokens": 1640,
    "reasoning_tokens": 758,
    "total_tokens": 6335,
    "cost_in_usd_ticks": 382175000,
    "server_side_tool_usage_details": {
      "web_search_calls": 1,
      "x_search_calls": 0,
      "code_interpreter_calls": 0,
      "file_search_calls": 0,
      "mcp_calls": 0,
      "document_search_calls": 0
    }
  }
}
```

### 3. 关键特性

1. **自动推理**: `reasoning_tokens` 显示 Grok 的思考过程
2. **服务端工具**: 搜索在服务端执行，不需要客户端处理
3. **引用追踪**: `citations` 数组包含所有引用的 URL
4. **Token 缓存**: `cached_tokens` 显示缓存的输入 token
5. **成本追踪**: `cost_in_usd_ticks` 提供精确的成本信息（1 tick = 0.000001 USD）

### 4. 工具参数详解

#### Web Search 参数

| 参数 | 类型 | 说明 | 限制 |
|------|------|------|------|
| `enable_image_understanding` | boolean | 启用图片理解 | 可选 |
| `filters.allowed_domains` | string[] | 仅搜索指定域名 | 最多 5 个 |
| `filters.excluded_domains` | string[] | 排除指定域名 | 最多 5 个 |

#### X Search 参数

| 参数 | 类型 | 说明 | 限制 |
|------|------|------|------|
| `from_date` | string | 开始日期 | ISO8601 格式 |
| `to_date` | string | 结束日期 | ISO8601 格式 |
| `enable_image_understanding` | boolean | 启用图片理解 | 可选 |
| `enable_video_understanding` | boolean | 启用视频理解 | 可选，仅 X Search |
| `allowed_x_handles` | string[] | 仅搜索指定用户 | 最多 10 个 |
| `excluded_x_handles` | string[] | 排除指定用户 | 最多 10 个 |

---

## 项目结构

```
Grok-mcp/
├── CLAUDE.md                    # Claude 项目配置
├── README.md                    # 本文档
├── .gitignore                   # Git 忽略配置
│
├── docs/                        # 文档目录
│   ├── COMPARISON.md            # SDK 对比分析
│   ├── FINAL_TEST_RESULTS.md   # 最终测试结果
│   ├── GROK_42_REPORT.md        # Grok 4.20 调研报告
│   ├── PRD.md                   # 产品需求文档 v0.1
│   ├── PRD_v0.2.md              # 产品需求文档 v0.2
│   ├── RESPONSES_API_FINDINGS.md # Responses API 发现
│   └── TEST_RESULTS.md          # 测试结果汇总
│
├── tests/                       # 测试脚本目录
│   ├── test-grok-api.js         # OpenRouter API 测试
│   ├── test-grok-42.js          # Grok 4.20 测试
│   ├── test-official-xai-api.js # 官方 API 测试（旧格式）
│   ├── test-live-search.js      # Live Search 测试（已废弃）
│   ├── test-live-search.py      # Live Search Python 测试
│   ├── test-responses-api.py    # ✅ Responses API 测试（正确格式）
│   ├── test-mixed-only.py       # 混合搜索单独测试
│   ├── probe-grok-models.js     # 模型探测脚本
│   ├── package.json             # Node.js 依赖
│   ├── official-api-test-result.txt      # 官方 API 测试输出
│   └── responses-api-final-test.txt      # 最终测试输出
│
├── reference/                   # 参考项目
│   └── gemini-mcp-src/          # Gemini-MCP 源码
│
└── CCimages/                    # Playwright 截图
    ├── screenshots/             # 网页截图
    └── pdfs/                    # PDF 文件
```

---

## 下一步计划

### 阶段 1: MCP 服务器基础架构 ✅ 准备就绪

- [x] 技术调研完成
- [x] API 格式确认
- [x] 测试验证通过
- [ ] 创建 MCP 服务器骨架
- [ ] 实现基础配置和连接

### 阶段 2: 核心工具实现

#### 工具 1: grok_agent_search

**功能**: 智能搜索工具，支持 Web 和 X 平台搜索

**输入参数**:
```typescript
{
  query: string;              // 搜索查询
  search_type: 'web' | 'x' | 'both';  // 搜索类型
  date_range?: {              // 日期范围（可选）
    from: string;             // ISO8601
    to: string;               // ISO8601
  };
  filters?: {                 // 过滤器（可选）
    allowed_domains?: string[];
    excluded_domains?: string[];
    allowed_x_handles?: string[];
    excluded_x_handles?: string[];
  };
  enable_image_understanding?: boolean;
  enable_video_understanding?: boolean;
}
```

**输出**:
```typescript
{
  results: string;            // 搜索结果文本
  citations: string[];        // 引用来源
  reasoning_tokens: number;   // 推理 token 数
  cost: number;               // 成本（USD）
}
```

#### 工具 2: grok_brainstorm

**功能**: 创意头脑风暴工具，利用 Grok 的 4-Agent 架构

**输入参数**:
```typescript
{
  topic: string;              // 头脑风暴主题
  context?: string;           // 额外上下文
  perspectives?: string[];    // 指定视角
  count?: number;             // 想法数量（默认 5）
}
```

**输出**:
```typescript
{
  ideas: Array<{
    title: string;
    description: string;
    perspective: string;      // Grok/Harper/Benjamin/Lucas
    pros: string[];
    cons: string[];
  }>;
  reasoning_tokens: number;
  cost: number;
}
```

### 阶段 3: 高级功能

- [ ] 流式响应支持
- [ ] Token 缓存优化
- [ ] 成本追踪和报告
- [ ] 错误处理和重试机制
- [ ] 代理配置支持

### 阶段 4: 文档和测试

- [ ] API 文档
- [ ] 使用示例
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试

---

## 参考资料

### 官方文档

- xAI 官方文档: https://docs.x.ai/overview
- Web Search 工具: https://docs.x.ai/docs/tools/web-search
- X Search 工具: https://docs.x.ai/docs/tools/x-search
- Responses API: https://docs.x.ai/api/responses

### 项目参考

- Gemini-MCP: `E:\Github\Gemini-mcp`
- MCP 协议: https://modelcontextprotocol.io/

### 测试脚本

- ✅ **推荐使用**: `tests/test-responses-api.py` - 使用正确的 Responses API 格式
- ⚠️ **已废弃**: `tests/test-live-search.py` - 使用已废弃的 live_search

---

## 附录

### A. 成本计算

xAI API 使用 `cost_in_usd_ticks` 计费：
- 1 tick = 0.000001 USD = 0.0001 美分
- 示例：382,175,000 ticks = $0.382175

### B. Token 使用优化

1. **利用缓存**: `cached_tokens` 可以减少重复输入的成本
2. **控制输出**: 使用 `max_tokens` 限制输出长度
3. **选择模型**: 根据任务选择合适的模型（fast vs standard）

### C. 超时建议

基于测试结果：
- 单个搜索: 60-120 秒
- 混合搜索: 90-180 秒
- 复杂查询: 120-240 秒

### D. 错误处理

常见错误：
1. **400 Bad Request**: 检查工具格式是否正确（参数在顶层）
2. **Timeout**: 增加超时时间或简化查询
3. **Rate Limit**: 实现指数退避重试

---

**最后更新**: 2026-03-09
**文档版本**: 1.0
**项目状态**: 技术调研完成，准备实现
