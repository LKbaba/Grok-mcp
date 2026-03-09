#!/usr/bin/env node
/**
 * Grok 4.20 模型 ID 探测脚本
 *
 * 目标：找到 OpenRouter 上 Grok 4.20 的正确模型 ID
 */

import OpenAI from 'openai';

const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/your-org/grok-mcp',
    'X-Title': 'Grok Model ID Probe'
  }
});

// 所有可能的 Grok 4.20 模型 ID
const POSSIBLE_MODEL_IDS = [
  // Grok 4.20 可能的命名
  'x-ai/grok-4.20',
  'x-ai/grok-4-20',
  'x-ai/grok-420',
  'x-ai/grok4.20',
  'x-ai/grok-4.2',
  'x-ai/grok-4.2-fast',
  'x-ai/grok-4.2-fast-non-reasoning',

  // Grok 4.1 系列
  'x-ai/grok-4.1',
  'x-ai/grok-4.1-fast',
  'x-ai/grok-4-1-fast',

  // Grok 4 系列
  'x-ai/grok-4',
  'x-ai/grok-4-fast',
  'x-ai/grok-code-fast-1',

  // Grok 3 系列
  'x-ai/grok-3',
  'x-ai/grok-3-mini',
  'x-ai/grok-3-beta',
  'x-ai/grok-3-mini-beta',

  // Grok 2 系列
  'x-ai/grok-2-1212',
  'x-ai/grok-2-vision-1212',
  'x-ai/grok-2',
  'x-ai/grok-2-mini',
  'x-ai/grok-beta',
  'x-ai/grok-vision-beta'
];

async function testModelID(modelId) {
  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'user', content: '你好' }
      ],
      max_tokens: 10
    });

    return {
      available: true,
      model: response.model,
      usage: response.usage
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

async function probeAllModels() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Grok 模型 ID 探测（OpenRouter）                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const results = [];

  for (const modelId of POSSIBLE_MODEL_IDS) {
    process.stdout.write(`测试 ${modelId.padEnd(35)} ... `);

    const result = await testModelID(modelId);

    if (result.available) {
      console.log('✅ 可用');
      results.push({
        modelId,
        ...result
      });
    } else {
      console.log(`❌ ${result.error.substring(0, 50)}`);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                  可用模型汇总                           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (results.length === 0) {
    console.log('❌ 没有找到可用的模型');
    return;
  }

  for (const result of results) {
    console.log(`\n✅ ${result.modelId}`);
    console.log(`   实际模型: ${result.model}`);
    console.log(`   Token 使用: ${JSON.stringify(result.usage, null, 2)}`);
  }

  // 查找 Grok 4.20
  const grok420 = results.find(r =>
    r.modelId.includes('4.20') ||
    r.modelId.includes('4-20') ||
    r.modelId.includes('420')
  );

  if (grok420) {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              🎉 找到 Grok 4.20！                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`模型 ID: ${grok420.modelId}`);
  } else {
    console.log('\n⚠️  未找到 Grok 4.20，可能还在 Beta 阶段');
    console.log('   推荐使用最新的可用模型：');
    if (results.length > 0) {
      console.log(`   ${results[0].modelId}`);
    }
  }
}

probeAllModels().catch(console.error);
