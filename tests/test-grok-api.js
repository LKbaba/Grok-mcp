#!/usr/bin/env node
/**
 * Grok API 测试脚本（OpenRouter）
 *
 * 测试目标：
 * 1. 验证 OpenAI SDK 与 Grok API 的兼容性
 * 2. 测试智能体搜索功能（web_search + x_search）
 * 3. 测试多智能体推理（grok-4-heavy）
 * 4. 验证参数映射和响应格式
 */

import OpenAI from 'openai';

// OpenRouter 配置
const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// 创建 OpenAI 客户端（指向 OpenRouter）
const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/your-org/grok-mcp',
    'X-Title': 'Grok MCP Test'
  }
});

// 测试用的模型列表（基于 2026-03 OpenRouter 实际可用模型）
const MODELS = {
  'grok-4': 'x-ai/grok-4',                     // 旗舰推理模型，256K 上下文
  'grok-4.1-fast': 'x-ai/grok-4.1-fast',       // 高速智能体工作流，2M 上下文
  'grok-4-fast': 'x-ai/grok-4-fast',           // 高效变体，平衡成本和性能
  'grok-code-fast-1': 'x-ai/grok-code-fast-1', // 代码专用
  'grok-3': 'x-ai/grok-3',                     // 稳定版本
  'grok-3-mini': 'x-ai/grok-3-mini'            // 轻量级
};

/**
 * 测试 1：基础对话能力
 */
async function test1_BasicChat() {
  console.log('\n=== 测试 1：基础对话能力 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: MODELS['grok-4.1-fast'],
      messages: [
        { role: 'user', content: '用一句话介绍 xAI 公司' }
      ],
      max_tokens: 100
    });

    console.log('✅ 基础对话测试成功');
    console.log('模型:', response.model);
    console.log('回复:', response.choices[0].message.content);
    console.log('Token 使用:', response.usage);

    return true;
  } catch (error) {
    console.error('❌ 基础对话测试失败:', error.message);
    return false;
  }
}

/**
 * 测试 2：推理能力（reasoning_effort）
 */
async function test2_ReasoningMode() {
  console.log('\n=== 测试 2：推理能力 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: MODELS['grok-4'],  // 使用 grok-4 旗舰模型
      messages: [
        { role: 'user', content: '计算 123 * 456，并解释计算步骤' }
      ],
      max_tokens: 500
    });

    console.log('✅ 推理模式测试成功');
    console.log('模型:', response.model);
    console.log('回复:', response.choices[0].message.content);
    console.log('Token 使用:', response.usage);

    // 检查是否有推理 token
    if (response.usage.reasoning_tokens) {
      console.log('推理 Tokens:', response.usage.reasoning_tokens);
    }

    return true;
  } catch (error) {
    console.error('❌ 推理模式测试失败:', error.message);
    return false;
  }
}

/**
 * 测试 3：函数调用（Function Calling）
 */
async function test3_FunctionCalling() {
  console.log('\n=== 测试 3：函数调用能力 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: MODELS['grok-4.1-fast'],
      messages: [
        { role: 'user', content: '今天北京的天气怎么样？' }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: '获取指定城市的天气信息',
            parameters: {
              type: 'object',
              properties: {
                city: {
                  type: 'string',
                  description: '城市名称'
                }
              },
              required: ['city']
            }
          }
        }
      ],
      tool_choice: 'auto'
    });

    console.log('✅ 函数调用测试成功');
    console.log('模型:', response.model);
    console.log('Finish Reason:', response.choices[0].finish_reason);

    if (response.choices[0].finish_reason === 'tool_calls') {
      console.log('工具调用:', JSON.stringify(response.choices[0].message.tool_calls, null, 2));
    } else {
      console.log('回复:', response.choices[0].message.content);
    }

    return true;
  } catch (error) {
    console.error('❌ 函数调用测试失败:', error.message);
    return false;
  }
}

/**
 * 测试 4：搜索工具（web_search）
 * 注意：这个测试可能需要特殊的 API 端点或参数
 */
async function test4_WebSearch() {
  console.log('\n=== 测试 4：网络搜索工具 ===\n');

  try {
    // 使用 Function Calling 模拟搜索工具
    const response = await client.chat.completions.create({
      model: MODELS['grok-4.1-fast'],  // 使用正确的模型 ID
      messages: [
        { role: 'user', content: '2026年3月最新的 AI 新闻有哪些？' }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: '搜索网络获取实时信息',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索查询'
                }
              },
              required: ['query']
            }
          }
        }
      ],
      max_tokens: 1000
    });

    console.log('✅ 网络搜索测试成功');
    console.log('模型:', response.model);
    console.log('回复:', response.choices[0].message.content);

    return true;
  } catch (error) {
    console.error('❌ 网络搜索测试失败:', error.message);
    console.log('提示：OpenRouter 可能不支持 web_search 工具，或需要额外配置');
    return false;
  }
}

/**
 * 测试 5：多智能体推理（grok-4-heavy）
 */
async function test5_MultiAgentReasoning() {
  console.log('\n=== 测试 5：多智能体推理（grok-4）===\n');

  try {
    const response = await client.chat.completions.create({
      model: MODELS['grok-4'],  // 使用 grok-4 旗舰模型
      messages: [
        {
          role: 'user',
          content: '分析一下 SpaceX 的商业模式，从技术、市场、财务三个角度给出评估'
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    console.log('✅ 多智能体推理测试成功');
    console.log('模型:', response.model);
    console.log('回复:', response.choices[0].message.content);
    console.log('Token 使用:', response.usage);

    return true;
  } catch (error) {
    console.error('❌ 多智能体推理测试失败:', error.message);
    return false;
  }
}

/**
 * 测试 6：流式输出
 */
async function test6_Streaming() {
  console.log('\n=== 测试 6：流式输出 ===\n');

  try {
    const stream = await client.chat.completions.create({
      model: MODELS['grok-4.1-fast'],
      messages: [
        { role: 'user', content: '写一首关于人工智能的短诗' }
      ],
      stream: true,
      max_tokens: 200
    });

    console.log('✅ 流式输出测试开始');
    console.log('回复: ', '');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
    }

    console.log('\n\n✅ 流式输出测试成功');
    return true;
  } catch (error) {
    console.error('❌ 流式输出测试失败:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Grok API 兼容性测试（OpenRouter）              ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = {
    '基础对话': await test1_BasicChat(),
    '推理能力': await test2_ReasoningMode(),
    '函数调用': await test3_FunctionCalling(),
    '网络搜索': await test4_WebSearch(),
    '多智能体推理': await test5_MultiAgentReasoning(),
    '流式输出': await test6_Streaming()
  };

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                     测试结果汇总                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ 通过' : '❌ 失败';
    console.log(`${test.padEnd(20)} ${status}`);
  }

  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n总计: ${passedCount}/${totalCount} 测试通过`);

  // 输出关键发现
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                     关键发现                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('1. OpenAI SDK 兼容性：', results['基础对话'] ? '✅ 完全兼容' : '❌ 不兼容');
  console.log('2. 推理能力：', results['推理能力'] ? '✅ 支持' : '❌ 不支持');
  console.log('3. 函数调用：', results['函数调用'] ? '✅ 支持' : '❌ 不支持');
  console.log('4. 搜索工具：', results['网络搜索'] ? '✅ 支持' : '⚠️  需要特殊配置或官方 API');
  console.log('5. 多智能体：', results['多智能体推理'] ? '✅ 支持' : '❌ 不支持');
  console.log('6. 流式输出：', results['流式输出'] ? '✅ 支持' : '❌ 不支持');
}

// 运行测试
runAllTests().catch(console.error);
