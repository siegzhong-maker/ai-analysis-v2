# AI Analysis High-Fidelity Prototype

这是一个高保真原型，用于演示AI分析功能，包含基础集锦和高阶分析两个版本，支持足球和篮球两种运动类型。

## 功能特性

### 最近项目模块
- 2个足球项目（基础集锦 + 高阶分析）
- 2个篮球项目（基础集锦 + 高阶分析）

### 基础集锦视图 (HighlightResultScreen)
- **智能集锦标签页**：
  - 足球：显示进球、角球、定位球、点球等事件
  - 篮球：显示3分、2分、罚球等得分事件
  - 支持按队伍和事件类型筛选
  - 支持片段选择和批量操作

- **基础数据标签页**：
  - 足球：显示进球等核心数据
  - 篮球：显示总出手、命中等核心数据
  - 关键事件时间轴
  - 升级提示横幅

### 高阶分析视图 (AnalysisResultScreen)
- **数据概览标签页**：
  - 完整的数据对比表格
  - 关键事件时间轴
  - 支持按事件类型筛选

- **高阶分析标签页**：
  - 足球：跑动热力图 + 体能数据
  - 篮球：投篮热点分布 + 球员效率榜

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS (CDN)
- Lucide React (图标库)

## 项目结构

```
.
├── App.tsx              # 主应用组件
├── src/
│   └── main.tsx         # 入口文件
├── index.html           # HTML模板
├── package.json         # 依赖配置
├── tsconfig.json        # TypeScript配置
└── vite.config.ts       # Vite配置
```

## 核心数据

- `HISTORY_TASKS`: 最近项目列表（4个项目）
- `AI_CLIPS_ADVANCED`: AI识别的精彩片段
- `TEAM_MATCH_STATS`: 篮球比赛统计数据
- `SOCCER_MATCH_STATS`: 足球比赛统计数据
- `PLAYER_STATS_BASKETBALL`: 篮球球员数据
- `PLAYER_STATS_SOCCER`: 足球球员数据

## 使用说明

1. 首页显示4个最近项目（2个足球 + 2个篮球）
2. 点击基础集锦项目 → 进入基础集锦视图（智能集锦 + 基础数据）
3. 点击高阶分析项目 → 进入高阶分析视图（数据概览 + 高阶分析）
4. 在结果页面可以切换标签页查看不同内容
5. 支持从高阶分析跳转到基础集锦

## 注意事项

- 这是一个原型演示，数据为模拟数据
- 需要网络连接以加载Tailwind CSS CDN
- 建议使用现代浏览器（Chrome、Firefox、Safari、Edge）
