# 足球 MVP · 云端分析任务 API 契约（冻结版）

面向 **Falcon 直传云端（`falcon_direct_cloud`）** 的首版产品。客户端与云端以此对齐；未列字段视为 **不存在** 或 **v1.1+**。

## 1. 核心事件集合（P0，必须稳定）

| `scoreType` | 含义     | 备注                          |
| ----------- | ------ | --------------------------- |
| `goal`      | 进球（改分） | 含运动战进球；是否区分乌龙 v1.1 讨论 |
| `penalty`   | 点球     | 含射进；未进可标 `scored: false`（v1.1） |

**不在 MVP**：`corner`、`setpiece`、战术标签、传球网络、全场 xG 等 → 见 [soccer-mvp-direct-cloud.md](./soccer-mvp-direct-cloud.md) v1.1。

## 2. 任务输入

```json
{
  "sport": "soccer",
  "pipeline": "falcon_direct_cloud",
  "video_id": "string",
  "analysis_type": "highlight",
  "locale": "zh-Hans"
}
```

## 3. 任务输出（HTTP 200 JSON）

```typescript
// 逻辑类型，实际以 JSON 为准
type SoccerMvpCloudJobResult = {
  version: "soccer-mvp-1";
  final_score: { team_a: number; team_b: number };
  events: Array<{
    id: string;
    time_mmss: string;       // "12:30"
    score_type: "goal" | "penalty";
    team: "A" | "B";
    player_label?: string | null;
    scored?: boolean;        // 默认 true；点球未进时为 false（可选）
    clip_start_ms?: number;  // 可选，供跳转
    clip_end_ms?: number;
  }>;
  summary: string;          // 80–200 字为宜；仅复述比分+事件，不做战术发挥
};
```

### 3.1 `summary` 约束

- 必须包含 **终场比分**（或「0-0」）。
- 无 `events` 时：明确写「无进球/无系统确认的进球或点球」类表述。
- 禁止编造未在 `events` 中出现的事实。

## 4. SLA（建议值，可按运维调整）

| 指标        | 目标        |
| --------- | --------- |
| 首版可演示上线   | 不阻塞联调即可 |
| 云端返回 P0 事件 | ≤ 2 min（演示环境可放宽） |

## 5. 错误与重试

- `4xx/5xx`：客户端保留 **重试 / 反馈** 入口；不重试自动改写结果。
- 部分成功：若仅有比分无事件，`events: []` + `summary` 说明低置信度（可选字段 `confidence: "low"` v1.1）。

## 6. 原型实现说明

当前仓库内 [`app.tsx`](../app.tsx) 使用 **演示数据** `AI_CLIPS_ADVANCED` 与纯函数 `buildSoccerMvpCloudJobResultFromClips` 模拟上述 JSON 的 **`summary` + `events` 形态**，便于 UI 联调；接入真实 API 时替换为服务端响应即可。
