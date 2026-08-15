# updatePRDv1 — 修复 multi-agent 搜索超时问题

**创建日期**: 2026-08-15
**状态**: 🟡 待实现
**关联 PRD**: PRD.md v4.0.0
**优先级**: 高（当前默认模型频繁超时不可用）

---

## 1. 背景与问题

### 1.1 现象
默认模型 `grok-4.20-multi-agent-beta-0309` 在执行搜索时**频繁超时**，实测出现单次搜索跑到 **359 秒后直接 aborted**、最终返回失败的情况。这让核心的搜索功能实际不可用。

### 1.2 根因分析（已定位，非模型本身问题）

| # | 根因 | 位置 | 后果 |
|---|------|------|------|
| 1 | 单次请求超时仅 120 秒 | `src/config/index.ts:88` (`timeout: 120000`) | multi-agent 复杂查询常需 150-300s，被硬切断 |
| 2 | **超时(AbortError)也触发重试 ×3** | `src/utils/grok-client.ts:89-93` | 120×3 + 退避(1s+2s) ≈ 359s 黑洞；且慢请求重试仍然慢，纯浪费 |
| 3 | 超时值写死、不可通过环境变量配置 | `src/config/index.ts:88` | 无法按查询复杂度灵活调整 |

> **关键洞察**：359 秒不是「一次搜索需要 359 秒」，而是「每次 120 秒被掐断 → 重试 → 再掐断」重复 3 遍的累加。一个本可在约 180 秒完成的搜索，被 120 秒的墙提前打断，重试也无济于事。

### 1.3 社区/官方数据支撑（Grok 搜索验证）

| 项 | 数据 |
|----|------|
| multi-agent 复杂查询实际耗时 | 4-agent 常 30-120s，复杂可达数分钟；16-agent 更久 |
| 推荐请求超时 | 4-agent：300-600s；16-agent：600-900s |
| 同类 Grok-MCP 封装默认超时 | 300s（并注明 reasoning 模型常超过 2 分钟）|
| xAI SSE/代理空闲超时参考 | ~600s |

**结论**：500s 作为单次超时完全合理，落在推荐区间内。

### 1.4 客户端侧超时排查结论（不是瓶颈）

经 Grok 搜索核实 Claude Code 的 MCP 超时机制，并结合本 MCP 为 **stdio 本地服务**的部署方式：

| 机制 | 默认值 | 影响 |
|------|--------|------|
| `MCP_TOOL_TIMEOUT`（工具执行墙钟） | 未设 = 100,000,000ms ≈ 28 小时 | 等于不限制 |
| 60s 每请求超时 | 仅作用于 HTTP/SSE 连接器 | 不影响 stdio 部署 |
| idle 空闲超时（stdio） | 30 分钟 | 远大于 500s，无影响 |
| 自动后台化 | 超过 2 分钟自动转后台 | 仅转后台，非失败 |

**结论**：Claude Code 客户端**不会**主动限制我们的工具执行时间，瓶颈 100% 在服务端。因此**无需**修改任何客户端配置。

---

## 2. 需求目标

1. multi-agent 默认搜索（30-120s）稳定成功
2. 较重查询（150-300s）能跑完，不再被 120s 墙提前打断
3. 极端 case 干净地一次性失败，不再出现约 6 分钟的重试空转
4. 超时值可按需通过环境变量调整（无需改代码即可支持 16-agent / 900s 场景）

**明确不做**（out of scope）：
- 不迁移模型：保留 `grok-4.20-multi-agent-beta-0309` 作为默认（搜索质量最强且更便宜，4.3/4.5/4.6 均无原生 multi-agent 搜索）
- 不修改 Claude Code 客户端配置（已确认非瓶颈）
- 不改动架构为流式(SSE)（当前范围无需）

---

## 3. 技术方案（改动 2 个文件）

### 改动 A：提高超时 + 支持环境变量配置
**文件**：`src/config/index.ts`

1. 在 zod `envSchema` 中新增可选项：
   ```ts
   // 请求超时（毫秒），可选；缺省 500000（500 秒）
   GROK_MCP_TIMEOUT: z.string().optional(),
   ```
2. `xaiConfig.timeout` 改为读取环境变量、缺省 500000（500 秒）：
   ```ts
   // 请求超时（毫秒），可用环境变量 GROK_MCP_TIMEOUT 覆盖，默认 500 秒
   timeout: env.GROK_MCP_TIMEOUT ? Number(env.GROK_MCP_TIMEOUT) : 500000,
   ```

### 改动 B：修复重试逻辑（关键）
**文件**：`src/utils/grok-client.ts:89-93`

超时(AbortError)**不再重试**，仅对真正的瞬时网络错误重试：
```ts
// 仅对瞬时网络错误重试；超时(AbortError)不重试
// 原因：multi-agent 慢请求重试仍会慢，重试只会 N 倍浪费时间并更晚失败
if (attempt < 2 && (
  lastError.message.includes('fetch failed') ||
  lastError.message.includes('ECONNRESET')
)) {
  ...
}
```
效果：最坏情况从 `500×3 ≈ 25 分钟` 变回 **最多一次 500s**。

---

## 4. 验收标准

- [ ] 默认 multi-agent 搜索稳定返回，不再出现 120s abort
- [ ] 设置 `GROK_MCP_TIMEOUT` 环境变量能正确覆盖默认超时
- [ ] 超时失败时只发生一次（无 3 次重试的累加空转）
- [ ] 网络瞬时错误(ECONNRESET/fetch failed)仍保留重试
- [ ] `npm run build`（TypeScript 编译）通过
- [ ] 版本号在 `package.json` 与 `mcpConfig.version` 同步递增

---

## 5. 影响面

- 仅影响服务端超时与重试行为，不改变 API 调用语义与输出格式
- 向后兼容：不设 `GROK_MCP_TIMEOUT` 时使用新默认值 500s
- 需重新 build 并让用户更新到新版本
