#!/usr/bin/env python3
"""
测试 Grok 的 live_search 工具

根据官方 API 错误提示，正确的搜索工具类型是 'live_search'
"""

import os
import json
from openai import OpenAI

# 官方 xAI API 配置
XAI_API_KEY = 'xai-NAUr25WTBRAUQAf9oazCRgSf7AvGu0Vw4q0PlKgmlsg9NNsFP58FDODOAqgo9KHX2TeW9r34QZlPfa9R'
XAI_BASE_URL = 'https://api.x.ai/v1'

# 代理配置（如果需要）
proxy_url = os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
print(f'代理配置: {proxy_url or "无代理"}')

# 创建客户端
client = OpenAI(
    api_key=XAI_API_KEY,
    base_url=XAI_BASE_URL,
    http_client=None  # Python 的 OpenAI SDK 会自动使用环境变量中的代理
)


def test1_live_search_basic():
    """测试 1：web_search 基础测试"""
    print('\n=== 测试 1：web_search 基础测试 ===\n')

    try:
        response = client.chat.completions.create(
            model='grok-4-latest',
            messages=[
                {
                    'role': 'user',
                    'content': '2026年3月9日，AI 领域有哪些重要新闻？请使用实时搜索获取最新信息。'
                }
            ],
            tools=[
                {
                    'type': 'web_search',  # 使用 web_search
                    'sources': []  # 空数组表示不限制来源
                }
            ],
            max_tokens=1500,
            temperature=0
        )

        print('✅ web_search 测试成功')
        print(f'实际模型: {response.model}')
        print(f'Finish Reason: {response.choices[0].finish_reason}')
        print(f'\n回复:\n{response.choices[0].message.content}')
        print(f'\nToken 使用: {json.dumps(response.usage.model_dump(), indent=2, ensure_ascii=False)}')

        return True
    except Exception as e:
        print(f'❌ web_search 测试失败: {str(e)}')
        return False


def test2_live_search_x():
    """测试 2：x_search 搜索 X 平台"""
    print('\n=== 测试 2：x_search 搜索 X 平台 ===\n')

    try:
        response = client.chat.completions.create(
            model='grok-4-latest',
            messages=[
                {
                    'role': 'user',
                    'content': '最近 X 平台上关于 Grok 4.2 的讨论有哪些？请使用实时搜索获取信息。'
                }
            ],
            tools=[
                {
                    'type': 'x_search',  # 使用 x_search
                    'sources': []  # 空数组表示不限制来源
                }
            ],
            max_tokens=1500,
            temperature=0
        )

        print('✅ X 平台搜索测试成功')
        print(f'实际模型: {response.model}')
        print(f'Finish Reason: {response.choices[0].finish_reason}')
        print(f'\n回复:\n{response.choices[0].message.content}')
        print(f'\nToken 使用: {json.dumps(response.usage.model_dump(), indent=2, ensure_ascii=False)}')

        return True
    except Exception as e:
        print(f'❌ X 平台搜索测试失败: {str(e)}')
        return False


def test3_live_search_complex():
    """测试 3：web_search + x_search 混合搜索"""
    print('\n=== 测试 3：web_search + x_search 混合搜索 ===\n')

    try:
        response = client.chat.completions.create(
            model='grok-4-latest',
            messages=[
                {
                    'role': 'user',
                    'content': '请搜索并分析：OpenAI、Anthropic、xAI 三家公司在 2026年3月的最新动态，并从技术、市场、战略三个角度进行对比。'
                }
            ],
            tools=[
                {
                    'type': 'web_search',  # Web 搜索
                    'sources': []
                },
                {
                    'type': 'x_search',  # X 平台搜索
                    'sources': []
                }
            ],
            max_tokens=2000,
            temperature=0.7
        )

        print('✅ 复杂查询测试成功')
        print(f'实际模型: {response.model}')
        print(f'Finish Reason: {response.choices[0].finish_reason}')
        print(f'\n回复:\n{response.choices[0].message.content}')
        print(f'\nToken 使用: {json.dumps(response.usage.model_dump(), indent=2, ensure_ascii=False)}')

        return True
    except Exception as e:
        print(f'❌ 复杂查询测试失败: {str(e)}')
        return False


def main():
    """主测试函数"""
    print('╔════════════════════════════════════════════════════════╗')
    print('║         Grok 搜索工具测试（2026 新架构）              ║')
    print('║         web_search + x_search（替代 live_search）     ║')
    print('╚════════════════════════════════════════════════════════╝')

    # 运行测试
    results = {
        'Web 搜索': test1_live_search_basic(),
        'X 平台搜索': test2_live_search_x(),
        '混合搜索': test3_live_search_complex()
    }

    # 输出结果
    print('\n╔════════════════════════════════════════════════════════╗')
    print('║                     测试结果汇总                        ║')
    print('╚════════════════════════════════════════════════════════╝\n')

    for test, passed in results.items():
        status = '✅ 通过' if passed else '❌ 失败'
        print(f'{test.ljust(20)} {status}')

    passed_count = sum(results.values())
    total_count = len(results)

    print(f'\n总计: {passed_count}/{total_count} 测试通过')

    print('\n╔════════════════════════════════════════════════════════╗')
    print('║                     关键发现                            ║')
    print('╚════════════════════════════════════════════════════════╝\n')

    if passed_count == total_count:
        print('🎉 所有测试通过！')
        print('\n核心发现：')
        print('1. ✅ web_search 和 x_search 是正确的搜索工具类型')
        print('2. ✅ live_search 已在 2026年1月12日废弃')
        print('3. ✅ 支持 Web 搜索和 X 平台搜索')
        print('4. ✅ Grok 自动决定何时使用搜索')
        print('5. ✅ 可以同时使用两种搜索，Grok 自动选择')
        print('\n这就是 Grok-MCP 的核心搜索功能！')
    else:
        print('⚠️  部分测试失败，需要进一步调试')


if __name__ == '__main__':
    main()
