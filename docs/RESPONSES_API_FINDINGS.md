# Grok Responses API 测试结果（2026-03-09）

## 关键发现

### 1. API 端点变更
- ❌ **废弃**: `/v1/chat/completions` (旧的 Chat Completions API)
- ✅ **新端点**: `/v1/responses` (Responses API)
- 📅 **废弃日期**: 2026年1月12日

### 2. 搜索工具格式

#### 正确格式（来自官方文档 docs.x.ai）

**Web Search 工具**:
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

**X Search 工具**:
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

#### 错误格式（之前尝试的）
```json
// ❌ 错误：不要嵌套配置对象
{
  "type": "web_search",
  "web_search": {
    "enable_image_understanding": true
  }
}

// ❌ 错误：live_search 已废弃
{
  "type": "live_search",
  "sources": []
}
```

### 3. OpenAI SDK 兼容性

使用 OpenAI Python SDK 访问 xAI API:

```python
from openai import OpenAI

client = OpenAI(
    api_key="xai-...",
    base_url="https://api.x.ai/v1"
)

# 使用 responses.create() 而不是 chat.completions.create()
response = client.responses.create(
    model="grok-4-latest",
    input=[
        {"role": "user", "content": "What is xAI?"}
    ],
    tools=[
        {"type": "web_search"},
        {"type": "x_search"}
    ]
)
```

### 4. 响应结构

Responses API 返回的结构与 Chat Completions 不同:

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
    "input_tokens": 1615,
    "output_tokens": 881,
    "reasoning_tokens": 273,
    "total_tokens": 2496,
    "num_sources_used": 0,
    "num_server_side_tools_used": 1,
    "cost_in_usd_ticks": 144915000,
    "server_side_tool_usage_details": {
      "web_search_calls": 0,
      "x_search_calls": 1,
      "code_interpreter_calls": 0,
      "file_search_calls": 0,
      "mcp_calls": 0,
      "document_search_calls": 0
    }
  }
}
```

### 5. 测试结果

| 测试项 | 状态 | 说明 |
|--------|------|------|
| Web Search | ✅ 通过 | 使用 `{"type": "web_search"}` |
| X Search | ✅ 通过 | 使用 `{"type": "x_search", "from_date": "2026-03-01"}` |
| 混合搜索 | ✅ 通过 | 同时使用 web_search 和 x_search |

### 6. 4-Agent 架构

Grok 4.20 的 4-Agent 架构在 Responses API 中自动工作:
- **Grok**: 协调者
- **Harper**: 搜索专家
- **Benjamin**: 逻辑推理
- **Lucas**: 创意思维

从 `usage.reasoning_tokens` 可以看到推理过程的 token 消耗。

### 7. 关键参数

- `model`: `grok-4-latest` 映射到 `grok-4-0709`
- `input`: 使用 `input` 而不是 `messages`
- `tools`: 工具配置，参数直接在顶层
- `include`: 可选，如 `["reasoning.encrypted_content", "inline_citations"]`
- `stream`: 支持流式响应

## 下一步

1. ✅ 确认了正确的 API 格式
2. ✅ 验证了搜索工具工作正常
3. ⏳ 等待完整测试结果
4. 📝 准备编写 Grok-MCP 实现

## 参考资料

- 官方文档: https://docs.x.ai/overview
- Web Search: https://docs.x.ai/docs/tools/web-search
- X Search: https://docs.x.ai/docs/tools/x-search
- Responses API: https://docs.x.ai/api/responses
