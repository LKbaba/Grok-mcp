# Grok Responses API 最终测试结果

**测试日期**: 2026-03-09
**测试模型**: grok-4-latest (实际: grok-4-0709)
**API 端点**: https://api.x.ai/v1/responses

## 测试结果汇总

| 测试项 | 状态 | 响应时间 | 工具调用 | Reasoning Tokens |
|--------|------|----------|----------|------------------|
| Web Search | ✅ 通过 | ~60s | web_search: 1 | 758 |
| X Search | ✅ 通过 | ~60s | x_search: 1 | 838 |
| 混合搜索 | ✅ 通过* | ~90s+ | 两者都用 | 取决于查询 |

*混合搜索在单独测试时成功，完整测试时因超时失败（需要 >90s）

## 核心发现

### 1. 正确的 API 格式

**端点**: `/v1/responses` (不是 `/v1/chat/completions`)

**请求格式**:
```python
{
    "model": "grok-4-latest",
    "input": [  # 注意：是 input 不是 messages
        {"role": "user", "content": "..."}
    ],
    "tools": [
        {
            "type": "web_search",
            "enable_image_understanding": True
        },
        {
            "type": "x_search",
            "from_date": "2026-03-01",
            "enable_image_understanding": True,
            "enable_video_understanding": True
        }
    ],
    "stream": False
}
```

### 2. 工具参数说明

#### Web Search 工具
```json
{
  "type": "web_search",
  "enable_image_understanding": true,  // 可选
  "filters": {                          // 可选
    "allowed_domains": ["example.com"], // 最多 5 个
    "excluded_domains": ["spam.com"]    // 最多 5 个
  }
}
```

#### X Search 工具
```json
{
  "type": "x_search",
  "from_date": "2026-03-01",              // 可选，ISO8601 格式
  "to_date": "2026-03-09",                // 可选，ISO8601 格式
  "enable_image_understanding": true,     // 可选
  "enable_video_understanding": true,     // 可选（仅 X Search 支持）
  "allowed_x_handles": ["elonmusk"],      // 可选，最多 10 个
  "excluded_x_handles": ["spammer"]       // 可选，最多 10 个
}
```

**重要**: 所有参数都在顶层，不要嵌套在子对象中！

### 3. 响应结构

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
    "input_tokens_details": {
      "cached_tokens": 2430
    },
    "output_tokens": 1640,
    "output_tokens_details": {
      "reasoning_tokens": 758
    },
    "total_tokens": 6335,
    "num_sources_used": 0,
    "num_server_side_tools_used": 1,
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

### 4. 关键特性

1. **自动推理**: `reasoning_tokens` 显示 Grok 的思考过程
2. **服务端工具**: 搜索在服务端执行，不需要客户端处理
3. **引用追踪**: `citations` 数组包含所有引用的 URL
4. **Token 缓存**: `cached_tokens` 显示缓存的输入 token
5. **成本追踪**: `cost_in_usd_ticks` 提供精确的成本信息

### 5. 实际测试示例

#### Web Search 测试
- **查询**: "2026年3月9日，AI 领域有哪些重要新闻？"
- **结果**: 返回了 5 个主要新闻，包含引用链接
- **Token 使用**:
  - Input: 4695 (2430 cached)
  - Output: 1640 (758 reasoning)
  - Total: 6335
- **成本**: 382,175,000 usd_ticks

#### X Search 测试
- **查询**: "最近 X 平台上关于 Grok 4.2 的讨论有哪些？"
- **日期范围**: 2026-03-01 至今
- **结果**: 返回了 5 个相关帖子，包含用户反馈
- **Token 使用**:
  - Input: 6249 (10735 cached)
  - Output: 1562 (838 reasoning)
  - Total: 7811
- **成本**: 364,812,500 usd_ticks

### 6. 性能建议

1. **超时设置**:
   - 单个搜索: 60-120 秒
   - 混合搜索: 90-180 秒
2. **Token 缓存**: 利用 `cached_tokens` 减少成本
3. **流式响应**: 使用 `"stream": true` 获得更好的用户体验
4. **日期过滤**: X Search 使用 `from_date`/`to_date` 限制范围

## 与旧 API 的对比

| 特性 | Chat Completions (旧) | Responses API (新) |
|------|----------------------|-------------------|
| 端点 | `/v1/chat/completions` | `/v1/responses` |
| 输入字段 | `messages` | `input` |
| 搜索工具 | `live_search` (已废弃) | `web_search`, `x_search` |
| 工具格式 | 嵌套对象 | 顶层参数 |
| 推理 Token | 不显示 | `reasoning_tokens` |
| 引用 | 无 | `citations` 数组 |
| 成本追踪 | 基础 | 详细的 `cost_in_usd_ticks` |

## 下一步：实现 Grok-MCP

基于这些测试结果，我们现在可以实现 Grok-MCP，包含以下工具：

1. **grok_agent_search**:
   - 支持 web_search 和 x_search
   - 自动处理 4-Agent 架构
   - 返回带引用的结果

2. **grok_brainstorm**:
   - 利用 Grok 的创意能力
   - 支持多角度分析
   - 返回结构化的想法

## 参考资料

- 官方文档: https://docs.x.ai/overview
- Web Search: https://docs.x.ai/docs/tools/web-search
- X Search: https://docs.x.ai/docs/tools/x-search
- Responses API: https://docs.x.ai/api/responses
- 测试脚本: `test-responses-api.py`
