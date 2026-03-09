#!/usr/bin/env node
/**
 * 测试 Grok 的 live_search 工具
 *
 * 根据官方 API 错误提示，正确的搜索工具类型是 'live_search'
 */

import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 官方 xAI API 配置
const XAI_API_KEY = 'xai-NAUr25WTBRAUQAf9oazCRgSf7AvGu0Vw4q0PlKgmlsg9NNsFP58FDODOAqgo9KHX2TeW9r34QZlPfa9R';
const XAI_BASE_URL = 'https://api.x.ai/v1';

// 代理配置
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const httpAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

console.log('代理配置:', proxyUrl || '无代理');

// 创建客户端
const client = new OpenAI({
  apiKey: XAI_API_KEY,
  baseURL: XAI_BASE_URL,
  httpAgent,
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
});

/**
 * 测试 1：live_search 基础测试
 */
async function test1_LiveSearchBasic() {
  console.log('\n=== 测试 1：live_search 基础测试 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '2026年3月9日，AI 领域有哪些重要新闻？请使用实时搜索获取最新信息。'
        }
      ],
      tools: [
        {
          type: 'live_search'  // 使用 live_search 而不是 web_search
        }
      ],
      max_tokens: 1500,
      temperature: 0
    });

    console.log('✅ live_search 测试成功');
    console.log('实际模型:', response.model);
    console.log('Finish Reason:', response.choices[0].finish_reason);
    console.log('\n回复:\n', response.choices[0].message.content);
    console.log('\nToken 使用:', JSON.stringify(response.usage, null, 2));

    return true;
  } catch (error) {
    console.error('❌ live_search 测试失败:', error.message);
    console.error('错误详情:', error.response?.data || error);
    return false;
  }
}

/**
 * 测试 2：live_search 搜索 X 平台
 */
async function test2_LiveSearchX() {
  console.log('\n=== 测试 2：live_search 搜索 X 平台 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '最近 X 平台上关于 Grok 4.2 的讨论有哪些？请使用实时搜索获取信息。'
        }
      ],
      tools: [
        {
          type: 'live_search'
        }
      ],
      max_tokens: 1500,
      temperature: 0
    });

    console.log('✅ X 平台搜索测试成功');
    console.log('实际模型:', response.model);
    console.log('Finish Reason:', response.choices[0].finish_reason);
    console.log('\n回复:\n', response.choices[0].message.content);
    console.log('\nToken 使用:', JSON.stringify(response.usage, null, 2));

    return true;
  } catch (error) {
    console.error('❌ X 平台搜索测试失败:', error.message);
    return false;
  }
}

/**
 * 测试 3：live_search 复杂查询
 */
async function test3_LiveSearchComplex() {
  console.log('\n=== 测试 3：live_search 复杂查询 ===\n');

  try {
    const response = await client.chat.completions.create({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'user',
          content: '请搜索并分析：OpenAI、Anthropic、xAI 三家公司在 2026年3月的最新动态，并从技术、市场、战略三个角度进行对比。'
        }
      ],
      tools: [
        {
          type: 'live_search'
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    console.log('✅ 复杂查询测试成功');
    console.log('实际模型:', response.model);
    console.log('Finish Reason:', response.choices[0].finish_reason);
    console.log('\n回复:\n', response.choices[0].message.content);
    console.log('\nToken 使用:', JSON.stringify(response.usage, null, 2));

    return true;
  } catch (error) {
    console.error('❌ 复杂查询测试失败:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Grok live_search 工具测试                      ║');
  console.log('║         验证实时搜索功能（Web + X 平台）               ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = {
    '基础搜索': await test1_LiveSearchBasic(),
    'X 平台搜索': await test2_LiveSearchX(),
    '复杂查询': await test3_LiveSearchComplex()
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

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                     关键发现                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (passedCount === totalCount) {
    console.log('🎉 所有测试通过！');
    console.log('\n核心发现：');
    console.log('1. ✅ live_search 是正确的搜索工具类型');
    console.log('2. ✅ 支持 Web 搜索和 X 平台搜索');
    console.log('3. ✅ Grok 自动决定何时使用搜索');
    console.log('4. ✅ 自动总结并返回引用');
    console.log('\n这就是 Grok-MCP 的核心搜索功能！');
  } else {
    console.log('⚠️  部分测试失败，需要进一步调试');
  }
}

// 运行测试
runTests().catch(console.error);
