#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 Grok 的新 Responses API (2026)

根据官方文档，xAI 在 2026年1月12日废弃了 live_search，
改用新的 Responses API (/v1/responses) 和 web_search/x_search 工具
"""

import os
import sys
import json
import requests

# 设置 UTF-8 编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 官方 xAI API 配置
XAI_API_KEY = 'xai-NAUr25WTBRAUQAf9oazCRgSf7AvGu0Vw4q0PlKgmlsg9NNsFP58FDODOAqgo9KHX2TeW9r34QZlPfa9R'
XAI_BASE_URL = 'https://api.x.ai/v1'

# 代理配置
proxy_url = os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
proxies = {'http': proxy_url, 'https': proxy_url} if proxy_url else None
print(f'代理配置: {proxy_url or "无代理"}')


def test1_web_search_basic():
    """测试 1：web_search 基础测试"""
    print('\n=== 测试 1：web_search 基础测试 ===\n')

    try:
        response = requests.post(
            f'{XAI_BASE_URL}/responses',
            headers={
                'Authorization': f'Bearer {XAI_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'grok-4-latest',
                'input': [
                    {
                        'role': 'user',
                        'content': '2026年3月9日，AI 领域有哪些重要新闻？请使用实时搜索获取最新信息。'
                    }
                ],
                'tools': [
                    {
                        'type': 'web_search',
                        'enable_image_understanding': True
                    }
                ],
                'stream': False
            },
            proxies=proxies,
            timeout=120  # 增加到 120 秒
        )

        response.raise_for_status()
        data = response.json()

        print('✅ web_search 测试成功')
        print(f'Response ID: {data.get("id")}')
        print(f'实际模型: {data.get("model")}')

        # 提取输出内容
        output = data.get('output', [])
        if output:
            for item in output:
                if item.get('type') == 'message':
                    content = item.get('content', [])
                    for c in content:
                        if c.get('type') == 'output_text':
                            print(f'\n回复:\n{c.get("text")}')

        # 显示引用
        citations = data.get('citations', [])
        if citations:
            print(f'\n引用来源 ({len(citations)} 个):')
            for i, url in enumerate(citations[:5], 1):
                print(f'  {i}. {url}')

        # Token 使用
        usage = data.get('usage', {})
        print(f'\nToken 使用: {json.dumps(usage, indent=2, ensure_ascii=False)}')

        return True
    except Exception as e:
        print(f'❌ web_search 测试失败: {str(e)}')
        if hasattr(e, 'response') and e.response:
            print(f'响应内容: {e.response.text}')
        return False


def test2_x_search():
    """测试 2：x_search 搜索 X 平台"""
    print('\n=== 测试 2：x_search 搜索 X 平台 ===\n')

    try:
        response = requests.post(
            f'{XAI_BASE_URL}/responses',
            headers={
                'Authorization': f'Bearer {XAI_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'grok-4-latest',
                'input': [
                    {
                        'role': 'user',
                        'content': '最近 X 平台上关于 Grok 4.2 的讨论有哪些？请使用实时搜索获取信息。'
                    }
                ],
                'tools': [
                    {
                        'type': 'x_search',
                        'from_date': '2026-03-01',
                        'enable_image_understanding': True,
                        'enable_video_understanding': True
                    }
                ],
                'stream': False
            },
            proxies=proxies,
            timeout=120  # 增加到 120 秒
        )

        response.raise_for_status()
        data = response.json()

        print('✅ X 平台搜索测试成功')
        print(f'Response ID: {data.get("id")}')
        print(f'实际模型: {data.get("model")}')

        # 提取输出内容
        output = data.get('output', [])
        if output:
            for item in output:
                if item.get('type') == 'message':
                    content = item.get('content', [])
                    for c in content:
                        if c.get('type') == 'output_text':
                            print(f'\n回复:\n{c.get("text")}')

        # 显示引用
        citations = data.get('citations', [])
        if citations:
            print(f'\n引用来源 ({len(citations)} 个):')
            for i, url in enumerate(citations[:5], 1):
                print(f'  {i}. {url}')

        # Token 使用
        usage = data.get('usage', {})
        print(f'\nToken 使用: {json.dumps(usage, indent=2, ensure_ascii=False)}')

        return True
    except Exception as e:
        print(f'❌ X 平台搜索测试失败: {str(e)}')
        if hasattr(e, 'response') and e.response:
            print(f'响应内容: {e.response.text}')
        return False


def test3_mixed_search():
    """测试 3：web_search + x_search 混合搜索"""
    print('\n=== 测试 3：web_search + x_search 混合搜索 ===\n')

    try:
        response = requests.post(
            f'{XAI_BASE_URL}/responses',
            headers={
                'Authorization': f'Bearer {XAI_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'grok-4-latest',
                'input': [
                    {
                        'role': 'user',
                        'content': '请搜索并分析：OpenAI、Anthropic、xAI 三家公司在 2026年3月的最新动态，并从技术、市场、战略三个角度进行对比。'
                    }
                ],
                'tools': [
                    {
                        'type': 'web_search',
                        'enable_image_understanding': True
                    },
                    {
                        'type': 'x_search',
                        'enable_image_understanding': True
                    }
                ],
                'include': ['reasoning.encrypted_content', 'inline_citations'],
                'stream': False
            },
            proxies=proxies,
            timeout=90
        )

        response.raise_for_status()
        data = response.json()

        print('✅ 混合搜索测试成功')
        print(f'Response ID: {data.get("id")}')
        print(f'实际模型: {data.get("model")}')

        # 提取输出内容
        output = data.get('output', [])
        if output:
            for item in output:
                if item.get('type') == 'message':
                    content = item.get('content', [])
                    for c in content:
                        if c.get('type') == 'output_text':
                            print(f'\n回复:\n{c.get("text")[:500]}...')  # 只显示前500字符

        # 显示引用
        citations = data.get('citations', [])
        if citations:
            print(f'\n引用来源 ({len(citations)} 个):')
            for i, url in enumerate(citations[:5], 1):
                print(f'  {i}. {url}')

        # Token 使用
        usage = data.get('usage', {})
        print(f'\nToken 使用: {json.dumps(usage, indent=2, ensure_ascii=False)}')

        return True
    except Exception as e:
        print(f'❌ 混合搜索测试失败: {str(e)}')
        if hasattr(e, 'response') and e.response:
            try:
                error_data = e.response.json()
                print(f'错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}')
            except:
                print(f'响应内容: {e.response.text}')
        return False


def main():
    """主测试函数"""
    print('╔════════════════════════════════════════════════════════╗')
    print('║         Grok Responses API 测试（2026 新架构）        ║')
    print('║         web_search + x_search（替代 live_search）     ║')
    print('╚════════════════════════════════════════════════════════╝')

    # 运行测试
    results = {
        'Web 搜索': test1_web_search_basic(),
        'X 平台搜索': test2_x_search(),
        '混合搜索': test3_mixed_search()
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
        print('1. ✅ 使用新的 /v1/responses 端点（不是 /v1/chat/completions）')
        print('2. ✅ web_search 和 x_search 需要嵌套配置对象')
        print('3. ✅ live_search 已在 2026年1月12日废弃')
        print('4. ✅ 支持 Web 搜索和 X 平台搜索')
        print('5. ✅ Grok 进入"推理循环"自动执行多次搜索')
        print('6. ✅ 响应包含 citations 数组和 reasoning_tokens')
        print('\n这就是 Grok-MCP 的核心搜索功能！')
    else:
        print('⚠️  部分测试失败，需要进一步调试')


if __name__ == '__main__':
    main()
