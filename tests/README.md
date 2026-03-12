# Grok-MCP 测试脚本

本目录包含 Grok API 的测试脚本和测试结果。

## 当前测试脚本

### test-responses-api.py ✅

**正确的 Responses API 测试脚本**

使用官方 xAI Responses API (`/v1/responses`) 测试 web_search 和 x_search 工具。

**运行方式**：
```bash
# 设置代理（如果需要）
export HTTPS_PROXY=http://127.0.0.1:7897

# 运行测试
python test-responses-api.py
```

**测试内容**：
1. Web Search 基础测试
2. X Search 搜索 X 平台
3. Web Search + X Search 混合搜索

**测试结果**：
- ✅ Web Search: 通过（~60s, 758 reasoning tokens）
- ✅ X Search: 通过（~60s, 838 reasoning tokens）
- ✅ 混合搜索: 通过（~90s+，需要更长超时时间）

## 测试结果

### responses-api-final-test.txt

完整的测试输出结果，包含：
- 所有测试的详细输出
- Token 使用统计
- 成本信息
- 实际的搜索结果示例

## 依赖

### package.json

Node.js 依赖配置（用于早期的 JavaScript 测试）：
- `openai`: ^4.77.0
- `https-proxy-agent`: ^7.0.5

**注意**：当前推荐使用 Python 脚本进行测试。

## 归档文件

历史测试脚本已移至 `archive/` 目录，包括：
- OpenRouter 测试脚本
- 旧 API 格式测试
- live_search 测试（已废弃）
- 临时测试脚本

详见 `archive/README.md`。

## 关键技术点

### 1. 正确的 API 端点

```python
XAI_BASE_URL = 'https://api.x.ai/v1'
endpoint = f'{XAI_BASE_URL}/responses'  # 不是 /chat/completions
```

### 2. 正确的工具格式

```python
# ✅ 正确：参数在顶层
tools = [
    {
        'type': 'web_search',
        'enable_image_understanding': True
    },
    {
        'type': 'x_search',
        'from_date': '2026-03-01',
        'enable_image_understanding': True
    }
]

# ❌ 错误：不要嵌套
tools = [
    {
        'type': 'web_search',
        'web_search': {  # 不要这样嵌套！
            'enable_image_understanding': True
        }
    }
]
```

### 3. 请求格式

```python
response = requests.post(
    f'{XAI_BASE_URL}/responses',
    headers={
        'Authorization': f'Bearer {XAI_API_KEY}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'grok-4-latest',
        'input': [  # 注意：是 input 不是 messages
            {'role': 'user', 'content': '...'}
        ],
        'tools': [...],
        'stream': False
    },
    timeout=120  # 搜索需要更长时间
)
```

### 4. 响应结构

```python
data = response.json()

# 提取输出
output = data.get('output', [])
for item in output:
    if item.get('type') == 'message':
        content = item.get('content', [])
        for c in content:
            if c.get('type') == 'output_text':
                text = c.get('text')

# 引用来源
citations = data.get('citations', [])

# Token 使用
usage = data.get('usage', {})
reasoning_tokens = usage.get('reasoning_tokens')
cost_in_usd_ticks = usage.get('cost_in_usd_ticks')
```

## 性能建议

1. **超时设置**
   - 单个搜索：60-120 秒
   - 混合搜索：90-180 秒

2. **代理配置**
   ```bash
   export HTTPS_PROXY=http://127.0.0.1:7897
   export HTTP_PROXY=http://127.0.0.1:7897
   ```

3. **成本计算**
   - 1 tick = 0.000001 USD
   - 示例：382,175,000 ticks = $0.382

## 参考文档

- `../docs/FINAL_TEST_RESULTS.md` - 详细测试结果和分析
- `../docs/RESPONSES_API_FINDINGS.md` - API 发现总结
- `../docs/PRD_FINAL.md` - 产品需求文档
- `../README.md` - 项目综合报告

## 官方文档

- xAI 官方文档: https://docs.x.ai/overview
- Web Search: https://docs.x.ai/docs/tools/web-search
- X Search: https://docs.x.ai/docs/tools/x-search
- Responses API: https://docs.x.ai/api/responses
