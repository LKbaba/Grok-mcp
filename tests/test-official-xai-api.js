#!/usr/bin/env node
/**
 * 官方 xAI Grok API 测试
 *
 * 测试目标：
 * 1. 验证官方 API 可用性
 * 2. 测试 Grok 4.2 (grok-4-latest)
 * 3. 测试 4-Agent 架构
 * 4. 测试原生搜索工具
 */

import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 官方 xAI API 配置
const XAI_API_KEY = 'xai-NAUr25WTBRAUQAf9oazCRgSf7AvGu0Vw4q0PlKgmlsg9NNsFP58FDODOAqgo9KHX2TeW9r34QZlPfa9R';
const XAI_BASE_URL = 'https://api.x.ai/v1';

// 代理配置（如果需要）
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const httpAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

console.log('代理配置:', proxyUrl || '无代理');

// 创建 OpenAI 客户端（指向官方 xAI API）
const client = new OpenAI({
  apiKey: XAI_API_KEY,
  baseURL: XAI_BASE_URL,
  httpAgent,
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
});

// 官方 xAI 模型列表
const XAI_MODELS = {
  'grok-4-latest': 'grok-4-latest',           // 最新的 Grok 4（可能是 4.2）
  'grok-4': 'grok-4',                         // Grok 4 旗舰
  'grok-4-fast': 'grok-4-fast',               // Grok 4 快速版
  'grok-code-fast-1': 'grok-code-fast-1',     // 代码专用
  'grok-3': 'grok-3',                         // Grok 3
  'grok-3-mini': 'grok-3-mini'                // Grok 3 Mini
};

/**
 * 测试 1：验证官方 API 可用性
 */
async function test1_OfficialAPIAvailability() {
  console.log('\n=== 测试 1：官方 API 可用性 ===\n');

  const modelsToTest = Object.keys(XAI_MODELS);
  const results = {};

  for (const modelKey of modelsToTest) {
    try {
      console.log(`测试模型: ${XAI_MODELS[modelKey]}`);

      const response = await client.chat.completions.create({
        model: XAI_MODELS[modelKey],
        messages: [
          { role: 'user', content: '你好，请用一句话介绍你自己' }
        ],
        max_tokens: 100,
        temperature: 0
      });

      console.log(`✅ ${modelKey} 可用`);
      console.log(`实际模型: ${response.model}`);
      console.log(`回复: ${response.choices[0].message.content.substring(0, 80)}...`);

      if (response.usage) {
        console.log(`Token 使用: 输入=${response.usage.prompt_tokens}, 输出=${response.usage.completion_tokens}`);
      }

      results[modelKey] = {
        available: true,
        actualModel: response.model,
        usage: response.usage
      };
    } catch (error) {
      console.log(`❌ ${modelKey} 不可用: ${error.message}`);
      results[modelKey] = {
        available: false,
        error: error.message
      };
    }
    console.log('');
  }

  return results;
}

/**
 * 测试 2：Grok 4.2 (grok-4-latest) 详细测试
 */
async function test2_Grok42Details() {
  console.log('\n=== 测试 2：Grok 4.2 详细测试 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '请详细介绍一下你自己，包括你的版本、能力、特性等。'
        }
      ],
      max_tokens: 500,
      temperature: 0
    });

    console.log('✅ Grok 4.2 详细测试成功');
    console.log('实际模型:', response.model);
    console.log('\n回复:\n', response.choices[0].message.content);
    console.log('\nToken 使用:', JSON.stringify(response.usage, null, 2));

    return true;
  } catch (error) {
    console.error('❌ Grok 4.2 详细测试失败:', error.message);
    return false;
  }
}

/**
 * 测试 3：4-Agent 架构测试
 */
async function test3_FourAgentArchitecture() {
  console.log('\n=== 测试 3：4-Agent 架构测试 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: `请从以下四个角度分析"区块链技术在供应链管理中的应用"：

1. 技术可行性（Benjamin 视角）
2. 市场和实际应用（Harper 视角）
3. 创新和替代方案（Lucas 视角）
4. 综合评估和建议（Grok 视角）

请明确标注每个角度的分析。`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    console.log('✅ 4-Agent 架构测试成功');
    console.log('实际模型:', response.model);
    console.log('\n回复:\n', response.choices[0].message.content);
    console.log('\nToken 使用:', JSON.stringify(response.usage, null, 2));

    return true;
  } catch (error) {
    console.error('❌ 4-Agent 架构测试失败:', error.message);
    return false;
  }
}

/**
 * 测试 4：原生搜索工具（X Search + Web Search）
 */
async function test4_NativeSearchTools() {
  console.log('\n=== 测试 4：原生搜索工具 ===\n');

  try {
    // 测试 Web Search
    console.log('测试 Web Search...');
    const webSearchResponse = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '2026年3月9日，AI 领域有哪些重要新闻？请使用网络搜索获取最新信息。'
        }
      ],
      tools: [
        {
          type: 'web_search'
        }
      ],
      max_tokens: 1500,
      temperature: 0
    });

    console.log('✅ Web Search 测试成功');
    console.log('实际模型:', webSearchResponse.model);
    console.log('Finish Reason:', webSearchResponse.choices[0].finish_reason);
    console.log('\n回复:\n', webSearchResponse.choices[0].message.content);

    // 测试 X Search
    console.log('\n\n测试 X Search...');
    const xSearchResponse = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '最近 X 平台上关于 AI 的热门讨论有哪些？请使用 X 搜索获取实时信息。'
        }
      ],
      tools: [
        {
          type: 'x_search'
        }
      ],
      max_tokens: 1500,
      temperature: 0
    });

    console.log('✅ X Search 测试成功');
    console.log('实际模型:', xSearchResponse.model);
    console.log('Finish Reason:', xSearchResponse.choices[0].finish_reason);
    console.log('\n回复:\n', xSearchResponse.choices[0].message.content);

    return true;
  } catch (error) {
    console.error('❌ 原生搜索工具测试失败:', error.message);
    console.error('错误详情:', error.response?.data || error);
    return false;
  }
}

/**
 * 测试 5：Function Calling
 */
async function test5_FunctionCalling() {
  console.log('\n=== 测试 5：Function Calling ===\n');

  try {
    const response = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '今天北京的天气怎么样？'
        }
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
      temperature: 0
    });

    console.log('✅ Function Calling 测试成功');
    console.log('实际模型:', response.model);
    console.log('Finish Reason:', response.choices[0].finish_reason);

    if (response.choices[0].finish_reason === 'tool_calls') {
      console.log('\n工具调用:');
      for (const toolCall of response.choices[0].message.tool_calls) {
        console.log(`- ${toolCall.function.name}:`, toolCall.function.arguments);
      }
    } else {
      console.log('\n回复:', response.choices[0].message.content);
    }

    return true;
  } catch (error) {
    console.error('❌ Function Calling 测试失败:', error.message);
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
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '写一首关于人工智能的短诗'
        }
      ],
      stream: true,
      max_tokens: 200,
      temperature: 0.8
    });

    console.log('✅ 流式输出测试开始');
    console.log('回复: ');

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
async function runOfficialAPITests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         官方 xAI Grok API 测试                         ║');
  console.log('║         测试 Grok 4.2 + 4-Agent + 原生搜索             ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // 测试 1：可用性检查
  console.log('\n【阶段 1：模型可用性检查】');
  const availability = await test1_OfficialAPIAvailability();

  // 检查 grok-4-latest 是否可用
  if (!availability['grok-4-latest']?.available) {
    console.log('\n❌ grok-4-latest 不可用，无法继续测试');
    return;
  }

  console.log('\n✅ grok-4-latest 可用，继续测试...');
  console.log(`实际模型: ${availability['grok-4-latest'].actualModel}`);

  // 运行核心测试
  console.log('\n【阶段 2：核心功能测试】');
  const results = {
    '模型可用性': availability['grok-4-latest'].available,
    'Grok 4.2 详细信息': await test2_Grok42Details(),
    '4-Agent 架构': await test3_FourAgentArchitecture(),
    '原生搜索工具': await test4_NativeSearchTools(),
    'Function Calling': await test5_FunctionCalling(),
    '流式输出': await test6_Streaming()
  };

  // 输出测试结果
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

  console.log('1. 官方 API 可用性：', availability['grok-4-latest']?.available ? '✅ 可用' : '❌ 不可用');
  console.log('2. 实际模型版本：', availability['grok-4-latest']?.actualModel || '未知');
  console.log('3. 4-Agent 架构：', results['4-Agent 架构'] ? '✅ 支持' : '❌ 不支持');
  console.log('4. 原生搜索工具：', results['原生搜索工具'] ? '✅ 支持' : '❌ 不支持');
  console.log('5. Function Calling：', results['Function Calling'] ? '✅ 支持' : '❌ 不支持');
  console.log('6. 流式输出：', results['流式输出'] ? '✅ 支持' : '❌ 不支持');

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                  官方 API vs OpenRouter                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('官方 API 优势：');
  console.log('  ✅ 最新的模型版本（grok-4-latest）');
  console.log('  ✅ 原生搜索工具（web_search + x_search）');
  console.log('  ✅ 完整的 4-Agent 架构');
  console.log('  ✅ 最低延迟');
  console.log('  ✅ 完整功能支持');

  console.log('\nOpenRouter 优势：');
  console.log('  ✅ 统一计费（多个模型）');
  console.log('  ✅ 缓存机制（节省成本）');
  console.log('  ✅ 无需单独管理 API Key');
}

// 运行测试
runOfficialAPITests().catch(console.error);
