#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
只测试混合搜索，快速调试
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

print('=== 测试：web_search + x_search 混合搜索 ===\n')

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
                    'content': '请搜索并分析：OpenAI、Anthropic、xAI 三家公司在 2026年3月的最新动态。'
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

except Exception as e:
    print(f'❌ 混合搜索测试失败: {str(e)}')
    if hasattr(e, 'response') and e.response:
        try:
            error_data = e.response.json()
            print(f'\n错误详情:\n{json.dumps(error_data, indent=2, ensure_ascii=False)}')
        except:
            print(f'\n响应内容:\n{e.response.text}')
