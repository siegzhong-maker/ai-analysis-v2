import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import i18n from './src/i18n';

import { 

  Sparkles, BarChart3, LayoutTemplate, 

  ChevronRight, Clock, PlayCircle, X, 

  Home, Image as ImageIcon, Camera, ArrowLeft,

  Filter, Cloud, CheckCircle2,

  Check, Edit3, Share2,

  Target, Crown, FileText, 

  Layers, CreditCard,

  Film, ScanLine, Download, 

  Smartphone as PhoneIcon,

  RotateCcw, UploadCloud, DownloadCloud, Minimize2,

  FileEdit, Hexagon, Disc, CircleDot,

  AlertTriangle, WifiOff, Wifi, Signal, HardDrive, RefreshCw, Play, Zap, Minus, Plus,

  Activity, Map as MapIcon, Lock, Footprints, AreaChart, Flame,

  Cpu,

  MessageSquare, Save, User, Users, ChevronDown, Heart, Trash2,

  ArrowDownUp,

} from 'lucide-react';

// --- Types ---

type ViewState =
  | 'home'
  | 'gallery'
  | 'media_picker'
  | 'ai_result_highlight'
  | 'ai_result_analysis'
  | 'task_submitted'
  | 'task_center'
  | 'transfer_list'
  | 'merge_preview';

type AIMode = 'cloud';

/** 预研：分析管线 — 端侧 / Falcon→App→云 / Falcon 直传云 / 端侧核心→云端全量（高阶） */
type AnalysisPipeline =
  | 'on_device'
  | 'falcon_app_cloud'
  | 'falcon_direct_cloud'
  | 'edge_cloud_hybrid';

type SelectionMode = 'single' | 'multiple';

type SportType = 'basketball' | 'soccer' | 'baseball' | 'ice_hockey' | 'all';

type AnalysisType = 'highlight' | 'analysis'; 

type VideoSource = 'all' | 'falcon' | 'cloud' | 'local';

type SortOrder = 'newest' | 'oldest' | 'duration';

type EventFilterType = 'all' | 'score' | 'highlight' | 3 | 2 | 1 | 'goal' | 'corner' | 'setpiece' | 'penalty' | 'rebound' | 'steal' | 'assist'; 

type TransferStep = 'idle' | 'downloading' | 'uploading' | 'analyzing' | 'completed' | 'failed' | 'paused';

type CloudTaskStatus = 'uploading' | 'queued' | 'analyzing' | 'completed' | 'failed' | 'paused';

interface CloudTask {
  id: string;
  videoId: number;
  videoName: string;
  type: 'highlight' | 'analysis';
  status: CloudTaskStatus;
  progress: number;
  queuePosition?: number; // 排队位置
  createdAt: number;
}

type MediaPickerSessionState = {
  sourceTab: VideoSource;
  typeTab: 'all' | 'video' | 'image' | 'collect';
  detailVideoId: number | null;
};

let mediaPickerSessionState: MediaPickerSessionState = {
  sourceTab: 'falcon',
  typeTab: 'all',
  detailVideoId: null,
};

/** Unified row in「我的文档」— merges history, drafts, and cloud queue */
type AssetItemKind = 'completed_match' | 'draft' | 'cloud_job' | 'failed' | 'paused';

/** 「我的项目」筛选：云端处理 = 未完成 cloud_job；本地草稿 = draft；与传输列表（Download/Upload）分工不同 */
type AssetDocFilter = 'all' | 'cloud' | 'drafts';

interface AssetItem {
  id: string;
  kind: AssetItemKind;
  titleKey?: string;
  titleFallback?: string;
  dateKey?: string;
  dateFallback?: string;
  cover: 'basketball' | 'soccer';
  analysisType?: 'highlight' | 'analysis';
  progress?: string;
  failureReasonKey?: string;
  cloudTaskId?: string;
  cloudStatus?: CloudTaskStatus;
  sortTs: number;
}

type NetworkState = 'wifi' | '4g' | 'offline';

type FalconState = 'connected' | 'disconnected';

type ShareContext =
  | { type: 'all' | 'selected' | 'report' }
  | { type: 'player_clips'; playerLabel?: string }
  | { type: 'player_dashboard'; playerLabel?: string }
  | { type: 'template_compose'; templateId: string; selectedClipIds: number[]; templateLabelKey: string }
  | {
      type: 'pro_training_video';
      variant: 'issue_drill' | 'catalog_plan';
      tier: 'curated_sample' | 'paid_catalog';
      titleKey: string;
      durationKey: string;
      focusKey?: string;
      descKey?: string;
      sport: 'basketball' | 'soccer';
    };

/** Per-clip coaching + template hints (shared Basic / Pro) */
type ClipCoachExtension = {
  coachingTipKey: string;
  issueTagKeys: string[];
  linkedTrainingIds: string[];
  suggestedTemplateTags: string[];
  priority: number;
};

const CLIP_COACH_EXTENSIONS: Record<number, ClipCoachExtension> = {
  1: { coachingTipKey: 'coach.tip3pt', issueTagKeys: ['coach.issueShotSelection'], linkedTrainingIds: ['drill_bb_catch_shoot'], suggestedTemplateTags: ['spotlight', 'full_game'], priority: 92 },
  2: { coachingTipKey: 'coach.tipMid', issueTagKeys: ['coach.issueSpacing'], linkedTrainingIds: ['drill_bb_midrange'], suggestedTemplateTags: ['full_game'], priority: 70 },
  3: { coachingTipKey: 'coach.tipFt', issueTagKeys: ['coach.issueRoutine'], linkedTrainingIds: ['drill_bb_ft'], suggestedTemplateTags: ['recap'], priority: 88 },
  8: { coachingTipKey: 'coach.tip3ptB', issueTagKeys: ['coach.issueShotSelection'], linkedTrainingIds: ['drill_bb_catch_shoot'], suggestedTemplateTags: ['spotlight', 'full_game'], priority: 90 },
  20: { coachingTipKey: 'coach.tipSoccerGoal', issueTagKeys: ['coach.issueFinishing'], linkedTrainingIds: ['drill_sc_finish'], suggestedTemplateTags: ['full_game', 'spotlight'], priority: 95 },
  21: { coachingTipKey: 'coach.tipCorner', issueTagKeys: ['coach.issueSetPiece'], linkedTrainingIds: ['drill_sc_corner'], suggestedTemplateTags: ['recap'], priority: 65 },
  25: { coachingTipKey: 'coach.tipSoccerGoal2', issueTagKeys: ['coach.issueTransition'], linkedTrainingIds: ['drill_sc_counter'], suggestedTemplateTags: ['full_game'], priority: 93 },
};

/** 基础版「本周训练建议」：与片段识别 issue 一一对应的简短文字提示（Pro 才展示付费跟练视频） */
const BASIC_TRAIN_HINT_KEYS: Record<string, string> = {
  'coach.issueShotSelection': 'basicTrain.hintShotSelection',
  'coach.issueSpacing': 'basicTrain.hintSpacing',
  'coach.issueRoutine': 'basicTrain.hintRoutine',
  'coach.issueFinishing': 'basicTrain.hintFinishing',
  'coach.issueSetPiece': 'basicTrain.hintSetPiece',
  'coach.issueTransition': 'basicTrain.hintTransition',
};

/** 与 CLIP_COACH_EXTENSIONS.linkedTrainingIds 对应；Pro 复盘区展示为跟练视频卡 */
const TRAINING_DRILLS: Record<string, { sport: 'basketball' | 'soccer'; titleKey: string; durationKey: string; descKey: string }> = {
  drill_bb_catch_shoot: { sport: 'basketball', titleKey: 'training.bbCatchShootTitle', durationKey: 'training.bbCatchShootDur', descKey: 'training.bbCatchShootDesc' },
  drill_bb_midrange: { sport: 'basketball', titleKey: 'training.bbMidTitle', durationKey: 'training.bbMidDur', descKey: 'training.bbMidDesc' },
  drill_bb_ft: { sport: 'basketball', titleKey: 'training.bbFtTitle', durationKey: 'training.bbFtDur', descKey: 'training.bbFtDesc' },
  drill_sc_finish: { sport: 'soccer', titleKey: 'training.scFinishTitle', durationKey: 'training.scFinishDur', descKey: 'training.scFinishDesc' },
  drill_sc_corner: { sport: 'soccer', titleKey: 'training.scCornerTitle', durationKey: 'training.scCornerDur', descKey: 'training.scCornerDesc' },
  drill_sc_counter: { sport: 'soccer', titleKey: 'training.scCounterTitle', durationKey: 'training.scCounterDur', descKey: 'training.scCounterDesc' },
};

/** Pro 复盘：精选试看 + 付费跟练课包（按运动筛选） */
const COACH_TRAINING_PLAN_VIDEOS: {
  id: string;
  sport: 'basketball' | 'soccer';
  titleKey: string;
  focusKey: string;
  durationKey: string;
  tier: 'curated_sample' | 'paid_catalog';
  gradient: string;
}[] = [
  { id: 'tp_bb_1', sport: 'basketball', titleKey: 'trainingPlans.bbPlan1Title', focusKey: 'trainingPlans.bbPlan1Focus', durationKey: 'trainingPlans.dur18', tier: 'curated_sample', gradient: 'from-orange-600 via-amber-700 to-slate-900' },
  { id: 'tp_bb_2', sport: 'basketball', titleKey: 'trainingPlans.bbPlan2Title', focusKey: 'trainingPlans.bbPlan2Focus', durationKey: 'trainingPlans.dur22', tier: 'curated_sample', gradient: 'from-amber-600 via-orange-800 to-black' },
  { id: 'tp_bb_3', sport: 'basketball', titleKey: 'trainingPlans.bbPlan3Title', focusKey: 'trainingPlans.bbPlan3Focus', durationKey: 'trainingPlans.dur15', tier: 'paid_catalog', gradient: 'from-slate-700 via-indigo-900 to-black' },
  { id: 'tp_bb_4', sport: 'basketball', titleKey: 'trainingPlans.bbPlan4Title', focusKey: 'trainingPlans.bbPlan4Focus', durationKey: 'trainingPlans.dur25', tier: 'paid_catalog', gradient: 'from-violet-800 via-purple-900 to-black' },
  { id: 'tp_sc_1', sport: 'soccer', titleKey: 'trainingPlans.scPlan1Title', focusKey: 'trainingPlans.scPlan1Focus', durationKey: 'trainingPlans.dur20', tier: 'curated_sample', gradient: 'from-emerald-600 via-teal-800 to-slate-900' },
  { id: 'tp_sc_2', sport: 'soccer', titleKey: 'trainingPlans.scPlan2Title', focusKey: 'trainingPlans.scPlan2Focus', durationKey: 'trainingPlans.dur16', tier: 'curated_sample', gradient: 'from-green-600 via-emerald-900 to-black' },
  { id: 'tp_sc_3', sport: 'soccer', titleKey: 'trainingPlans.scPlan3Title', focusKey: 'trainingPlans.scPlan3Focus', durationKey: 'trainingPlans.dur24', tier: 'paid_catalog', gradient: 'from-slate-700 via-emerald-950 to-black' },
  { id: 'tp_sc_4', sport: 'soccer', titleKey: 'trainingPlans.scPlan4Title', focusKey: 'trainingPlans.scPlan4Focus', durationKey: 'trainingPlans.dur30', tier: 'paid_catalog', gradient: 'from-cyan-900 via-emerald-950 to-black' },
];

type ComposeTemplateDef = {
  id: string;
  labelKey: string;
  proOnly: boolean;
  tag: string;
  descKey: string;
  quality: 'standard' | 'pro_hd' | 'pro_cinema';
};

/** Pro 含更多模板与更高成片档位（standard / 高清叙事 / 影院级节拍） */
const COMPOSE_TEMPLATES: ComposeTemplateDef[] = [
  { id: 'full_game', labelKey: 'compose.templateFullGame', proOnly: false, tag: 'full_game', descKey: 'compose.descFullGame', quality: 'standard' },
  { id: 'spotlight', labelKey: 'compose.templateSpotlight', proOnly: false, tag: 'spotlight', descKey: 'compose.descSpotlight', quality: 'standard' },
  { id: 'recap', labelKey: 'compose.templateRecap', proOnly: true, tag: 'recap', descKey: 'compose.descRecap', quality: 'pro_hd' },
  { id: 'brand', labelKey: 'compose.templateBrand', proOnly: true, tag: 'brand', descKey: 'compose.descBrand', quality: 'pro_hd' },
  { id: 'beats_pro', labelKey: 'compose.templateBeatsPro', proOnly: true, tag: 'full_game', descKey: 'compose.descBeatsPro', quality: 'pro_cinema' },
  { id: 'cinematic_spotlight', labelKey: 'compose.templateCinematic', proOnly: true, tag: 'spotlight', descKey: 'compose.descCinematic', quality: 'pro_cinema' },
  { id: 'signature_pack', labelKey: 'compose.templateSignaturePack', proOnly: true, tag: 'brand', descKey: 'compose.descSignaturePack', quality: 'pro_cinema' },
];

function buildAssetItems(cloudTasks: CloudTask[]): AssetItem[] {
  const items: AssetItem[] = [];
  let histTs = Date.now() - 86400000 * 30;
  HISTORY_TASKS.forEach((task) => {
    histTs += 86400000;
    const kind: AssetItemKind =
      task.status === 'failed' ? 'failed' : task.status === 'paused' ? 'paused' : 'completed_match';
    items.push({
      id: `hist-${task.id}`,
      kind,
      titleKey: (task as any).titleKey,
      dateKey: (task as any).dateKey,
      cover: task.cover as 'basketball' | 'soccer',
      analysisType: task.type as 'highlight' | 'analysis',
      failureReasonKey: (task as any).failureReasonKey,
      sortTs: histTs,
    });
  });
  DRAFT_TASKS.forEach((d, i) => {
    items.push({
      id: `draft-${d.id}`,
      kind: 'draft',
      titleKey: (d as any).titleKey,
      dateKey: (d as any).dateKey,
      cover: d.cover as 'basketball' | 'soccer',
      progress: d.progress,
      sortTs: Date.now() - 3600000 * (i + 3),
    });
  });
  cloudTasks.forEach((ct) => {
    items.push({
      id: `cloud-${ct.id}`,
      kind: 'cloud_job',
      titleFallback: ct.videoName,
      dateFallback: new Date(ct.createdAt).toLocaleString(),
      cover: 'soccer',
      analysisType: ct.type,
      cloudTaskId: ct.id,
      cloudStatus: ct.status,
      sortTs: ct.createdAt,
    });
  });
  return items.sort((a, b) => b.sortTs - a.sortTs);
}

function filterAssetItems(items: AssetItem[], f: AssetDocFilter): AssetItem[] {
  if (f === 'all') return items;
  return items.filter((it) => {
    if (f === 'cloud') {
      return it.kind === 'cloud_job' && it.cloudStatus && !['completed', 'failed'].includes(it.cloudStatus);
    }
    if (f === 'drafts') return it.kind === 'draft';
    return true;
  });
}

function pickClipIdsForTemplate(sport: 'basketball' | 'soccer', templateTag: string): number[] {
  const pool = AI_CLIPS_ADVANCED.filter((c) => c.sport === sport);
  const scored = pool
    .map((c) => ({
      id: c.id,
      p: CLIP_COACH_EXTENSIONS[c.id]?.priority ?? 40,
      match: CLIP_COACH_EXTENSIONS[c.id]?.suggestedTemplateTags?.includes(templateTag) ? 1 : 0,
    }))
    .sort((a, b) => b.match - a.match || b.p - a.p);
  return scored.slice(0, 6).map((s) => s.id);
}

function parseMatchClockToSeconds(clock: string): number {
  const [m, s] = String(clock || '0:0').split(':').map((v) => Number(v) || 0);
  return m * 60 + s;
}

type TimelineFilterId = 'goals' | 'assists' | 'possession' | 'saves';

function buildSoccerTimelinePoints(
  events: Array<{ id: number; time: string; scoreType: string | number; team: 'A' | 'B' }>,
  filter: TimelineFilterId
) {
  const sorted = [...events].sort(
    (a, b) => parseMatchClockToSeconds(String(a.time)) - parseMatchClockToSeconds(String(b.time))
  );
  if (filter === 'goals') {
    return sorted.filter((e) => ['goal', 'penalty', 'setpiece'].includes(String(e.scoreType)));
  }
  if (filter === 'assists') {
    return sorted.filter((e) => ['corner', 'setpiece'].includes(String(e.scoreType)));
  }
  if (filter === 'possession') {
    return sorted.filter((_, idx) => idx % 2 === 0);
  }
  return sorted.filter((_, idx) => idx % 3 === 0);
}

/** 第四条路线演示：端侧仅保留稀疏核心事件（进球/点球或篮球得分） */
function filterClipsForHybridEdgeTier<T extends { sport: string; type?: string; scoreType?: string | number }>(
  clips: readonly T[]
): T[] {
  return clips.filter((c) => {
    if (c.sport === 'soccer') {
      const st = String(c.scoreType);
      return st === 'goal' || st === 'penalty';
    }
    return c.type === 'score' && [3, 2].includes(Number(c.scoreType));
  });
}

// --- Context ---

const AppContext = createContext<any>(null);

const useAppContext = () => useContext(AppContext);

// --- Mock Data ---

const HIGHLIGHT_COLLECTIONS = [

  { id: 'full', labelKey: 'highlights.full', duration: '03:45', count: 24, theme: 'orange' },

  { id: 'team_a', labelKey: 'highlights.teamA', duration: '01:50', count: 12, theme: 'blue' },

  { id: 'team_b', labelKey: 'highlights.teamB', duration: '01:55', count: 12, theme: 'red' },

];

const AI_CLIPS_ADVANCED = [

  { id: 1, labelKey: 'clips.3pt', time: "02:14", duration: "5s", type: "score", scoreType: 3, team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },
  { id: 2, labelKey: 'clips.2pt', time: "05:32", duration: "8s", type: "score", scoreType: 2, team: 'A', sport: 'basketball', confidence: 'low', player: null },
  { id: 3, labelKey: 'clips.1ptFt', time: "11:20", duration: "4s", type: "score", scoreType: 1, team: 'B', sport: 'basketball', confidence: 'high', player: '#11 KL' },
  { id: 4, labelKey: 'clips.3pt', time: "14:05", duration: "6s", type: "score", scoreType: 3, team: 'B', sport: 'basketball', confidence: 'low', player: null },
  { id: 6, labelKey: 'clips.2pt', time: "22:15", duration: "7s", type: "score", scoreType: 2, team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },
  { id: 7, labelKey: 'clips.1ptFt', time: "24:30", duration: "5s", type: "score", scoreType: 1, team: 'A', sport: 'basketball', confidence: 'low', player: null },
  { id: 8, labelKey: 'clips.3pt', time: "28:10", duration: "6s", type: "score", scoreType: 3, team: 'A', sport: 'basketball', confidence: 'high', player: '#0 Tatum' },
  { id: 9, labelKey: 'clips.rebound', time: "06:45", duration: "3s", type: "basketball_event", scoreType: 'rebound', team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },
  { id: 10, labelKey: 'clips.steal', time: "09:20", duration: "4s", type: "basketball_event", scoreType: 'steal', team: 'A', sport: 'basketball', confidence: 'high', player: '#0 Tatum' },
  { id: 11, labelKey: 'clips.assist', time: "15:30", duration: "5s", type: "basketball_event", scoreType: 'assist', team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },
  { id: 12, labelKey: 'clips.rebound', time: "18:15", duration: "3s", type: "basketball_event", scoreType: 'rebound', team: 'B', sport: 'basketball', confidence: 'low', player: null },
  { id: 13, labelKey: 'clips.steal', time: "26:40", duration: "4s", type: "basketball_event", scoreType: 'steal', team: 'B', sport: 'basketball', confidence: 'high', player: '#11 KL' },
  { id: 14, labelKey: 'clips.assist', time: "32:50", duration: "5s", type: "basketball_event", scoreType: 'assist', team: 'B', sport: 'basketball', confidence: 'low', player: null },
  { id: 20, labelKey: 'clips.goalHighlight', time: "12:30", duration: "10s", type: "soccer_event", scoreType: 'goal', team: 'A', sport: 'soccer', confidence: 'high', player: '#7 Son' },
  { id: 21, labelKey: 'clips.corner', time: "25:15", duration: "15s", type: "soccer_event", scoreType: 'corner', team: 'A', sport: 'soccer', confidence: 'low', player: null },
  { id: 22, labelKey: 'clips.setpiece', time: "38:00", duration: "12s", type: "soccer_event", scoreType: 'setpiece', team: 'B', sport: 'soccer', confidence: 'high', player: '#10 Messi' },
  { id: 23, labelKey: 'clips.penalty', time: "55:20", duration: "20s", type: "soccer_event", scoreType: 'penalty', team: 'A', sport: 'soccer', confidence: 'low', player: null },
  { id: 25, labelKey: 'clips.goal', time: "88:45", duration: "15s", type: "soccer_event", scoreType: 'goal', team: 'B', sport: 'soccer', confidence: 'high', player: '#9 Lewy' },

];

const HISTORY_TASKS = [

  { id: 's1', titleKey: 'tasks.titleSundayLeague', dateKey: 'tasks.date4hAgo', type: 'highlight', status: 'completed', cover: 'soccer' },
  { id: 's2', titleKey: 'tasks.titleSemifinal', dateKey: 'tasks.dateYesterday', type: 'analysis', status: 'completed', cover: 'soccer' },
  { id: 'f1', titleKey: 'tasks.titleWedTraining', dateKey: 'tasks.date3dAgo', type: 'highlight', status: 'failed', cover: 'soccer', failureReasonKey: 'tasks.failureNetwork' },

];

const DRAFT_TASKS = [

  { id: 'd2', titleKey: 'tasks.titleFridayEdit', dateKey: 'tasks.dateYesterday23', progress: '80%', cover: 'soccer' },

];

const TEMPLATE_DATA = [

  { id: 't1', titleKey: 'templates.nbaReport', type: 'vertical', usage: '1.2k', tagKey: 'templates.hot' },
  { id: 't2', titleKey: 'templates.highlightReel', type: 'horizontal', usage: '856', tagKey: 'templates.recommended' },
  { id: 't3', titleKey: 'templates.slowMoAnalysis', type: 'vertical', usage: '430', tagKey: 'templates.tutorial' },

];

/** 工具箱「优质模板」Tab 展示（演示数据） */
const TOOLBOX_QUALITY_TEMPLATES: {
  id: string;
  titleKey: string;
  descKey: string;
  tagKey: string;
  usage: string;
  cover: 'basketball' | 'soccer';
  paid: boolean;
  badge: 'ai' | 'classic';
}[] = [
  { id: 'qt1', titleKey: 'templates.nbaReport', descKey: 'toolbox.qtDesc1', tagKey: 'templates.hot', usage: '1.2k', cover: 'basketball', paid: true, badge: 'ai' },
  { id: 'qt2', titleKey: 'templates.highlightReel', descKey: 'toolbox.qtDesc2', tagKey: 'templates.recommended', usage: '856', cover: 'soccer', paid: false, badge: 'ai' },
  { id: 'qt3', titleKey: 'templates.slowMoAnalysis', descKey: 'toolbox.qtDesc3', tagKey: 'templates.tutorial', usage: '430', cover: 'basketball', paid: true, badge: 'classic' },
  { id: 'qt4', titleKey: 'compose.templateFullGame', descKey: 'toolbox.qtDesc4', tagKey: 'templates.hot', usage: '620', cover: 'soccer', paid: false, badge: 'ai' },
  { id: 'qt5', titleKey: 'compose.templateSpotlight', descKey: 'toolbox.qtDesc5', tagKey: 'templates.recommended', usage: '540', cover: 'basketball', paid: true, badge: 'classic' },
  { id: 'qt6', titleKey: 'compose.templateRecap', descKey: 'toolbox.qtDesc6', tagKey: 'templates.tutorial', usage: '210', cover: 'soccer', paid: true, badge: 'ai' },
];

const ALL_VIDEOS = [

  { id: 202, type: 'video', source: 'cloud', dateKey: 'videos.monday', dateSuffix: '16:30', duration: '45:00', labelKey: 'videos.firstHalf', category: 'soccer' },
  { id: 204, type: 'video', source: 'local', dateKey: 'videos.monday', dateSuffix: '18:05', duration: '22:15', labelKey: 'videos.secondHalf', category: 'soccer' },
  { id: 205, type: 'video', source: 'local', dateKey: 'videos.monday', dateSuffix: '19:15', duration: '12:40', labelKey: 'videos.extraHighlights', category: 'soccer' },
  { id: 103, type: 'video', source: 'falcon', dateKey: 'videos.sunday', dateSuffix: '15:20', duration: '15:20', labelKey: 'videos.halfCourt', device: 'Falcon Mini', battery: 100, synced: false, category: 'soccer' },
  { id: 303, type: 'video', source: 'local', dateKey: 'videos.lastFriday', dateSuffix: '', duration: '20:00', labelKey: 'videos.battingPractice', category: 'baseball' },

  /** 第四条路线相册演示：详情页内触发 AI（走当前分析管线，需选「端侧优先·云端全量」） */
  {
    id: 501,
    type: 'video',
    source: 'local',
    dateKey: 'videos.monday',
    dateSuffix: '10:30',
    duration: '18:00',
    labelKey: 'videos.hybridDemoDetail',
    category: 'soccer',
  },

] as const;

const HYBRID_GALLERY_DETAIL_VIDEO_ID = 501;

const GALLERY_ANALYSIS_SUCCESS_CARDS = [
  {
    id: 'success-sun-1',
    dateKey: 'videos.sunday',
    videoId: 103,
    source: 'falcon' as const,
    teamANameKey: 'report.teamThunder',
    teamBNameKey: 'report.teamFlame',
    teamAScore: 2,
    teamBScore: 1,
    statusKey: 'gallery.fulltime',
    isAnalyzed: true,
    analysisType: 'analysis' as const,
  },
];

const MATCH_TIME_WINDOW_MINUTES = 4 * 60;

const parseHourMinute = (value?: string): number | null => {
  if (!value || !value.includes(':')) return null;
  const [h, m] = value.split(':').map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const inferSameMatchVideoIds = (baseVideoId: number): number[] => {
  const baseVideo = ALL_VIDEOS.find((video) => video.id === baseVideoId);
  if (!baseVideo || baseVideo.type !== 'video') return [];
  const baseMin = parseHourMinute(baseVideo.dateSuffix);
  return ALL_VIDEOS
    .filter((video) => {
      if (video.type !== 'video') return false;
      if (video.category !== baseVideo.category) return false;
      if (video.dateKey !== baseVideo.dateKey) return false;
      if (video.id === baseVideo.id) return true;
      const candidateMin = parseHourMinute(video.dateSuffix);
      if (baseMin == null || candidateMin == null) return true;
      return Math.abs(candidateMin - baseMin) <= MATCH_TIME_WINDOW_MINUTES;
    })
    .map((video) => video.id);
};

const TEAM_MATCH_STATS = {

  sport: 'basketball',

  teamA: { nameKey: 'report.teamRaptors', score: 86, color: 'text-blue-400' },

  teamB: { nameKey: 'report.teamWolves', score: 82, color: 'text-red-400' },

  comparison: [
    { rowKey: 'totalPoints', a: 86, b: 82, highlight: true },
    { rowKey: 'ftPoints', a: 15, b: 12 },
    { rowKey: 'threePtPoints', a: 21, b: 18 },
    { rowKey: 'ftPct', a: { pct: 0.83, made: 15, att: 18 }, b: { pct: 0.75, made: 12, att: 16 } },
    { rowKey: 'fgPct', a: { pct: 0.456, made: 31, att: 68 }, b: { pct: 0.417, made: 30, att: 72 }, highlight: true },
    { rowKey: 'threePtPct', a: { pct: 0.318, made: 7, att: 22 }, b: { pct: 0.24, made: 6, att: 25 } },
    { rowKey: 'rebounds', a: 42, b: 38 },
    { rowKey: 'oreb', a: 12, b: 10 },
    { rowKey: 'dreb', a: 30, b: 28 },
    { rowKey: 'assists', a: 22, b: 18 },
    { rowKey: 'steals', a: 8, b: 6 },
    { rowKey: 'blocks', a: 4, b: 3 },
    { rowKey: 'turnovers', a: 11, b: 13 },
    { rowKey: 'fouls', a: 19, b: 21 },
  ]

};

const SOCCER_MATCH_STATS = {

  sport: 'soccer',

  teamA: { nameKey: 'report.teamThunder', score: 2, color: 'text-blue-500' },

  teamB: { nameKey: 'report.teamFlame', score: 1, color: 'text-red-500' },

  comparison: [
    { rowKey: 'goals', a: 2, b: 1, highlight: true },
    { rowKey: 'xg', a: 1.85, b: 0.92, highlight: true },
    { rowKey: 'possession', a: '55%', b: '45%' },
    { rowKey: 'shotsOnTarget', a: '12 (5)', b: '8 (3)' },
    { rowKey: 'finalThirdPasses', a: 145, b: 98 },
    { rowKey: 'keyPasses', a: 8, b: 3 },
    { rowKey: 'corners', a: 6, b: 4 },
    { rowKey: 'duelPct', a: '52%', b: '48%' },
  ]

};

const buildSoccerStatsWithScore = (
  teamAScore: number,
  teamBScore: number,
  teamALabel: string,
  teamBLabel: string
) => ({
  ...SOCCER_MATCH_STATS,
  teamA: { ...SOCCER_MATCH_STATS.teamA, score: teamAScore, displayLabel: teamALabel },
  teamB: { ...SOCCER_MATCH_STATS.teamB, score: teamBScore, displayLabel: teamBLabel },
  comparison: SOCCER_MATCH_STATS.comparison.map((row) =>
    row.rowKey === 'goals' ? { ...row, a: teamAScore, b: teamBScore } : row
  ),
});

/** 足球 MVP 云端结果（演示形态，契约见 docs/soccer-mvp-api-contract.md） */
type SoccerMvpCloudJobResult = {
  version: 'soccer-mvp-1';
  finalScore: { teamA: number; teamB: number };
  events: Array<{
    id: number;
    time: string;
    scoreType: 'goal' | 'penalty';
    team: 'A' | 'B';
    player: string | null;
  }>;
  summary: string;
};

function buildSoccerMvpCloudJobResultFromClips(
  soccerClips: readonly {
    id: number;
    time: string;
    scoreType?: string | number;
    team: string;
    player?: string | null;
  }[],
  teamAScore: number,
  teamBScore: number,
  translate: (key: string, opts?: Record<string, unknown>) => string,
  teamDisplayNames: { teamA: string; teamB: string }
): SoccerMvpCloudJobResult {
  const events = soccerClips
    .filter((c) => c.scoreType === 'goal' || c.scoreType === 'penalty')
    .map((c) => ({
      id: c.id,
      time: String(c.time),
      scoreType: c.scoreType as 'goal' | 'penalty',
      team: (c.team === 'A' || c.team === 'B' ? c.team : 'A') as 'A' | 'B',
      player: (c.player as string | null | undefined) ?? null,
    }))
    .sort((a, b) => parseMatchClockToSeconds(a.time) - parseMatchClockToSeconds(b.time));

  const teamAName =
    teamDisplayNames.teamA.trim() || translate(SOCCER_MATCH_STATS.teamA.nameKey);
  const teamBName =
    teamDisplayNames.teamB.trim() || translate(SOCCER_MATCH_STATS.teamB.nameKey);

  let summary: string;
  if (events.length === 0) {
    summary = translate('matchReport.soccerMvpSummaryNoGoals', {
      teamA: teamAName,
      teamB: teamBName,
      scoreA: teamAScore,
      scoreB: teamBScore,
    });
  } else {
    const lines = events.map((e) => {
      const typeKey = e.scoreType === 'goal' ? 'matchReport.soccerMvpTypeGoal' : 'matchReport.soccerMvpTypePenalty';
      const side = e.team === 'A' ? teamAName : teamBName;
      const who = e.player ? translate('matchReport.soccerMvpPlayerSuffix', { player: e.player }) : '';
      return translate('matchReport.soccerMvpEventLine', {
        time: e.time,
        side,
        player: who,
        type: translate(typeKey),
      });
    });
    summary = translate('matchReport.soccerMvpSummaryWithEvents', {
      teamA: teamAName,
      teamB: teamBName,
      scoreA: teamAScore,
      scoreB: teamBScore,
      events: lines.join('\n'),
    });
  }

  return {
    version: 'soccer-mvp-1',
    finalScore: { teamA: teamAScore, teamB: teamBScore },
    events,
    summary,
  };
}

// --- Shared Components ---

const AssetThumbnail = ({ type, category }: { type: string, category: string }) => {

  const isBasketball = category === 'basketball';

  const isSoccer = category === 'soccer';

  const isBaseball = category === 'baseball';

  

  let bgClass = 'bg-slate-800';

  if (isBasketball) bgClass = 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-600 via-orange-700 to-orange-900';

  else if (isSoccer) bgClass = 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-600 via-emerald-700 to-emerald-900';

  else if (isBaseball) bgClass = 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600 via-blue-700 to-blue-900';

  return (

    <div className={`w-full h-full relative overflow-hidden ${bgClass}`}>

      <div className="absolute inset-0 opacity-40 mix-blend-overlay">

        {isBasketball && <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><pattern id="floor" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0h10v1H0z" fill="black" opacity="0.1"/><path d="M5 0v10h1V0z" fill="black" opacity="0.05"/></pattern></defs><rect width="100%" height="100%" fill="url(#floor)" /><path d="M0 0 H100 V100 H0 Z" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/><circle cx="50" cy="50" r="20" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8"/><path d="M0 50 Q 50 100 100 50" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8"/></svg>}

        {isSoccer && <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="white" opacity="0.05"/></pattern></defs><rect width="100%" height="100%" fill="url(#grass)" /><rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/><line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="1" opacity="0.8"/><circle cx="50" cy="50" r="15" stroke="white" strokeWidth="1" fill="none" opacity="0.8"/></svg>}

        {isBaseball && <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 100 L50 50 L100 100" fill="none" stroke="white" strokeWidth="1" opacity="0.5"/><circle cx="50" cy="80" r="5" fill="none" stroke="white" strokeWidth="1" opacity="0.8"/></svg>}

      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">

          {type === 'video' ? <Film className="w-8 h-8 text-white/90 drop-shadow-lg" /> : <ImageIcon className="w-8 h-8 text-white/90 drop-shadow-lg" />}

      </div>

    </div>

  );

};

/** 传输弹层 / 最小化条 / 任务中心卡片：各技术路线共用的一套展示规则（纯函数）。混合路线四段式仍为 25/50/75/100；选「云端深析」时与第三条 falcon_direct_cloud 共用三节点与 50/50/100 进度语义。 */
type TransferPipelineLayout = 'edge_chip' | 'falcon_three' | 'falcon_four';

type FloatingMinimizedIcon = 'alert' | 'paused' | 'cpu' | 'download' | 'upload' | 'sparkles';

type TaskCenterCardIcon = 'alert' | 'cpu' | 'download' | 'upload';

type TaskCenterCardTone = 'red' | 'orange' | 'emerald' | 'blue';

function getTransferPipelinePresentation(args: {
  analysisPipeline: AnalysisPipeline;
  transferStep: TransferStep;
  hybridPastEdge: boolean;
  hybridLocalOnlyThisRun: boolean;
  hybridCloudDeepThisRun: boolean;
  isFailed: boolean;
  isPaused: boolean;
}) {
  const {
    analysisPipeline,
    transferStep,
    hybridPastEdge,
    hybridLocalOnlyThisRun,
    hybridCloudDeepThisRun,
    isFailed,
    isPaused,
  } = args;

  const isAnalyzing = transferStep === 'analyzing';

  const showEdgeChipLayout =
    !isFailed &&
    !isPaused &&
    ((analysisPipeline === 'on_device' && isAnalyzing) ||
      (analysisPipeline === 'edge_cloud_hybrid' &&
        !hybridPastEdge &&
        (isAnalyzing || (hybridLocalOnlyThisRun && transferStep === 'downloading'))));

  /** 第四条 + 云端深析：loading 与第三条「直传云」同一套三节点（不经 App 四格） */
  const hybridCloudDeepAsDirectCloud =
    analysisPipeline === 'edge_cloud_hybrid' && hybridCloudDeepThisRun && !showEdgeChipLayout;

  const layout: TransferPipelineLayout = showEdgeChipLayout
    ? 'edge_chip'
    : analysisPipeline === 'falcon_direct_cloud' || hybridCloudDeepAsDirectCloud
      ? 'falcon_three'
      : 'falcon_four';

  const thirdColumnIsEdge =
    analysisPipeline === 'on_device' ||
    (analysisPipeline === 'edge_cloud_hybrid' && !hybridPastEdge && !hybridCloudDeepThisRun);

  const directCloudStyleProgress =
    transferStep === 'uploading' ? '50%' : transferStep === 'analyzing' ? '100%' : '50%';

  const progressLineWidth =
    hybridCloudDeepAsDirectCloud
      ? directCloudStyleProgress
      : analysisPipeline === 'edge_cloud_hybrid'
        ? transferStep === 'downloading'
          ? '25%'
          : transferStep === 'analyzing' && !hybridPastEdge
            ? '50%'
            : transferStep === 'uploading'
              ? '75%'
              : transferStep === 'analyzing' && hybridPastEdge
                ? '100%'
                : '25%'
        : analysisPipeline === 'falcon_app_cloud'
          ? transferStep === 'downloading'
            ? '33%'
            : transferStep === 'uploading'
              ? '66%'
              : '100%'
          : analysisPipeline === 'falcon_direct_cloud'
            ? directCloudStyleProgress
            : transferStep === 'downloading'
              ? '33%'
              : '100%';

  const isEdgePhaseAnalyzing =
    analysisPipeline === 'on_device' ||
    (analysisPipeline === 'edge_cloud_hybrid' && !hybridPastEdge && !hybridCloudDeepThisRun);

  let modalTitleKey = 'ui.transferStageUploadTitle';
  let statusHintKey: string | null = null;
  let floatingIcon: FloatingMinimizedIcon = 'sparkles';
  let floatingDisplayKey = 'ui.transferStageUploadTitle';
  let floatingShowPercentAfter = true;

  if (isFailed) {
    modalTitleKey = 'ui.taskFailed';
    statusHintKey = null;
    floatingIcon = 'alert';
    floatingDisplayKey = 'ui.failed';
    floatingShowPercentAfter = false;
  } else if (isPaused) {
    modalTitleKey = 'ui.taskPaused';
    statusHintKey = null;
    floatingIcon = 'paused';
    floatingDisplayKey = 'ui.paused';
    floatingShowPercentAfter = false;
  } else if (showEdgeChipLayout) {
    modalTitleKey = 'ui.transferStageLocalAnalyzeTitle';
    statusHintKey =
      transferStep === 'downloading' &&
      analysisPipeline === 'edge_cloud_hybrid' &&
      hybridLocalOnlyThisRun &&
      !hybridPastEdge
        ? 'ui.transferStageDownloadHint'
        : 'ui.transferStageLocalAnalyzeHint';
    floatingIcon = 'cpu';
    floatingDisplayKey = 'ui.transferStageLocalAnalyzeTitle';
    floatingShowPercentAfter = false;
  } else if (transferStep === 'downloading') {
    modalTitleKey = 'ui.transferStageDownloadTitle';
    statusHintKey = 'ui.transferStageDownloadHint';
    floatingIcon = 'download';
    floatingDisplayKey = 'ui.transferStageDownloadTitle';
    floatingShowPercentAfter = true;
  } else if (transferStep === 'uploading') {
    modalTitleKey = 'ui.transferStageUploadTitle';
    statusHintKey =
      analysisPipeline === 'falcon_direct_cloud' || hybridCloudDeepAsDirectCloud
        ? 'ui.directCloudUploadStatus'
        : 'ui.transferStageUploadHint';
    floatingIcon = 'upload';
    floatingDisplayKey = 'ui.transferStageUploadTitle';
    floatingShowPercentAfter = true;
  } else if (isAnalyzing) {
    if (isEdgePhaseAnalyzing) {
      modalTitleKey = 'ui.transferStageLocalAnalyzeTitle';
      statusHintKey = 'ui.transferStageLocalAnalyzeHint';
      floatingIcon = 'cpu';
      floatingDisplayKey = 'ui.transferStageLocalAnalyzeTitle';
      floatingShowPercentAfter = false;
    } else {
      modalTitleKey = 'ui.transferStageCloudAnalyzeTitle';
      statusHintKey = 'ui.transferStageCloudAnalyzeHint';
      floatingIcon = 'sparkles';
      floatingDisplayKey = 'ui.transferStageCloudAnalyzeTitle';
      floatingShowPercentAfter = false;
    }
  } else {
    modalTitleKey = 'ui.transferStageUploadTitle';
    statusHintKey = 'ui.transferStageUploadHint';
    floatingIcon = 'upload';
    floatingDisplayKey = 'ui.transferStageUploadTitle';
    floatingShowPercentAfter = true;
  }

  const statusPanelUseGreenPulse =
    (isAnalyzing || (showEdgeChipLayout && transferStep === 'downloading')) && !isFailed;

  let taskCenterIcon: TaskCenterCardIcon = 'upload';
  let taskCenterTone: TaskCenterCardTone = 'blue';
  let taskCenterTitleKey = 'ui.transferStageUploadTitle';

  if (isFailed) {
    taskCenterIcon = 'alert';
    taskCenterTone = 'red';
    taskCenterTitleKey = 'ui.taskFailedShort';
  } else if (isPaused) {
    taskCenterTone = 'blue';
    taskCenterTitleKey = 'ui.taskPaused';
  } else if (showEdgeChipLayout) {
    taskCenterIcon = 'cpu';
    taskCenterTone = 'emerald';
    taskCenterTitleKey = 'ui.transferStageLocalAnalyzeTitle';
  } else if (transferStep === 'downloading') {
    if (hybridCloudDeepAsDirectCloud) {
      taskCenterIcon = 'download';
      taskCenterTone = 'orange';
      taskCenterTitleKey = 'ui.transferStageDownloadTitle';
    } else {
      taskCenterIcon = 'download';
      taskCenterTone = 'orange';
      taskCenterTitleKey = 'ui.transferStageDownloadTitle';
    }
  } else if (transferStep === 'uploading') {
    taskCenterIcon = 'upload';
    taskCenterTone = 'blue';
    taskCenterTitleKey = 'ui.transferStageUploadTitle';
  } else if (isAnalyzing && isEdgePhaseAnalyzing) {
    taskCenterIcon = 'cpu';
    taskCenterTone = 'emerald';
    taskCenterTitleKey = 'ui.transferStageLocalAnalyzeTitle';
  } else if (isAnalyzing) {
    taskCenterIcon = 'upload';
    taskCenterTone = 'blue';
    taskCenterTitleKey = 'ui.transferStageCloudAnalyzeTitle';
  } else {
    taskCenterIcon = 'upload';
    taskCenterTone = 'blue';
    taskCenterTitleKey = 'ui.transferStageUploadTitle';
  }

  return {
    layout,
    showEdgeChipLayout,
    hybridCloudDeepAsDirectCloud,
    progressLineWidth,
    thirdColumnIsEdge,
    modalTitleKey,
    statusHintKey,
    statusPanelUseGreenPulse,
    floatingIcon,
    floatingDisplayKey,
    floatingShowPercentAfter,
    taskCenterIcon,
    taskCenterTone,
    taskCenterTitleKey,
  };
}

// --- Sub-Screens ---

const TransferOverlay = () => {

  const { t,

    transferStep, transferProgress, isTransferMinimized, setIsTransferMinimized,

    networkState, falconState, failureReason, setTransferStep, setTransferProgress, setFalconState, setNetworkState, pushView,

    analysisPipeline,

    hybridPastEdge,

    setHybridPastEdge,

    hybridSourceMedia,

    hybridLocalOnlyThisRun,

    hybridCloudDeepThisRun,

  } = useAppContext();

  

   if ((transferStep === 'idle' || transferStep === 'completed') || isTransferMinimized) return null;

   

   const isAnalyzing = transferStep === 'analyzing';

   const isFailed = transferStep === 'failed';

   const isPaused = transferStep === 'paused';

   const pipe = getTransferPipelinePresentation({
     analysisPipeline,
     transferStep,
     hybridPastEdge,
     hybridLocalOnlyThisRun,
     hybridCloudDeepThisRun,
     isFailed,
     isPaused,
   });

   

   // --- Logic for status message ---

   let statusText = '';

   let subText = '';

   

   if (isFailed) {

       statusText = failureReason || t('ui.failureDefault');

       subText = t('ui.checkEnvRetry');

   } else if (isPaused) {

       if (networkState === 'offline') {

           statusText = t('ui.networkOffline');

           subText = t('ui.waitingNetwork');

       } else if (networkState === '4g') {

           statusText = t('ui.pausedCellular');

           subText = t('ui.cellularSub');

       } else if (falconState === 'disconnected') {

           statusText = t('ui.falconDisconnected');

           subText = t('ui.falconSub');

       } else {

           statusText = t('ui.taskPausedShort');

       }

   } else if (pipe.statusHintKey) {

       statusText = t(pipe.statusHintKey);

   }

   const handleRetry = () => {

       if (falconState === 'disconnected') setFalconState('connected');

       if (networkState === 'offline') setNetworkState('wifi');

       if (analysisPipeline === 'on_device') {
         setTransferStep('analyzing');
       } else if (analysisPipeline === 'edge_cloud_hybrid') {
         setHybridPastEdge(false);
         setTransferProgress(0);
         setTransferStep(hybridSourceMedia === 'falcon' ? 'downloading' : 'analyzing');
       } else if (analysisPipeline === 'falcon_direct_cloud') {
         setTransferStep(transferProgress < 50 ? 'uploading' : 'analyzing');
       } else {
         if (transferProgress < 33) setTransferStep('downloading');
         else if (transferProgress < 66) setTransferStep('uploading');
         else setTransferStep('analyzing');
       }

   };

   const thirdNodeActive =
     !isFailed && (transferStep === 'uploading' || transferStep === 'analyzing');

   const showFalconDirectPipeline = pipe.layout === 'falcon_three';

   const directFalconActive =
     showFalconDirectPipeline &&
     !isFailed &&
     !isPaused &&
     ((analysisPipeline === 'falcon_direct_cloud' && transferStep === 'uploading') ||
       (pipe.hybridCloudDeepAsDirectCloud && (transferStep === 'downloading' || transferStep === 'uploading')));

   const directCloudNodeActive =
     showFalconDirectPipeline &&
     !isFailed &&
     !isPaused &&
     ((analysisPipeline === 'falcon_direct_cloud' && (transferStep === 'uploading' || transferStep === 'analyzing')) ||
       (pipe.hybridCloudDeepAsDirectCloud && (transferStep === 'uploading' || transferStep === 'analyzing')));

   return (

      <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">

         <div className="w-full max-w-xs bg-[#1E293B] rounded-2xl p-6 text-center border border-white/10 shadow-2xl relative">

            <button onClick={() => setIsTransferMinimized(true)} className="absolute top-3 right-3 text-slate-400 hover:text-white"><Minimize2 className="w-4 h-4" /></button>

            

            <h3 className={`text-base font-bold mb-6 ${isFailed ? 'text-red-500' : (isPaused ? 'text-yellow-500' : 'text-white')}`}>
                {t(pipe.modalTitleKey)}
            </h3>

            {pipe.showEdgeChipLayout ? (
              <div className="flex flex-col items-center justify-center mb-6 py-1">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-400/80 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
              </div>
            ) : showFalconDirectPipeline ? (
            <div className="flex items-center justify-between px-8 mb-8 relative">

               <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-slate-700 -z-10"></div>

               <div className={`absolute left-8 h-0.5 transition-all duration-1000 -z-10 ${isFailed ? 'bg-red-500' : (isPaused ? 'bg-yellow-500' : 'bg-blue-500')}`} style={{ width: pipe.progressLineWidth }}></div>

               <div className={`flex flex-col items-center gap-2 ${directFalconActive ? 'opacity-100 scale-110' : 'opacity-60'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${directFalconActive ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                       <Film className="w-3 h-3" />
                   </div>
                   <span className="text-[8px] text-slate-400">Falcon</span>
               </div>

               <div className={`flex flex-col items-center gap-2 ${directCloudNodeActive ? 'opacity-100 scale-110' : 'opacity-60'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isFailed ? 'bg-red-500 border-red-400 text-white' : (directCloudNodeActive ? 'bg-orange-500 border-orange-400 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400')}`}>
                       {isFailed ? <X className="w-4 h-4" /> : <Cloud className="w-3 h-3" />}
                   </div>
                   <span className="text-[8px] text-slate-400">{t('ui.pipelineCloudNode')}</span>
               </div>

               <div className={`flex flex-col items-center gap-2 ${isAnalyzing || isFailed ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isAnalyzing ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                       <Sparkles className="w-3 h-3" />
                   </div>
                   <span className="text-[8px] text-slate-400">AI</span>
               </div>

            </div>
            ) : (
            /* Icons row */

            <div className="flex items-center justify-between px-2 mb-8 relative">

               <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-slate-700 -z-10"></div>

               {/* Progress Line */}

               <div className={`absolute left-6 h-0.5 transition-all duration-1000 -z-10 ${isFailed ? 'bg-red-500' : (isPaused ? 'bg-yellow-500' : 'bg-blue-500')}`} style={{ width: pipe.progressLineWidth }}></div>

               

               <div className={`flex flex-col items-center gap-2 ${transferStep === 'downloading' ? 'opacity-100 scale-110' : 'opacity-60'}`}>

                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${transferStep === 'downloading' ? (isPaused && falconState === 'disconnected' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-blue-600 border-blue-400 text-white') : 'bg-slate-800 border-slate-600 text-slate-400'}`}>

                       {falconState === 'disconnected' ? <AlertTriangle className="w-4 h-4" /> : <Film className="w-3 h-3" />}

                   </div>

                   <span className="text-[8px] text-slate-400">Falcon</span>

               </div>

               <div className={`flex flex-col items-center gap-2 ${transferStep === 'uploading' ? 'opacity-100 scale-110' : 'opacity-60'}`}>

                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${transferStep === 'uploading' || transferStep === 'downloading' ? ((isPaused && networkState !== 'wifi') ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-slate-800 border-blue-500 text-white') : 'bg-slate-800 border-slate-600 text-slate-400'}`}>

                       {networkState === 'offline' ? <WifiOff className="w-3 h-3" /> : <PhoneIcon className="w-3 h-3" />}

                   </div>

                   <span className="text-[8px] text-slate-400">App</span>

               </div>

               <div className={`flex flex-col items-center gap-2 ${thirdNodeActive || isFailed ? 'opacity-100 scale-110' : 'opacity-60'}`}>

                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isFailed ? 'bg-red-500 border-red-400 text-white' : (thirdNodeActive ? 'bg-orange-500 border-orange-400 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400')}`}>

                       {isFailed ? (
                         <X className="w-4 h-4" />
                       ) : pipe.thirdColumnIsEdge ? (
                         <Cpu className="w-3 h-3" />
                       ) : (
                         <Cloud className="w-3 h-3" />
                       )}

                   </div>

                   <span className="text-[8px] text-slate-400">
                     {pipe.thirdColumnIsEdge ? t('ui.pipelineEdgeNode') : t('ui.pipelineCloudNode')}
                   </span>

               </div>

               

               <div className={`flex flex-col items-center gap-2 ${isAnalyzing || isFailed ? 'opacity-100 scale-110' : 'opacity-40'}`}>

                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isAnalyzing ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>

                       <Sparkles className="w-3 h-3" />

                   </div>

                   <span className="text-[8px] text-slate-400">AI</span>

               </div>

            </div>
            )}

            {/* Status Panel */}

            <div className={`rounded-lg p-3 mb-4 ${isFailed ? 'bg-red-500/10 border border-red-500/20' : (isPaused ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-slate-800/50')}`}>

                {!pipe.showEdgeChipLayout && (
                <div className="flex justify-between text-xs text-white mb-2">

                    <span className={isFailed ? 'text-red-400 font-bold' : (isPaused ? 'text-yellow-400 font-bold' : '')}>{statusText}</span>

                    {!isAnalyzing && !isFailed && <span className="font-mono">{transferProgress}%</span>}

                </div>
                )}

                {pipe.showEdgeChipLayout && (
                <div className="flex justify-between text-xs text-white mb-2">

                    <span>{pipe.statusHintKey ? t(pipe.statusHintKey) : t('ui.transferStageLocalAnalyzeHint')}</span>

                </div>
                )}

                

                {subText && <p className="text-[10px] text-slate-400 text-left mb-2">{subText}</p>}

                {pipe.statusPanelUseGreenPulse ? (

                  <div className={`flex gap-1 h-1.5 w-full ${pipe.showEdgeChipLayout ? 'mt-0' : ''}`}><div className={`h-full w-1/3 rounded-full animate-[pulse_1s_ease-in-out_infinite] ${pipe.showEdgeChipLayout ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{animationDelay: '0ms'}}></div><div className={`h-full w-1/3 rounded-full animate-[pulse_1s_ease-in-out_infinite] ${pipe.showEdgeChipLayout ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{animationDelay: '200ms'}}></div><div className={`h-full w-1/3 rounded-full animate-[pulse_1s_ease-in-out_infinite] ${pipe.showEdgeChipLayout ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{animationDelay: '400ms'}}></div></div>

                ) : (

                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">

                      <div className={`h-full transition-all duration-300 ${isFailed ? 'bg-red-500' : (isPaused ? 'bg-yellow-500' : 'bg-blue-500')}`} style={{ width: `${transferProgress}%` }} />

                  </div>

                )}

            </div>

            

            {(isFailed || isPaused) && (

                <div className="flex gap-3 mt-4">

                    <button onClick={() => { setTransferStep('idle'); setTransferProgress(0); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-300">{t('ui.cancelTask')}</button>

                    <button onClick={handleRetry} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-blue-500/20">

                        {isFailed ? t('ui.retry') : t('ui.continue')}

                    </button>

                </div>

            )}

            

            {!isFailed && !isPaused && <p className="text-[10px] text-slate-500 mt-2">{t('ui.minimizeHint')}</p>}

         </div>

      </div>

   );

};

const FloatingProgress = () => {

  const {
    t,
    transferStep,
    transferProgress,
    isTransferMinimized,
    setIsTransferMinimized,
    analysisPipeline,
    hybridPastEdge,
    hybridLocalOnlyThisRun,
    hybridCloudDeepThisRun,
  } = useAppContext();

  if (!isTransferMinimized || transferStep === 'idle' || transferStep === 'completed') return null;

  

  const isAnalyzing = transferStep === 'analyzing';

  const isFailed = transferStep === 'failed';

  const isPaused = transferStep === 'paused';

  const fp = getTransferPipelinePresentation({
    analysisPipeline,
    transferStep,
    hybridPastEdge,
    hybridLocalOnlyThisRun,
    hybridCloudDeepThisRun,
    isFailed,
    isPaused,
  });

  let icon = <Sparkles className="w-4 h-4 text-orange-400" />;
  if (fp.floatingIcon === 'alert') icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
  else if (fp.floatingIcon === 'paused') icon = <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  else if (fp.floatingIcon === 'cpu') icon = <Cpu className="w-4 h-4 text-emerald-400" />;
  else if (fp.floatingIcon === 'download') icon = <DownloadCloud className="w-4 h-4 text-blue-400" />;
  else if (fp.floatingIcon === 'upload') icon = <UploadCloud className="w-4 h-4 text-purple-400" />;

  const text = fp.floatingShowPercentAfter
    ? `${t(fp.floatingDisplayKey)} ${transferProgress}%`
    : t(fp.floatingDisplayKey);

  return (

    <button onClick={() => setIsTransferMinimized(false)} className={`absolute bottom-24 right-4 z-50 bg-slate-900 text-white px-3 py-2 rounded-full shadow-xl border border-white/10 flex items-center gap-2 ${(!isFailed && !isPaused) ? 'animate-pulse' : ''}`}>

      {icon}

      <span className="text-xs font-bold font-mono">{text}</span>

    </button>

  );

};

// --- Modals for Exceptions ---

const CellularDataModal = () => {

    const { t, showCellularAlert, setShowCellularAlert, setTransferStep, setNetworkState } = useAppContext();

    if (!showCellularAlert) return null;

    return (

        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">

            <div className="bg-white w-full max-w-xs rounded-2xl p-5 text-center shadow-xl">

                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600"><Signal className="w-6 h-6" /></div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('ui.cellularTitle')}</h3>

                <p className="text-sm text-slate-500 mb-6">{t('ui.cellularDesc')}</p>

                <div className="flex gap-3">

                    <button onClick={() => { setShowCellularAlert(false); setTransferStep('paused'); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">{t('ui.pauseUpload')}</button>

                    <button onClick={() => { setShowCellularAlert(false); setTransferStep('uploading'); }} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">{t('ui.continueUpload')}</button>

                </div>

            </div>

        </div>

    );

};

const CrashRecoveryModal = () => {

    const { t, showCrashRecovery, setShowCrashRecovery, setTransferStep, setTransferProgress } = useAppContext();

    if (!showCrashRecovery) return null;

    return (

        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">

            <div className="bg-white w-full max-w-xs rounded-2xl p-5 text-center shadow-xl">

                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><RefreshCw className="w-6 h-6" /></div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('ui.recoveryTitle')}</h3>

                <p className="text-sm text-slate-500 mb-6">{t('ui.recoveryDesc')}</p>

                <div className="flex gap-3">

                    <button onClick={() => { setShowCrashRecovery(false); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">{t('ui.discard')}</button>

                    <button onClick={() => { setShowCrashRecovery(false); setTransferStep('uploading'); setTransferProgress(45); }} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">{t('ui.recoverTask')}</button>

                </div>

            </div>

        </div>

    );

};

const StorageFullModal = () => {

    const { t, showStorageAlert, setShowStorageAlert } = useAppContext();

    if (!showStorageAlert) return null;

    return (

        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">

            <div className="bg-white w-full max-w-xs rounded-2xl p-5 text-center shadow-xl">

                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><HardDrive className="w-6 h-6" /></div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('ui.storageTitle')}</h3>

                <p className="text-sm text-slate-500 mb-6">{t('ui.storageDesc')}</p>

                <button onClick={() => { setShowStorageAlert(false); }} className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm">{t('ui.gotIt')}</button>

            </div>

        </div>

    );

};

const UpsellModal = () => {

  const { t, setShowUpsellModal, handleUnlockVip, targetAnalysisType } = useAppContext();

  return (

    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">

        <div className="bg-[#1E293B] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative p-6 text-center">

            <button onClick={() => setShowUpsellModal(false)} className="absolute top-4 right-4 text-white/50"><X className="w-5 h-5"/></button>

            <Crown className="w-16 h-16 text-white mx-auto mb-4" />

            <h3 className="text-xl font-black text-white mb-2">{t('ui.upgradeFalconPro')}</h3>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">

                {t('ui.upgradeProDesc')}

             </p>

            <button onClick={handleUnlockVip} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-6">{t('ui.subscribeNow')}</button>

        </div>

    </div>

  );

};

// --- Progress Modal Component ---

const ProgressModal = () => {

  const { t, progressModal, setProgressModal } = useAppContext();

  if (!progressModal.show) return null;

  // Auto-close when progress reaches 100%
  useEffect(() => {
    if (progressModal.progress >= 100) {
      const timer = setTimeout(() => {
        setProgressModal({ show: false, title: '', progress: 0 });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progressModal.progress, setProgressModal]);

  return (

    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in">

        <div className="bg-[#1E293B] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative p-6 text-center">

            <h3 className="text-lg font-black text-white mb-4">{progressModal.title}</h3>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300" style={{ width: `${progressModal.progress}%` }} />
            </div>

            {/* Progress Percentage */}
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">{t('ui.progress')}</span>
                <span className="text-sm font-bold text-white font-mono">{Math.round(progressModal.progress)}%</span>
            </div>

            {/* Optional Message */}
            {progressModal.message && (
                <p className="text-xs text-slate-400 mt-2">{progressModal.message}</p>
            )}

            {/* Cancel Button */}
            <button 
                onClick={() => setProgressModal({ show: false, title: '', progress: 0 })}
                className="mt-4 text-xs text-slate-400 hover:text-white transition-colors"
            >
                {t('ui.cancel')}
            </button>

        </div>

    </div>

  );

};

// --- Share Modal Component ---

const ShareModal = () => {

  const { t, showShareModal, setShowShareModal, setProgressModal, setToastMessage, shareContext, isVip } = useAppContext();
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const showNoWatermarkOption = isVip && shareContext.type !== 'player_dashboard';

  const handleShare = (type: 'album' | 'facebook' | 'youtube', watermark: boolean = true) => {
    setShowShareModal(false);
    
    let title = '';
    let toastMessage = '';
    
    if (type === 'album') {
      title = watermark ? t('ui.savingToAlbum') : t('ui.savingToAlbumNoWatermark');
      toastMessage = watermark ? t('ui.savedToAlbum') : t('ui.savedToAlbumNoWatermark');
    } else if (type === 'facebook') {
      title = watermark ? t('ui.sharingToFb') : t('ui.sharingToFbNo');
      toastMessage = watermark ? t('ui.sharedToFb') : t('ui.sharedToFbNo');
    } else if (type === 'youtube') {
      title = watermark ? t('ui.sharingToYt') : t('ui.sharingToYtNo');
      toastMessage = watermark ? t('ui.sharedToYt') : t('ui.sharedToYtNo');
    }

    setProgressModal({ show: true, title, progress: 0 });

    // Simulate progress
    let progress = 0;
    const increment = type === 'album' ? 8 : 5; // Album is faster
    const interval = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setProgressModal({ show: false, title: '', progress: 0 });
          setToastMessage(toastMessage);
          setTimeout(() => setToastMessage(null), 3000);
        }, 1000);
      }
      setProgressModal((prev: { show: boolean; title: string; progress: number; message?: string }) => ({ ...prev, progress }));
    }, 200);
  };

  if (!showShareModal) return null;

  return (

    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">

        <div className="bg-[#1E293B] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative p-6">

            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5"/>
            </button>

            <h3 className="text-xl font-black text-white mb-6 text-center">{t('ui.chooseShareMethod')}</h3>

            {/* Member: no-watermark export */}
            {showNoWatermarkOption && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-white">{t('ui.memberShareBadge')}</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!watermarkEnabled}
                                onChange={(e) => setWatermarkEnabled(!e.target.checked)}
                                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <span className="text-xs text-slate-300">{t('ui.exportNoWatermark')}</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">

                <button 
                    onClick={() => handleShare('album', watermarkEnabled)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                    <Save className="w-5 h-5" />
                    <span>{t('ui.saveToAlbum')}</span>
                </button>

                <button 
                    onClick={() => handleShare('facebook', watermarkEnabled)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    <span>{t('ui.shareToFacebook')}</span>
                </button>

                <button 
                    onClick={() => handleShare('youtube', watermarkEnabled)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    <span>{t('ui.shareToYouTube')}</span>
                </button>

            </div>

        </div>

    </div>

  );

};

// --- New: Scenario Wizard Panel (Replacing the old DevDebugPanel) ---

const ScenarioWizard = () => {

    const { 
        runScenario, 
        networkState, setNetworkState, 
        falconState, setFalconState,
        setToastMessage
    } = useAppContext();

    const [isOpen, setIsOpen] = useState(false);

    return (

        <div className="absolute bottom-2 left-2 z-[9999]">

            <button 

              onClick={() => setIsOpen(!isOpen)}

              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-white/20 transition-all ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-slate-900 text-green-400'}`}

            >

                {isOpen ? <X className="w-5 h-5" /> : <div className="text-lg">🧪</div>}

            </button>

            

            {isOpen && (

                <div className="absolute bottom-12 left-0 bg-white p-4 rounded-2xl w-64 shadow-2xl border border-slate-100 flex flex-col gap-3 animate-in zoom-in-95 origin-bottom-left">

                    <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        {i18n.t('ui.devScenarioTitle')}
                    </h3>

                    <p className="text-[10px] text-slate-400 mb-2">
                      {i18n.t('ui.devScenarioDesc')}
                    </p>

                    

                    <button onClick={() => { runScenario('device_disconnect'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><AlertTriangle className="w-4 h-4" /></div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {i18n.t('ui.devScenarioDeviceDisconnectTitle')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {i18n.t('ui.devScenarioDeviceDisconnectDesc')}
                          </div>
                        </div>

                    </button>

                    <button onClick={() => { runScenario('concurrent_task'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><Layers className="w-4 h-4" /></div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {i18n.t('ui.devScenarioConcurrentTitle')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {i18n.t('ui.devScenarioConcurrentDesc')}
                          </div>
                        </div>

                    </button>

                    <button onClick={() => { runScenario('network_4g'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><Signal className="w-4 h-4" /></div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {i18n.t('ui.devScenario4GTitle')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {i18n.t('ui.devScenario4GDesc')}
                          </div>
                        </div>

                    </button>

                    <button onClick={() => { runScenario('network_offline'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><WifiOff className="w-4 h-4" /></div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {i18n.t('ui.devScenarioOfflineTitle')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {i18n.t('ui.devScenarioOfflineDesc')}
                          </div>
                        </div>

                    </button>

                    <button onClick={() => { runScenario('crash_recovery'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><RefreshCw className="w-4 h-4" /></div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {i18n.t('ui.devScenarioCrashTitle')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {i18n.t('ui.devScenarioCrashDesc')}
                          </div>
                        </div>

                    </button>

                    <button onClick={() => { runScenario('storage_full'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><HardDrive className="w-4 h-4" /></div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {i18n.t('ui.devScenarioStorageTitle')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {i18n.t('ui.devScenarioStorageDesc')}
                          </div>
                        </div>

                    </button>

                    <button onClick={() => { runScenario('cloud_queue_full'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><Layers className="w-4 h-4" /></div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {i18n.t('ui.devScenarioQueueFullTitle')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {i18n.t('ui.devScenarioQueueFullDesc')}
                          </div>
                        </div>

                    </button>

                </div>

            )}

        </div>

    );

};

const TechRouteToggle = () => {
  const { t, analysisPipeline, setAnalysisPipeline, transferStep } = useAppContext();
  const busy =
    transferStep !== 'idle' &&
    transferStep !== 'completed' &&
    transferStep !== 'failed';

  const segmentClass = (active: boolean) =>
    `w-full py-2 px-2 rounded-lg text-[11px] font-bold transition-colors text-left ${
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
    }`;

  const hint =
    analysisPipeline === 'on_device'
      ? t('ui.techRouteOnDeviceHint')
      : analysisPipeline === 'falcon_app_cloud'
        ? t('ui.techRouteFalconAppCloudHint')
        : analysisPipeline === 'falcon_direct_cloud'
          ? t('ui.techRouteFalconDirectCloudHint')
          : t('ui.techRouteEdgeCloudHybridHint');

  return (
    <div className="w-full max-w-[240px] shrink-0 flex flex-col gap-2">
      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{t('ui.techRouteTitle')}</p>
      <div
        className={`rounded-xl p-1.5 flex flex-col gap-1 border shadow-sm ${
          busy ? 'bg-slate-200 border-slate-300 opacity-75' : 'bg-slate-100 border-slate-200'
        }`}
        title={busy ? t('ui.techRouteDisabledHint') : undefined}
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => setAnalysisPipeline('falcon_direct_cloud')}
          className={`${segmentClass(analysisPipeline === 'falcon_direct_cloud')} ${busy ? 'cursor-not-allowed' : ''}`}
        >
          {t('ui.techRouteDirectCloud')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAnalysisPipeline('falcon_app_cloud')}
          className={`${segmentClass(analysisPipeline === 'falcon_app_cloud')} ${busy ? 'cursor-not-allowed' : ''}`}
        >
          {t('ui.techRouteFalconAppCloud')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAnalysisPipeline('on_device')}
          className={`${segmentClass(analysisPipeline === 'on_device')} ${busy ? 'cursor-not-allowed' : ''}`}
        >
          {t('ui.techRouteOnDevice')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAnalysisPipeline('edge_cloud_hybrid')}
          className={`${segmentClass(analysisPipeline === 'edge_cloud_hybrid')} ${busy ? 'cursor-not-allowed' : ''}`}
        >
          {t('ui.techRouteEdgeCloudHybrid')} · {t('ui.techRouteExperimentalShort')}
        </button>
      </div>
      <p className="text-[10px] text-slate-500 leading-snug">{hint}</p>
    </div>
  );
};

// --- Player Selector Modal Component ---
const PlayerSelectorModal = () => {
  const {
    t,
    showPlayerSelector,
    setShowPlayerSelector,
    selectedEventForClaim,
    setSelectedEventForClaim,
    eventClaims,
    setEventClaims,
    resultSport,
    setToastMessage,
    liveSoccerStats,
  } = useAppContext();
  const [newLabel, setNewLabel] = useState('');

  if (!showPlayerSelector || !selectedEventForClaim) return null;

  const eventToClaim = AI_CLIPS_ADVANCED.find(e => e.id === selectedEventForClaim);
  if (!eventToClaim) return null;

  const isSoccer = resultSport === 'soccer';
  const sport = resultSport || 'soccer';
  const team = eventToClaim.team;
  const statsData = isSoccer ? liveSoccerStats : TEAM_MATCH_STATS;
  const teamName = team === 'A'
    ? (isSoccer ? (statsData.teamA as { displayLabel: string }).displayLabel : t(statsData.teamA.nameKey))
    : (isSoccer ? (statsData.teamB as { displayLabel: string }).displayLabel : t(statsData.teamB.nameKey));

  const currentLabel = eventClaims[selectedEventForClaim] ?? eventToClaim.player ?? null;
  const isAlreadyClaimed = currentLabel != null;

  const applyLabel = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setEventClaims((prev: Record<number, string>) => ({
      ...prev,
      [selectedEventForClaim]: trimmed
    }));
    (eventToClaim as any).player = trimmed;
    (eventToClaim as any).confidence = 'high';
    setShowPlayerSelector(false);
    setSelectedEventForClaim(null);
    setNewLabel('');
    setToastMessage(isAlreadyClaimed ? t('ui.updated') : t('ui.marked'));
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleAddNew = () => {
    if (!newLabel.trim()) return;
    applyLabel(newLabel);
  };

  const handleUnclaim = () => {
    setEventClaims((prev: Record<number, string>) => {
      const next = { ...prev };
      delete next[selectedEventForClaim];
      return next;
    });
    (eventToClaim as any).player = null;
    (eventToClaim as any).confidence = 'low';
    setShowPlayerSelector(false);
    setSelectedEventForClaim(null);
    setNewLabel('');
    setToastMessage(t('ui.cleared'));
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCancel = () => {
    setShowPlayerSelector(false);
    setSelectedEventForClaim(null);
    setNewLabel('');
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-[#1E293B] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-black text-white mb-2">{t('ui.markPlayer')}</h3>
          {isAlreadyClaimed && currentLabel && (
            <p className="text-xs text-amber-400 mt-2">{t('ui.currentLabelPrefix')}{currentLabel}</p>
          )}
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newLabel.trim()) {
                  handleAddNew();
                }
              }}
              placeholder={t('ui.playerPlaceholder')}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddNew}
              disabled={!newLabel.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold transition-colors"
            >
              {t('ui.confirm')}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-2">
          {isAlreadyClaimed && (
            <button
              onClick={handleUnclaim}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 py-2.5 rounded-xl font-bold text-sm transition-colors"
            >
              {t('ui.clear')}
            </button>
          )}
          <button
            onClick={handleCancel}
            className={isAlreadyClaimed ? 'flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors' : 'w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors'}
          >
            {t('ui.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Updated Screens ---

/** 传输列表：与「我的项目」分工；Download/Upload 为管道记录（原型占位） */
const TransferListScreen = () => {
  const { t, popView } = useAppContext();
  const [segment, setSegment] = useState<'download' | 'upload'>('download');

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] animate-in slide-in-from-right">
      <div className="pt-12 pb-2 px-5 bg-white flex items-center sticky top-0 z-10 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={popView} className="shrink-0">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </button>
          <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">{t('transferList.title')}</h1>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        <div className="flex rounded-xl bg-slate-200/80 p-1">
          <button
            type="button"
            onClick={() => setSegment('download')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              segment === 'download' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t('transferList.tabDownload')}
          </button>
          <button
            type="button"
            onClick={() => setSegment('upload')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              segment === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t('transferList.tabUpload')}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-200/90 flex items-center justify-center mb-4 text-slate-400">
          {segment === 'download' ? <Download className="w-10 h-10" /> : <UploadCloud className="w-10 h-10" />}
        </div>
        <p className="text-sm font-medium text-slate-500">{segment === 'download' ? t('transferList.emptyDownload') : t('transferList.emptyUpload')}</p>
      </div>
    </div>
  );
};

const TaskCenterScreen = () => {

  const {
    t,
    transferStep,
    transferProgress,
    popView,
    setTargetAnalysisType,
    setAiMode,
    setIsTaskCompleted,
    pushView,
    failureReason,
    setResultSport,
    setTransferStep,
    setTransferProgress,
    cloudTasks,
    getAnalyzingTasksCount,
    getQueuedTasks,
    maxConcurrentTasks,
    setToastMessage,
    analysisPipeline,
    hybridPastEdge,
    hybridLocalOnlyThisRun,
    hybridCloudDeepThisRun,
  } = useAppContext();

  // Get paused tasks from history
  const pausedTasks = HISTORY_TASKS.filter((task: any) => task.status === 'paused');
  const analysisHistoryRows = HISTORY_TASKS.filter((task: any) => task.status !== 'paused');
  
  // Get cloud tasks
  const analyzingTasks = cloudTasks.filter((task: CloudTask) => task.status === 'analyzing');
  const queuedTasks = getQueuedTasks();
  const analyzingCount = getAnalyzingTasksCount();

  // Task title editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>(() => {
    const titles: Record<string, string> = {};
    HISTORY_TASKS.forEach(task => {
      titles[task.id] = ''; // display uses t(task.titleKey) unless user edited
    });
    return titles;
  });

  // Edit handlers
  const handleStartEdit = (taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingTaskId(taskId);
  };

  const handleSaveEdit = (taskId: string, newTitle: string) => {
    if (newTitle.trim()) {
      setTaskTitles(prev => ({ ...prev, [taskId]: newTitle.trim() }));
    }
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const activePipe =
    transferStep !== 'idle' && transferStep !== 'completed'
      ? getTransferPipelinePresentation({
          analysisPipeline,
          transferStep,
          hybridPastEdge,
          hybridLocalOnlyThisRun,
          hybridCloudDeepThisRun,
          isFailed: transferStep === 'failed',
          isPaused: transferStep === 'paused',
        })
      : null;

  const taskCenterIconWrap =
    activePipe?.taskCenterTone === 'red'
      ? 'bg-red-100 text-red-600'
      : activePipe?.taskCenterTone === 'orange'
        ? 'bg-orange-100 text-orange-600'
        : activePipe?.taskCenterTone === 'emerald'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-blue-100 text-blue-600';

  return (

    <div className="flex flex-col h-full bg-[#F5F5F5] animate-in slide-in-from-right">

      <div className="pt-12 pb-2 px-5 bg-white flex justify-between items-center sticky top-0 z-10 border-b border-slate-100">

         <div className="flex items-center gap-3"><button onClick={popView}><ArrowLeft className="w-6 h-6 text-slate-800" /></button><h1 className="text-xl font-black text-slate-900 tracking-tight">{t('ui.toolboxSubTabMyProjects')}</h1></div>

         {/* Settings Removed per request */}

         <div className="w-5" />

      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

         {/* Active Progress Card - Current Task and Paused Tasks */}

         {(transferStep !== 'idle' && transferStep !== 'completed') || pausedTasks.length > 0 ? (

           <section className="mb-4">

              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">{t('ui.inProgress')}</h3>

              {/* Current Active Task */}
              {transferStep !== 'idle' && transferStep !== 'completed' && (

              <div className={`rounded-2xl p-4 shadow-sm border relative overflow-hidden group ${transferStep === 'failed' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>

                 <div className="flex items-center justify-between mb-3">

                    <div className="flex items-center gap-3">

                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transferStep === 'failed' ? 'bg-red-100 text-red-600' : taskCenterIconWrap}`}>

                           {activePipe?.taskCenterIcon === 'alert' ? (
                             <AlertTriangle className="w-5 h-5" />
                           ) : activePipe?.taskCenterIcon === 'cpu' ? (
                             <Cpu className="w-5 h-5" />
                           ) : activePipe?.taskCenterIcon === 'download' ? (
                             <DownloadCloud className="w-5 h-5" />
                           ) : (
                             <UploadCloud className="w-5 h-5" />
                           )}

                       </div>

                       <div>

                           <h4 className={`text-sm font-bold ${transferStep === 'failed' ? 'text-red-700' : 'text-slate-800'}`}>

                               {activePipe ? t(activePipe.taskCenterTitleKey) : ''}

                           </h4>

                           <p className={`text-xs ${transferStep === 'failed' ? 'text-red-500' : 'text-slate-400'}`}>

                               {transferStep === 'failed' ? (failureReason || t('ui.unknownError')) : t('ui.taskRemaining', { title: t('videos.fridayGame'), min: 2 })}

                           </p>

                       </div>

                    </div>

                    {transferStep !== 'failed' && <span className="text-lg font-black text-blue-600">{transferProgress}%</span>}

                 </div>

                 

                 {transferStep !== 'failed' && (

                     <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3"><div className={`h-full transition-all duration-300 ${transferStep === 'paused' ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${transferProgress}%` }} /></div>

                 )}

                 

                 <div className="flex justify-end gap-2">

                     {transferStep === 'failed' ? (

                         <>

                             <button className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1"><MessageSquare className="w-3 h-3"/> {t('ui.feedbackIssue')}</button>

                             <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold">{t('ui.retry')}</button>

                         </>

                     ) : (

                         <>

                             <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">{transferStep === 'paused' ? t('ui.continue') : t('ui.pause')}</button>

                             <button className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-bold">{t('ui.cancel')}</button>

                         </>

                     )}

                 </div>

              </div>

              )}

              {/* Paused Tasks */}
              {pausedTasks.map(task => (
                  <div key={task.id} className="rounded-2xl p-4 shadow-sm border bg-white border-yellow-100 mb-3">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100 text-yellow-600 shrink-0">
                                  <Minimize2 className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  {editingTaskId === task.id ? (
                                      <div onClick={(e) => e.stopPropagation()}>
                                          <div className="flex items-center gap-2 mb-2">
                                              <input
                                                  type="text"
                                                  defaultValue={taskTitles[task.id] || t((task as any).titleKey)}
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                          handleSaveEdit(task.id, e.currentTarget.value);
                                                      } else if (e.key === 'Escape') {
                                                          handleCancelEdit();
                                                      }
                                                  }}
                                                  onBlur={(e) => {
                                                      handleSaveEdit(task.id, e.currentTarget.value);
                                                  }}
                                                  className="flex-1 text-sm font-bold px-2 py-1.5 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      const input = e.currentTarget.parentElement?.querySelector('input');
                                                      if (input) {
                                                          handleSaveEdit(task.id, input.value);
                                                      }
                                                  }}
                                                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors shrink-0"
                                              >
                                                  {t('ui.save')}
                                              </button>
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleCancelEdit();
                                                  }}
                                                  className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 transition-colors shrink-0"
                                              >
                                                  {t('ui.cancel')}
                                              </button>
                                          </div>
                                          <p className="text-xs text-slate-400">
                                              {t((task as any).dateKey)} · {task.type === 'highlight' ? t('ui.basicHighlight') : t('ui.advancedAnalysis')}
                                          </p>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="flex items-center gap-2 mb-1">
                                              <h4 className="text-sm font-bold text-slate-800 truncate flex-1">
                                                  {taskTitles[task.id] || t((task as any).titleKey)}
                                              </h4>
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleStartEdit(task.id, e);
                                                  }}
                                                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                                  title={t('ui.editName')}
                                              >
                                                  <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                          </div>
                                          <p className="text-xs text-slate-400">
                                              {t((task as any).dateKey)} · {task.type === 'highlight' ? t('ui.basicHighlight') : t('ui.advancedAnalysis')}
                                          </p>
                                      </>
                                  )}
                              </div>
                          </div>
                      </div>
                      {editingTaskId !== task.id && (
                          <div className="flex justify-end gap-2">
                              <button 
                                  onClick={() => {
                                      // Restart the task
                                      setTargetAnalysisType(task.type as any);
                                      setResultSport(task.cover);
                                      setTransferStep('downloading');
                                      setTransferProgress(0);
                                      pushView('home');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
                              >
                                  {t('ui.resubmit')}
                              </button>
                          </div>
                      )}
                  </div>
              ))}

           </section>

         ) : null}

         {/* Cloud Task Queue */}
         {(analyzingTasks.length > 0 || queuedTasks.length > 0) && (
           <section className="mb-4">
             <div className="flex items-center justify-between mb-3 px-1">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('ui.cloudQueue')}</h3>
               <div className="flex items-center gap-3 text-xs">
                 <span className="text-blue-600 font-bold">{t('ui.analyzingCountLabel', { current: analyzingCount, max: maxConcurrentTasks })}</span>
                 {queuedTasks.length > 0 && <span className="text-yellow-600 font-bold">{t('ui.queuedCount', { count: queuedTasks.length })}</span>}
               </div>
             </div>

             {/* Analyzing Tasks */}
             {analyzingTasks.length > 0 && (
               <div className="space-y-2 mb-3">
                {analyzingTasks.map((task: CloudTask) => (
                   <div key={task.id} className="rounded-xl p-3 bg-white border border-blue-100 shadow-sm">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2 flex-1 min-w-0">
                         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                           {task.type === 'highlight' ? <Film className="w-4 h-4 text-blue-600" /> : <BarChart3 className="w-4 h-4 text-blue-600" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="text-sm font-bold text-slate-800 truncate">{task.videoName}</div>
                           <div className="text-xs text-slate-400">{task.type === 'highlight' ? t('ui.smartHighlight') : t('ui.advancedAnalysis')}</div>
                         </div>
                       </div>
                       <span className="text-sm font-black text-blue-600">{Math.round(task.progress)}%</span>
                     </div>
                     <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${task.progress}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {/* Queued Tasks */}
             {queuedTasks.length > 0 && (
               <div className="space-y-2">
                {queuedTasks.map((task: CloudTask) => (
                   <div key={task.id} className="rounded-xl p-3 bg-white border border-yellow-100 shadow-sm">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 flex-1 min-w-0">
                         <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                           {task.type === 'highlight' ? <Film className="w-4 h-4 text-yellow-600" /> : <BarChart3 className="w-4 h-4 text-yellow-600" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="text-sm font-bold text-slate-800 truncate">{task.videoName}</div>
                           <div className="text-xs text-slate-400">{task.type === 'highlight' ? t('ui.smartHighlight') : t('ui.advancedAnalysis')}</div>
                         </div>
                       </div>
                       <div className="text-xs font-bold text-yellow-600">
                         {t('ui.queuePosition', { n: task.queuePosition })}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </section>
         )}

         {/* Local drafts (same source as 工具箱「我的项目」卡片) */}

         {DRAFT_TASKS.length > 0 && (
           <section className="mb-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">{t('ui.assetFilter_drafts')}</h3>
             <div className="space-y-3">
               {DRAFT_TASKS.map((draft: { id: string; titleKey: string; dateKey: string; progress: string; cover: string }) => (
                 <button
                   key={draft.id}
                   type="button"
                   onClick={() => {
                     setToastMessage(t('ui.draftContinueHint'));
                     setTimeout(() => setToastMessage(null), 2500);
                   }}
                   className="w-full text-left bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-amber-100 active:scale-[0.98] transition-transform"
                 >
                   <div className="w-14 h-14 rounded-lg flex items-center justify-center text-white shrink-0 bg-gradient-to-br from-amber-400 to-orange-600">
                     <FileEdit className="w-6 h-6" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       <h4 className="text-sm font-bold text-slate-800 truncate">{t(draft.titleKey as any)}</h4>
                       <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{t('ui.assetBadgeDraft')}</span>
                     </div>
                     <p className="text-xs text-slate-400">
                       {t(draft.dateKey as any)} · {draft.progress}
                     </p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                 </button>
               ))}
             </div>
           </section>
         )}

         {/* Completed / failed analysis jobs (cloud 成片与报告) */}

         <section>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">{t('ui.analysisHistory')}</h3>

            <div className="space-y-3">

                {analysisHistoryRows.map((task: any) => {

                    const statusConfig = {
                        completed: { label: t('ui.completed'), bg: 'bg-green-100', text: 'text-green-700' },
                        failed: { label: t('ui.failed'), bg: 'bg-red-100', text: 'text-red-700' },
                        paused: { label: t('ui.paused'), bg: 'bg-yellow-100', text: 'text-yellow-700' }
                    };

                    const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.completed;

                    return (
                        <div 
                            key={task.id} 
                            onClick={() => { 
                                if (task.status === 'completed' && editingTaskId !== task.id) {
                                    setTargetAnalysisType(task.type as any); 
                                    setAiMode('cloud'); 
                                    setIsTaskCompleted(true); 
                                    setResultSport(task.cover); 
                                    pushView(task.type === 'highlight' ? 'ai_result_highlight' : 'ai_result_analysis'); 
                                }
                            }} 
                            className={`bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border ${task.status === 'failed' ? 'border-red-100' : task.status === 'paused' ? 'border-yellow-100' : 'border-slate-100'} ${task.status === 'completed' && editingTaskId !== task.id ? 'active:scale-95 transition-transform cursor-pointer' : 'opacity-75'}`}
                        >
                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-white shrink-0 ${task.status === 'failed' ? 'bg-red-500/80' : task.status === 'paused' ? 'bg-yellow-500/80' : (task.type === 'highlight' ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600')}`}>
                                {task.status === 'failed' ? <AlertTriangle className="w-6 h-6" /> : task.status === 'paused' ? <Minimize2 className="w-6 h-6" /> : (task.type === 'highlight' ? <Film className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />)}
                            </div>

                            <div className="flex-1 min-w-0">
                                {editingTaskId === task.id ? (
                                    <div className="mb-1" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                type="text"
                                                defaultValue={taskTitles[task.id] || t((task as any).titleKey)}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveEdit(task.id, e.currentTarget.value);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEdit();
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    handleSaveEdit(task.id, e.currentTarget.value);
                                                }}
                                                className="flex-1 text-sm font-bold px-2 py-1.5 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const input = e.currentTarget.parentElement?.querySelector('input');
                                                    if (input) {
                                                        handleSaveEdit(task.id, input.value);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors shrink-0"
                                            >
                                                {t('ui.save')}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelEdit();
                                                }}
                                                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 transition-colors shrink-0"
                                            >
                                                {t('ui.cancel')}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{t((task as any).dateKey)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{task.type === 'highlight' ? t('ui.basicHighlight') : t('ui.advancedAnalysis')}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`text-sm font-bold truncate flex-1 ${task.status === 'failed' ? 'text-red-800' : task.status === 'paused' ? 'text-yellow-800' : 'text-slate-800'}`}>
                                                {taskTitles[task.id] || t((task as any).titleKey)}
                                            </h4>
                                            <button
                                                onClick={(e) => handleStartEdit(task.id, e)}
                                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                                title={t('ui.editName')}
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{t((task as any).dateKey)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{task.type === 'highlight' ? t('ui.basicHighlight') : t('ui.advancedAnalysis')}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {editingTaskId !== task.id && (
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className={`${status.bg} ${status.text} text-[9px] font-bold px-1.5 py-0.5 rounded`}>{status.label}</span>
                                    {task.status === 'completed' && <ChevronRight className="w-4 h-4 text-slate-300" />}
                                </div>
                            )}
                        </div>
                    );
                })}

                {analysisHistoryRows.length === 0 && <div className="text-center text-slate-400 py-8 text-xs">{t('ui.noHistory')}</div>}

            </div>

         </section>

      </div>

    </div>

  );

};

const MediaPickerScreen = () => {

  const { t, popView, targetAnalysisType, setSportType, handleSelect, handleNext, selectedMedia, sportType, submitAiAnalysis } = useAppContext();
  const [aiDecisionPayload, setAiDecisionPayload] = useState<{ videoId: number; relatedIds: number[]; origin: 'gallery_badge' | 'video_detail' } | null>(null);
  const [detailVideoId, setDetailVideoId] = useState<number | null>(null);

  useEffect(() => {
    if (sportType !== 'soccer') {
      setSportType('soccer');
    }
  }, [sportType, setSportType]);

  const SPORTS_ROW = [
    { id: 'basketball' as const, labelKey: 'ui.sportBasketball', icon: CircleDot, activeClass: 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/50' },
    { id: 'soccer' as const, labelKey: 'ui.sportSoccer', icon: Hexagon, activeClass: 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50' },
  ];

  const recentMatches = ALL_VIDEOS.filter(
    (item) => item.type === 'video' && item.category === 'soccer'
  ).slice(0, 5);

  const filteredBySport = recentMatches.filter((item) => item.category === sportType);
  const groupedVideos = React.useMemo(() => {
    const groups = new Map<string, typeof filteredBySport>();
    filteredBySport.forEach((video) => {
      const key = String((video as any).dateKey);
      const existing = groups.get(key) || [];
      existing.push(video);
      groups.set(key, existing);
    });
    return Array.from(groups.entries()).map(([dateKey, videos]) => ({
      dateKey,
      videos: videos.sort((a, b) => (b.dateSuffix || '').localeCompare(a.dateSuffix || '')),
    }));
  }, [filteredBySport]);
  const detailVideo = detailVideoId != null ? ALL_VIDEOS.find((video) => video.id === detailVideoId) : null;

  const openAiDecision = (videoId: number, origin: 'gallery_badge' | 'video_detail') => {
    const relatedIds = inferSameMatchVideoIds(videoId);
    if (relatedIds.length > 1) {
      setAiDecisionPayload({ videoId, relatedIds, origin });
      return;
    }
    submitAiAnalysis([videoId], origin, 'single');
  };

  return (

    <div className="flex flex-col h-full bg-[#121212] text-white animate-in slide-in-from-bottom duration-300 relative z-50">

        <div className="h-12 flex items-center justify-between px-2 bg-[#1E1E1E] shrink-0">
          <button type="button" onClick={popView} className="p-3"><X className="w-6 h-6" /></button>
          <span className="text-sm font-bold">{targetAnalysisType === 'highlight' ? t('ui.selectVideoForHighlight') : t('ui.selectVideoForStats')}</span>
          <div className="w-12" />
        </div>

        <div className="bg-[#121212] pt-3 pb-2 px-4">
          <p className="text-[10px] text-slate-500 mb-2">{t('ui.pickerRecentHint')}</p>
          <div className="flex gap-2">
            {SPORTS_ROW.map((sport) => {
              const isSelected = sportType === sport.id;
              const Icon = sport.icon;
              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => { setSportType(sport.id); }}
                  className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${isSelected ? sport.activeClass : 'bg-[#1E1E1E] border-white/5 text-slate-500'}`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  <span className="text-xs font-bold">{t(sport.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-32 pt-2 space-y-4">
          {filteredBySport.length === 0 && (
            <div className="text-center text-slate-500 text-xs py-12">{t('ui.pickerNoMatches')}</div>
          )}
          {groupedVideos.map((group) => (
            <section key={group.dateKey} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{t(group.dateKey as any)}</span>
                <span className="text-[10px] text-slate-500">{group.videos.length} clips</span>
              </div>
              {group.videos.map((item) => {
                const isSelected = selectedMedia.includes(item.id);
                const srcLabel =
                  item.source === 'falcon' ? 'Falcon' : item.source === 'cloud' ? t('ui.sourceCloud') : t('ui.sourceLocal');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex gap-3 p-3 rounded-2xl border text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[#1E1E1E]'}`}
                  >
                    <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 relative">
                      <AssetThumbnail type="video" category={item.category as 'basketball' | 'soccer'} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAiDecision(item.id, 'gallery_badge');
                        }}
                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-orange-500 text-white shadow"
                      >
                        AI
                      </button>
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-sm font-bold text-white truncate">{t((item as any).labelKey)}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                        <span>{t((item as any).dateKey)}</span>
                        <span>{item.duration}</span>
                        <span className="text-slate-500">{srcLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailVideoId(item.id);
                        }}
                        className="mt-1 text-[10px] text-orange-400 font-bold text-left"
                      >
                        {t('ui.openVideoDetail')}
                      </button>
                    </div>
                  </button>
                );
              })}
              {group.videos.length > 1 && (
                <button
                  type="button"
                  onClick={() => submitAiAnalysis(group.videos.map((video) => video.id), 'gallery_aggregate', 'merge')}
                  className="w-full rounded-xl border border-orange-400/40 bg-orange-500/15 px-3 py-2 text-left"
                >
                  <p className="text-xs font-bold text-orange-300">{t('ui.aiAggregateCardTitle', { count: group.videos.length })}</p>
                  <p className="text-[10px] text-orange-100/80 mt-1">{t('ui.aiAggregateCardDesc')}</p>
                </button>
              )}
            </section>
          ))}
        </div>

        <div className="absolute bottom-0 w-full bg-[#1E1E1E] border-t border-white/10 pb-8 pt-3 px-4 min-h-[88px] flex items-center justify-between">
          <div className="text-xs text-gray-500 max-w-[45%]">
            {targetAnalysisType === 'highlight' ? t('ui.aiDetectHighlight') : t('ui.aiMineTactics')}
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedMedia.length === 0}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all shrink-0 ${selectedMedia.length > 0 ? (targetAnalysisType === 'highlight' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white') : 'bg-[#333] text-gray-500'}`}
          >
            {targetAnalysisType === 'highlight' ? t('ui.generateHighlight') : t('ui.startStats')}
          </button>
        </div>

        {aiDecisionPayload && (
          <div className="absolute inset-0 z-[70] flex items-end">
            <button type="button" className="absolute inset-0 bg-black/55" aria-label="close" onClick={() => setAiDecisionPayload(null)} />
            <div className="relative w-full rounded-t-3xl bg-[#1A1A1A] border-t border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-black text-white">{t('ui.aiDecisionTitle', { count: aiDecisionPayload.relatedIds.length })}</h3>
              <p className="text-[11px] text-slate-400">{t('ui.aiDecisionDesc')}</p>
              <button
                type="button"
                onClick={() => {
                  submitAiAnalysis([aiDecisionPayload.videoId], aiDecisionPayload.origin, 'single');
                  setAiDecisionPayload(null);
                }}
                className="w-full py-3 rounded-xl border border-white/10 text-white text-sm font-bold"
              >
                {t('ui.aiAnalyzeCurrentOnly')}
              </button>
              <button
                type="button"
                onClick={() => {
                  submitAiAnalysis(aiDecisionPayload.relatedIds, aiDecisionPayload.origin, 'merge');
                  setAiDecisionPayload(null);
                }}
                className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-bold"
              >
                {t('ui.aiAnalyzeMergeRecommended', { count: aiDecisionPayload.relatedIds.length })}
              </button>
            </div>
          </div>
        )}

        {detailVideo && (
          <div className="absolute inset-0 z-[75] bg-black text-white flex flex-col">
            <div className="h-12 flex items-center justify-between px-3 border-b border-white/10">
              <button type="button" onClick={() => setDetailVideoId(null)} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold truncate">{t((detailVideo as any).labelKey)}</span>
              <button type="button" className="p-2 text-slate-400"><Edit3 className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 relative bg-slate-900">
              <AssetThumbnail type="video" category={detailVideo.category as 'basketball' | 'soccer'} />
              <div className="absolute top-4 right-3 bg-black/50 px-2 py-1 rounded text-xs">{t('ui.videoSpeedBadge')}</div>
            </div>
            <div className="bg-black border-t border-white/10 px-4 py-3 flex items-center justify-between">
              <button type="button" className="flex flex-col items-center gap-1 text-white/90 text-xs">
                <Heart className="w-5 h-5" />
                <span>{t('ui.videoLike')}</span>
              </button>
              <button type="button" className="flex flex-col items-center gap-1 text-white/90 text-xs">
                <Trash2 className="w-5 h-5" />
                <span>{t('ui.videoDelete')}</span>
              </button>
              <button type="button" className="flex flex-col items-center gap-1 text-white/90 text-xs">
                <Download className="w-5 h-5" />
                <span>{t('ui.videoDownload')}</span>
              </button>
              <button
                type="button"
                onClick={() => openAiDecision(detailVideo.id, 'video_detail')}
                className="flex flex-col items-center gap-1 text-orange-400 text-xs"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t('ui.aiEntryLabel')}</span>
              </button>
            </div>
          </div>
        )}

    </div>

  );

};

const GalleryScreen = () => {
  const {
    t,
    popView,
    pushView,
    setTargetAnalysisType,
    setAiMode,
    setIsTaskCompleted,
    setResultSport,
    setSelectionMode,
    setSportType,
    submitAiAnalysis,
    cloudTasks,
    analysisPipeline,
    setGalleryHybridDemoView,
    liveSoccerStats,
  } = useAppContext();
  const [sourceTab, setSourceTab] = useState<VideoSource>(() => mediaPickerSessionState.sourceTab);
  const [typeTab, setTypeTab] = useState<'all' | 'video' | 'image' | 'collect'>(() => mediaPickerSessionState.typeTab);
  const [detailVideoId, setDetailVideoId] = useState<number | null>(() => mediaPickerSessionState.detailVideoId);
  const [detailFromAnalyzedCard, setDetailFromAnalyzedCard] = useState(false);
  const [detailAnalyzedType, setDetailAnalyzedType] = useState<'highlight' | 'analysis'>('analysis');
  const [aiDecisionPayload, setAiDecisionPayload] = useState<{ videoId: number; relatedIds: number[] } | null>(null);
  /** 第四条路线：相册详情 / 合并决策后，选择「本地快析」或「云端深析」 */
  const [hybridAnalysisTierSheet, setHybridAnalysisTierSheet] = useState<
    null | { videoIds: number[]; mode: 'single' | 'merge' }
  >(null);

  useEffect(() => {
    mediaPickerSessionState = {
      sourceTab,
      typeTab,
      detailVideoId,
    };
  }, [sourceTab, typeTab, detailVideoId]);

  const soccerVideos = React.useMemo(() => {
    const bySport = ALL_VIDEOS.filter((video) => video.category === 'soccer');
    return bySport.filter((video) => {
      if (sourceTab !== 'all' && video.source !== sourceTab) return false;
      if (typeTab === 'video') return video.type === 'video';
      if (typeTab === 'image') return false;
      if (typeTab === 'collect') return false;
      return true;
    });
  }, [sourceTab, typeTab]);
  const groupedVideos = React.useMemo(() => {
    const groups = new Map<string, typeof soccerVideos>();
    soccerVideos.forEach((video) => {
      const key = String((video as any).dateKey);
      const existing = groups.get(key) || [];
      existing.push(video);
      groups.set(key, existing);
    });
    return Array.from(groups.entries()).map(([dateKey, videos]) => ({
      dateKey,
      videos: videos.sort((a, b) => (b.dateSuffix || '').localeCompare(a.dateSuffix || '')),
    }));
  }, [soccerVideos]);
  const successCards = React.useMemo(() => {
    if (!(typeTab === 'all' || typeTab === 'video')) return [];
    return GALLERY_ANALYSIS_SUCCESS_CARDS.filter((card) => {
      if (sourceTab !== 'all' && card.source !== sourceTab) return false;
      return true;
    });
  }, [sourceTab, typeTab]);
  const latestTaskByVideoId = React.useMemo(() => {
    const sorted = [...(cloudTasks || [])].sort((a: CloudTask, b: CloudTask) => b.createdAt - a.createdAt);
    const map = new Map<number, CloudTask>();
    sorted.forEach((task: CloudTask) => {
      if (!map.has(task.videoId)) map.set(task.videoId, task);
    });
    return map;
  }, [cloudTasks]);
  const activeTaskCount = React.useMemo(
    () => (cloudTasks || []).filter((task: CloudTask) => ['uploading', 'queued', 'analyzing'].includes(task.status)).length,
    [cloudTasks]
  );

  const openAnalyzedResult = (analysisType: 'highlight' | 'analysis') => {
    setTargetAnalysisType(analysisType);
    setAiMode('cloud');
    setIsTaskCompleted(true);
    setResultSport('soccer');
    pushView(analysisType === 'highlight' ? 'ai_result_highlight' : 'ai_result_analysis');
  };
  const detailVideo = detailVideoId != null ? ALL_VIDEOS.find((video) => video.id === detailVideoId) : null;

  const queueHybridOrSubmit = (videoIds: number[], mode: 'single' | 'merge') => {
    setTargetAnalysisType('highlight');
    setSelectionMode(mode === 'merge' ? 'multiple' : 'single');
    setSportType('soccer');
    setAiDecisionPayload(null);
    if (analysisPipeline === 'edge_cloud_hybrid') {
      setHybridAnalysisTierSheet({ videoIds, mode });
      return;
    }
    submitAiAnalysis(videoIds, 'video_detail', mode);
  };

  const getVideoTaskMeta = (videoId: number) => {
    const task = latestTaskByVideoId.get(videoId);
    if (!task) return { task: null as CloudTask | null, label: 'AI', className: 'bg-orange-500 text-white', action: 'start' as const };
    if (task.status === 'completed') return { task, label: t('gallery.viewAnalysis'), className: 'bg-emerald-500 text-white', action: 'view' as const };
    if (task.status === 'failed') return { task, label: t('ui.retry'), className: 'bg-rose-500 text-white', action: 'retry' as const };
    if (task.status === 'paused') return { task, label: t('ui.paused'), className: 'bg-amber-500 text-white', action: 'progress' as const };
    if (task.status === 'queued') return { task, label: t('ui.cloudStatus_queued'), className: 'bg-slate-700 text-white', action: 'progress' as const };
    return { task, label: `${t('ui.analyzing')} ${Math.round(task.progress)}%`, className: 'bg-blue-600 text-white', action: 'progress' as const };
  };
  const openAiDecision = (videoId: number) => {
    const relatedIds = inferSameMatchVideoIds(videoId);
    if (relatedIds.length > 1) {
      setAiDecisionPayload({ videoId, relatedIds });
      return;
    }
    queueHybridOrSubmit([videoId], 'single');
  };

  const openHybridGalleryEdgeResult = () => {
    setGalleryHybridDemoView('edge_result');
    setTargetAnalysisType('analysis');
    setAiMode('cloud');
    setIsTaskCompleted(true);
    setResultSport('soccer');
    pushView('ai_result_analysis');
  };

  const openHybridGalleryCloudResult = () => {
    setGalleryHybridDemoView('cloud_result');
    setTargetAnalysisType('analysis');
    setAiMode('cloud');
    setIsTaskCompleted(true);
    setResultSport('soccer');
    pushView('ai_result_analysis');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <div className="pt-10 px-4 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          {([
            { id: 'falcon', label: 'Falcon' },
            { id: 'local', label: 'Local' },
            { id: 'cloud', label: 'Cloud' },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSourceTab(item.id)}
              className={`text-[16px] font-semibold pb-1 border-b-2 ${sourceTab === item.id ? 'text-slate-800 border-orange-500' : 'text-slate-400 border-transparent'}`}
            >
              {item.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => pushView('task_center')}
              className="relative w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              title={t('ui.historyTasksHint')}
            >
              <Clock className="w-4 h-4" />
              {activeTaskCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-orange-500 text-white text-[9px] leading-[14px] text-center font-bold">
                  {activeTaskCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => pushView('transfer_list')}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              title={t('transferList.title')}
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {([
            { id: 'all', key: 'ui.mediaAll' },
            { id: 'video', key: 'ui.mediaVideo' },
            { id: 'image', key: 'ui.mediaImage' },
            { id: 'collect', key: 'ui.assetFilter_outputs' },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTypeTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${typeTab === item.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-5">
        {analysisPipeline === 'edge_cloud_hybrid' && (
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide px-0.5">
              {t('gallery.hybridRouteSectionTitle')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={openHybridGalleryEdgeResult}
                className="rounded-xl overflow-hidden border border-emerald-200 bg-white text-left shadow-sm aspect-[4/5] flex flex-col"
              >
                <div className="relative flex-1 min-h-0">
                  <AssetThumbnail type="video" category="soccer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-emerald-500/90 flex items-center justify-center border border-white/30">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="px-2 py-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-900 leading-tight">{t('gallery.hybridCardEdgeTitle')}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{t('gallery.hybridCardEdgeSub')}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={openHybridGalleryCloudResult}
                className="rounded-xl overflow-hidden border border-indigo-200 bg-white text-left shadow-sm aspect-[4/5] flex flex-col"
              >
                <div className="relative flex-1 min-h-0">
                  <AssetThumbnail type="video" category="soccer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-indigo-500/90 flex items-center justify-center border border-white/30">
                    <Cloud className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="px-2 py-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-900 leading-tight">{t('gallery.hybridCardCloudTitle')}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{t('gallery.hybridCardCloudSub')}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailVideoId(HYBRID_GALLERY_DETAIL_VIDEO_ID);
                  setDetailFromAnalyzedCard(false);
                }}
                className="rounded-xl overflow-hidden border border-orange-200 bg-white text-left shadow-sm aspect-[4/5] flex flex-col"
              >
                <div className="relative flex-1 min-h-0">
                  <AssetThumbnail type="video" category="soccer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-orange-500/90 flex items-center justify-center border border-white/30">
                    <PlayCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="px-2 py-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-900 leading-tight">{t('gallery.hybridCardDetailTitle')}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{t('gallery.hybridCardDetailSub')}</p>
                </div>
              </button>
            </div>
          </section>
        )}
        {groupedVideos.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-10">{t('ui.pickerNoMatches')}</div>
        )}
        {groupedVideos.map((group) => (
          <section key={group.dateKey} className="space-y-2">
            {(() => {
              const localGroupVideos = group.videos.filter((video) => video.source === 'local');
              const showLocalAggregate = sourceTab === 'local' && localGroupVideos.length > 1;
              return (
                <>
            <div className="flex items-center justify-between">
              <h3 className="text-[34px] leading-none text-slate-500 font-medium">{t(group.dateKey as any)}</h3>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {successCards
                .filter((card) => card.dateKey === group.dateKey)
                .map((card) => {
                  const cardVideo = ALL_VIDEOS.find((video) => video.id === card.videoId);
                  const isSoccerCard = cardVideo?.category === 'soccer';
                  const scoreA = isSoccerCard ? liveSoccerStats.teamA.score : card.teamAScore;
                  const scoreB = isSoccerCard ? liveSoccerStats.teamB.score : card.teamBScore;
                  const nameA = isSoccerCard
                    ? (liveSoccerStats.teamA as { displayLabel: string }).displayLabel
                    : t(card.teamANameKey);
                  const nameB = isSoccerCard
                    ? (liveSoccerStats.teamB as { displayLabel: string }).displayLabel
                    : t(card.teamBNameKey);
                  return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      if (card.isAnalyzed) {
                        openAnalyzedResult(card.analysisType);
                        return;
                      }
                      setDetailVideoId(card.videoId);
                      setDetailFromAnalyzedCard(true);
                      setDetailAnalyzedType(card.analysisType);
                    }}
                    className="relative w-full rounded-xl overflow-hidden border border-emerald-200 bg-white text-left shadow-sm aspect-[16/8.5]"
                  >
                    <AssetThumbnail type="video" category="soccer" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A3C]/94 via-[#12324A]/78 to-black/52" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (card.isAnalyzed) {
                          openAnalyzedResult(card.analysisType);
                          return;
                        }
                        setTargetAnalysisType('highlight');
                        setSelectionMode('single');
                        setSportType('soccer');
                        submitAiAnalysis([card.videoId], 'gallery_badge', 'single');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-black bg-emerald-500 text-white"
                    >
                      {card.isAnalyzed ? t('gallery.viewAnalysis') : 'AI'}
                    </button>
                    <div className="absolute inset-0 p-3 text-white flex flex-col">
                      <div className="text-[10px] font-semibold text-white/85">{t('gallery.analysisReady')}</div>
                      <div className="flex-1 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-end gap-1.5">
                          <span className="text-[12px] font-bold truncate max-w-[80px]">{nameA}</span>
                          <span className="text-[30px] font-black leading-none">{scoreA}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-[28px] font-black leading-none">:</div>
                          <div className="text-[9px] font-bold text-white/70 mt-0.5">VS</div>
                        </div>
                        <div className="min-w-0 flex items-end gap-1.5 justify-end">
                          <span className="text-[12px] font-bold truncate max-w-[80px]">{nameB}</span>
                          <span className="text-[30px] font-black leading-none">{scoreB}</span>
                        </div>
                      </div>
                      <div className="h-3" />
                    </div>
                    <div className="absolute inset-0 pointer-events-none border border-white/16 rounded-xl" />
                  </button>
                  );
                })}
              {group.videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => {
                    const taskMeta = getVideoTaskMeta(video.id);
                    if (taskMeta.action === 'view' && taskMeta.task) {
                      openAnalyzedResult((taskMeta.task.type || 'highlight') as 'highlight' | 'analysis');
                      return;
                    }
                    setDetailVideoId(video.id);
                    setDetailFromAnalyzedCard(false);
                  }}
                  className="relative w-full rounded-xl overflow-hidden aspect-[16/8.5] text-left"
                >
                  <AssetThumbnail type="video" category={video.category as 'basketball' | 'soccer'} />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A3C]/55 via-[#12324A]/30 to-black/25" />
                  {(() => {
                    const taskMeta = getVideoTaskMeta(video.id);
                    return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (taskMeta.action === 'view') {
                        openAnalyzedResult((taskMeta.task?.type || 'highlight') as 'highlight' | 'analysis');
                        return;
                      }
                      if (taskMeta.action === 'progress') {
                        pushView('task_center');
                        return;
                      }
                      openAiDecision(video.id);
                    }}
                    className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-black ${taskMeta.className}`}
                  >
                    {taskMeta.label}
                  </button>
                    );
                  })()}
                  <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between text-white">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Heart className="w-4 h-4 fill-white stroke-white" />
                        <span className="text-[11px] font-semibold truncate max-w-[160px]">{t((video as any).labelKey)}</span>
                      </div>
                      <span className="text-[10px] text-white/75">{t('ui.aiEntryLabel')}</span>
                    </div>
                    <span className="text-[11px] font-semibold">{video.duration}</span>
                  </div>
                </button>
              ))}
            </div>
            {showLocalAggregate && (
              <div className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 truncate">
                        {t('ui.aiAggregateCardTitle', { count: localGroupVideos.length })}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t('ui.aiAggregateCardDesc')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetAnalysisType('highlight');
                      setSelectionMode('multiple');
                      setSportType('soccer');
                      submitAiAnalysis(localGroupVideos.map((video) => video.id), 'gallery_aggregate', 'merge');
                    }}
                    className="px-2 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold shrink-0"
                  >
                    {t('ui.aiAnalyzeMergeRecommended', { count: localGroupVideos.length })}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {localGroupVideos.slice(0, 2).map((video) => (
                    <button
                      key={`agg-${video.id}`}
                      type="button"
                      onClick={() => {
                        const taskMeta = getVideoTaskMeta(video.id);
                        if (taskMeta.action === 'view' && taskMeta.task) {
                          openAnalyzedResult((taskMeta.task.type || 'highlight') as 'highlight' | 'analysis');
                          return;
                        }
                        setDetailVideoId(video.id);
                        setDetailFromAnalyzedCard(false);
                      }}
                      className="relative rounded-lg overflow-hidden aspect-[16/10] text-left"
                    >
                      <AssetThumbnail type="video" category={video.category as 'basketball' | 'soccer'} />
                      <div className="absolute left-2 right-2 bottom-1.5 flex items-end justify-between text-white">
                        <span className="text-[9px] font-semibold truncate max-w-[65%]">{t((video as any).labelKey)}</span>
                        <span className="text-[9px] font-semibold">{video.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
                </>
              );
            })()}
          </section>
        ))}
      </div>

      <div className="h-[83px] bg-white border-t border-slate-100 flex justify-around items-end pb-6 pt-2 px-1">
        <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><Home className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.home')}</span></div>
        <button type="button" className="flex flex-col items-center gap-1 text-orange-500 w-14 mb-1"><ImageIcon className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.gallery')}</span></button>
        <div className="flex flex-col items-center justify-end -mt-6">
          <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-900/20 border-[3px] border-white mb-1"><Camera className="w-6 h-6" /></div>
          <span className="text-[10px] font-bold text-slate-900">{t('nav.shoot')}</span>
        </div>
        <button type="button" onClick={popView} className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><CreditCard className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.toolbox')}</span></button>
        <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><User className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.my')}</span></div>
      </div>

      {detailVideo && (
        <div className="absolute inset-0 z-[75] bg-black text-white flex flex-col">
          <div className="h-12 flex items-center justify-between px-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setDetailVideoId(null);
                setHybridAnalysisTierSheet(null);
              }}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold truncate">{t((detailVideo as any).labelKey)}</span>
            <button type="button" className="p-2 text-slate-400"><Edit3 className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 relative bg-slate-900">
            <AssetThumbnail type="video" category={detailVideo.category as 'basketball' | 'soccer'} />
            <div className="absolute top-4 right-3 bg-black/50 px-2 py-1 rounded text-xs">{t('ui.videoSpeedBadge')}</div>
          </div>
          <div className="bg-black border-t border-white/10 px-4 py-3 flex items-center justify-between">
            <button type="button" className="flex flex-col items-center gap-1 text-white/90 text-xs">
              <Heart className="w-5 h-5" />
              <span>{t('ui.videoLike')}</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1 text-white/90 text-xs">
              <Trash2 className="w-5 h-5" />
              <span>{t('ui.videoDelete')}</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1 text-white/90 text-xs">
              <Download className="w-5 h-5" />
              <span>{t('ui.videoDownload')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (detailFromAnalyzedCard) {
                  openAnalyzedResult(detailAnalyzedType);
                  return;
                }
                const taskMeta = getVideoTaskMeta(detailVideo.id);
                if (taskMeta.action === 'view') {
                  openAnalyzedResult((taskMeta.task?.type || 'highlight') as 'highlight' | 'analysis');
                  return;
                }
                if (taskMeta.action === 'progress') {
                  pushView('task_center');
                  return;
                }
                openAiDecision(detailVideo.id);
              }}
              className="flex flex-col items-center gap-1 text-orange-400 text-xs"
            >
              <Sparkles className="w-5 h-5" />
              <span>{getVideoTaskMeta(detailVideo.id).label}</span>
            </button>
          </div>
        </div>
      )}

      {aiDecisionPayload && (
        <div className="absolute inset-0 z-[80] flex items-end">
          <button type="button" className="absolute inset-0 bg-black/55" onClick={() => setAiDecisionPayload(null)} />
          <div className="relative w-full rounded-t-3xl bg-[#1A1A1A] border-t border-white/10 p-4 space-y-3">
            <h3 className="text-sm font-black text-white">{t('ui.aiDecisionTitle', { count: aiDecisionPayload.relatedIds.length })}</h3>
            <p className="text-[11px] text-slate-400">{t('ui.aiDecisionDesc')}</p>
            <button
              type="button"
              onClick={() => {
                queueHybridOrSubmit([aiDecisionPayload.videoId], 'single');
              }}
              className="w-full py-3 rounded-xl border border-white/10 text-white text-sm font-bold"
            >
              {t('ui.aiAnalyzeCurrentOnly')}
            </button>
            <button
              type="button"
              onClick={() => {
                queueHybridOrSubmit(aiDecisionPayload.relatedIds, 'merge');
              }}
              className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-bold"
            >
              {t('ui.aiAnalyzeMergeRecommended', { count: aiDecisionPayload.relatedIds.length })}
            </button>
          </div>
        </div>
      )}

      {hybridAnalysisTierSheet && analysisPipeline === 'edge_cloud_hybrid' && (
        <div className="absolute inset-0 z-[85] flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setHybridAnalysisTierSheet(null)}
            aria-label={t('gallery.hybridTierCancel')}
          />
          <div className="relative w-full max-w-md rounded-t-[22px] bg-gradient-to-b from-[#0f172a] to-[#0a1628] border-t border-emerald-500/20 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] px-4 pt-4 pb-8">
            <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mb-4" />
            <h3 className="text-[15px] font-black text-white text-center leading-snug">{t('gallery.hybridTierSheetTitle')}</h3>
            <p className="text-[11px] text-slate-400 text-center mt-1.5 mb-4 px-1">{t('gallery.hybridTierSheetSubtitle')}</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const payload = hybridAnalysisTierSheet;
                  setHybridAnalysisTierSheet(null);
                  submitAiAnalysis(payload.videoIds, 'video_detail', payload.mode, 'local_fast');
                }}
                className="w-full text-left rounded-2xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-3.5 active:scale-[0.99] transition-transform"
              >
                <p className="text-[14px] font-black text-emerald-100">{t('gallery.hybridTierLocalTitle')}</p>
                <p className="text-[11px] text-emerald-100/75 mt-1 leading-relaxed">{t('gallery.hybridTierLocalDesc')}</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const payload = hybridAnalysisTierSheet;
                  setHybridAnalysisTierSheet(null);
                  submitAiAnalysis(payload.videoIds, 'video_detail', payload.mode, 'cloud_deep');
                }}
                className="w-full text-left rounded-2xl border border-indigo-400/40 bg-indigo-950/50 px-4 py-3.5 relative overflow-hidden active:scale-[0.99] transition-transform ring-1 ring-indigo-400/25"
              >
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-500 text-white shadow-sm">
                  {t('gallery.hybridTierRecommend')}
                </span>
                <p className="text-[14px] font-black text-indigo-100 pr-16">{t('gallery.hybridTierCloudTitle')}</p>
                <p className="text-[11px] text-indigo-100/80 mt-1 leading-relaxed">{t('gallery.hybridTierCloudDesc')}</p>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setHybridAnalysisTierSheet(null)}
              className="w-full mt-4 py-2.5 text-[12px] font-semibold text-slate-500"
            >
              {t('gallery.hybridTierCancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskSubmittedScreen = () => {

    const {
      t,
      targetAnalysisType,
      popToHome,
      setIsTaskCompleted,
      pushView,
      setPostRecordModalPayload,
      setShowPostRecordCloudModal,
      addCloudTask,
      setTransferStep,
      setTransferProgress,
      setResultSport,
    } = useAppContext();

    const handleCloudCta = () => {
      setPostRecordModalPayload({
        cloudAlreadyQueued: false,
        videoId: 999,
        videoName: t('videos.fridayGame'),
        analysisType: targetAnalysisType || 'highlight',
        sport: 'basketball',
      });
      addCloudTask(999, t('videos.fridayGame'), targetAnalysisType || 'highlight');
      setTransferStep('uploading');
      setTransferProgress(0);
      popToHome();
    };

    return (
      <div className="flex flex-col h-full bg-slate-900 text-white p-6 animate-in zoom-in-95 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-pulse ${targetAnalysisType === 'highlight' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}
          >
            {targetAnalysisType === 'highlight' ? <Film className="w-12 h-12" /> : <ScanLine className="w-12 h-12" />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('taskSubmitted.processingTitle')}</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{t('taskSubmitted.processingDesc')}</p>
          <div className="w-full bg-[#1E293B] rounded-2xl border border-white/10 p-4 text-left mb-6">
            <h3 className="text-xs font-bold text-slate-300 mb-2">{t('taskSubmitted.cloudCardTitle')}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{t('taskSubmitted.cloudCardDesc')}</p>
            <button
              type="button"
              onClick={handleCloudCta}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              {t('taskSubmitted.cloudCta')}
            </button>
          </div>
        </div>
        <div className="space-y-2 pb-4">
          <button
            type="button"
            onClick={() => {
              setIsTaskCompleted(true);
              setResultSport('soccer');
              pushView(targetAnalysisType === 'highlight' ? 'ai_result_highlight' : 'ai_result_analysis');
            }}
            className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-full active:scale-95 transition-transform"
          >
            {t('taskSubmitted.previewResult')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsTaskCompleted(true);
              popToHome();
            }}
            className="w-full text-slate-400 text-sm font-bold py-2"
          >
            {t('ui.backToHome')}
          </button>
        </div>
      </div>
    );

};

// --- Updated Highlight Result Screen (Unified Structure) ---

const HighlightResultScreen = () => {

    const { t, popToHome, replaceView, resultSport, setProgressModal, pushView, setShowShareModal, setShareType, setMergedVideoUrl, setSelectedEventForClaim, setShowPlayerSelector, eventClaims, setEventClaims, setToastMessage, isVip, setShareContext, highlightEntryIntent, setHighlightEntryIntent, setShowUpsellModal, liveSoccerStats } = useAppContext();

    const [showComposeTemplateModal, setShowComposeTemplateModal] = useState(false);

    const [selectedCollection, setSelectedCollection] = useState('full');

    const [selectedFilter, setSelectedFilter] = useState<EventFilterType>('all');

    // Player filter state for basic version
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

    const [currentTime, setCurrentTime] = useState('00:00');

    const [showJumpToast, setShowJumpToast] = useState(false);

    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const [selectedClipIds, setSelectedClipIds] = useState<number[]>([]);

    const [activeTab, setActiveTab] = useState<'clips' | 'stats'>('stats');

    

    // --- Heatmap Mode State for Basic Version ---
    const [heatmapMode, setHeatmapMode] = useState<'both' | 'teamA' | 'teamB'>('both');

    // Player marking dropdown state
    const [openPlayerMenuId, setOpenPlayerMenuId] = useState<number | null>(null);
    // Event type correction dropdown state
    const [openTypeMenuId, setOpenTypeMenuId] = useState<number | null>(null);
    type DropdownRect = { top?: number; bottom?: number; left: number; minWidth: number; placement: 'above' | 'below' };
    const playerTriggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const typeTriggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const [playerDropdownRect, setPlayerDropdownRect] = useState<DropdownRect | null>(null);
    const [typeDropdownRect, setTypeDropdownRect] = useState<DropdownRect | null>(null);

    // Determine which clips to show based on sport context

    const initialClips = AI_CLIPS_ADVANCED.filter(clip => clip.sport === (resultSport || 'soccer'));

    const [clips, setClips] = useState(initialClips);

    const [editingClipId, setEditingClipId] = useState<number | null>(null);
    const [editingDuration, setEditingDuration] = useState<number>(0); // Duration in seconds

    // Update clips when sport changes (in case of context switch)

    useEffect(() => {

        setClips(AI_CLIPS_ADVANCED.filter(clip => clip.sport === (resultSport || 'soccer')));

    }, [resultSport]);

    useEffect(() => {
        if (highlightEntryIntent === 'none') return;
        const intent = highlightEntryIntent;
        setHighlightEntryIntent('none');
        if (intent === 'template_compose') {
            setShowComposeTemplateModal(true);
        } else if (intent === 'merge_export') {
            setIsSelectionMode(true);
            setActiveTab('clips');
            setToastMessage(t('toolbox.mergeExportHint'));
            setTimeout(() => setToastMessage(null), 3500);
        } else if (intent === 'manual_edit') {
            setActiveTab('clips');
            setToastMessage(t('toolbox.manualEditHint'));
            setTimeout(() => setToastMessage(null), 3500);
        }
    }, [highlightEntryIntent, setHighlightEntryIntent, t, setToastMessage]);

    // Extract unique players (labels) from eventClaims + clip.player for filter
    const availablePlayers = Array.from(new Set(
        clips.flatMap(clip => {
          const L = (eventClaims[clip.id] ?? clip.player) as string | null | undefined;
          return L && L.trim() ? [L.trim()] : [];
        })
    )).sort();

    // Reset player filter if selected player is no longer available
    useEffect(() => {
        if (selectedPlayer && selectedPlayer !== 'all' && !availablePlayers.includes(selectedPlayer)) {
            setSelectedPlayer(null);
        }
    }, [availablePlayers, selectedPlayer]);

    // Close correction menus (player / type) when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const insideAny = target.closest('[data-correction-menu]');
            if ((openPlayerMenuId !== null || openTypeMenuId !== null) && !insideAny) {
                setOpenPlayerMenuId(null);
                setOpenTypeMenuId(null);
                setPlayerDropdownRect(null);
                setTypeDropdownRect(null);
            }
        };
        if (openPlayerMenuId !== null || openTypeMenuId !== null) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openPlayerMenuId, openTypeMenuId]);

    // Compute Portal dropdown position when player menu opens; clear on close
    useEffect(() => {
        const measure = (refs: Record<number, HTMLButtonElement | null>, id: number | null, setRect: (r: DropdownRect | null) => void, maxH: number, minW: number) => {
            if (id == null) {
                setRect(null);
                return;
            }
            const el = refs[id];
            if (!el) {
                setRect(null);
                return;
            }
            const run = () => {
                const r = el.getBoundingClientRect();
                const w = Math.max(r.width, minW);
                const spaceBelow = window.innerHeight - r.bottom;
                const spaceAbove = r.top;
                const preferBelow = spaceBelow >= maxH || spaceBelow >= spaceAbove;
                if (preferBelow) {
                    setRect({ top: r.bottom + 4, left: r.left, minWidth: w, placement: 'below' });
                } else {
                    setRect({ bottom: window.innerHeight - r.top + 4, left: r.left, minWidth: w, placement: 'above' });
                }
            };
            requestAnimationFrame(run);
        };
        if (openPlayerMenuId != null) {
            measure(playerTriggerRefs.current, openPlayerMenuId, setPlayerDropdownRect, 200, 120);
        } else {
            setPlayerDropdownRect(null);
        }
        if (openTypeMenuId != null) {
            measure(typeTriggerRefs.current, openTypeMenuId, setTypeDropdownRect, 200, 120);
        } else {
            setTypeDropdownRect(null);
        }
    }, [openPlayerMenuId, openTypeMenuId]);

    // Close correction menus on scroll (Portal dropdowns would otherwise get detached)
    useEffect(() => {
        const onScroll = () => {
            if (openPlayerMenuId !== null) {
                setOpenPlayerMenuId(null);
                setPlayerDropdownRect(null);
            }
            if (openTypeMenuId !== null) {
                setOpenTypeMenuId(null);
                setTypeDropdownRect(null);
            }
        };
        const scrollEl = document.querySelector('[data-correction-scroll]');
        if (scrollEl && (openPlayerMenuId !== null || openTypeMenuId !== null)) {
            scrollEl.addEventListener('scroll', onScroll, { passive: true });
            return () => scrollEl.removeEventListener('scroll', onScroll);
        }
    }, [openPlayerMenuId, openTypeMenuId]);

    // Filters based on sport (For Clips Tab) - Define before using in displayClips

    const isSoccer = resultSport === 'soccer';

    const displayClips = clips.filter(clip => { 

        if (selectedCollection === 'team_a' && clip.team !== 'A') return false;

        if (selectedCollection === 'team_b' && clip.team !== 'B') return false;

        // Player filter: use eventClaims first, then clip.player
        if (selectedPlayer && selectedPlayer !== 'all') {
            const effective = (eventClaims[clip.id] ?? clip.player) as string | null | undefined;
            if (effective !== selectedPlayer) return false;
        }

        if (selectedFilter !== 'all') { 
            // Basketball: filter by event type - only score events (得分=2分, 罚球=1分, 三分=3分)
            if (selectedFilter === 'score') {
                return clip.type === 'score' && clip.scoreType === 2;
            }
            if (selectedFilter === 1) {
                return clip.type === 'score' && clip.scoreType === 1;
            }
            if (selectedFilter === 3) {
                return clip.type === 'score' && clip.scoreType === 3;
            }
            return false;
        } 

        // For 'all' filter, show only score events (1分, 2分, 3分)
        return clip.type === 'score';

    });

    const basicWeeklyTrainingByIssues = React.useMemo(() => {
        const sport = 'basketball';
        const seen = new Map<string, { issueKey: string; hintKey: string; fromClips: string[] }>();
        for (const clip of clips.filter((c) => c.sport === sport)) {
            const ext = CLIP_COACH_EXTENSIONS[clip.id];
            if (!ext) continue;
            const label = clip.labelKey ? t(clip.labelKey) : '';
            for (const issueKey of ext.issueTagKeys) {
                const hintKey = BASIC_TRAIN_HINT_KEYS[issueKey];
                if (!hintKey) continue;
                if (!seen.has(issueKey)) {
                    seen.set(issueKey, { issueKey, hintKey, fromClips: label ? [label] : [] });
                } else if (label) {
                    const cur = seen.get(issueKey)!;
                    if (!cur.fromClips.includes(label)) cur.fromClips.push(label);
                }
            }
        }
        return Array.from(seen.values());
    }, [clips, t]);

    const featuredReelDuration =
        HIGHLIGHT_COLLECTIONS.find((c) => c.id === selectedCollection)?.duration ?? HIGHLIGHT_COLLECTIONS[0].duration;

    const handleClipClick = (time: string) => { 
        setCurrentTime(time); 
        setShowJumpToast(true); 
        setTimeout(() => setShowJumpToast(false), 2000); 
    };

    const handleEditDuration = (clipId: number, currentDuration: string) => {
        // Parse duration string like "10s" to seconds
        const seconds = parseInt(currentDuration.replace('s', '')) || 0;
        setEditingDuration(Math.min(15, seconds));
        setEditingClipId(clipId);
    };

    const handleSaveDuration = () => {
        if (editingClipId === null) return;
        
        if (editingDuration > 15) {
            setToastMessage(t('ui.clipMax15s'));
            setTimeout(() => setToastMessage(null), 2000);
            setEditingDuration(15);
            return;
        }
        
        setClips(prevClips => 
            prevClips.map(clip => 
                clip.id === editingClipId 
                    ? { ...clip, duration: `${editingDuration}s` }
                    : clip
            )
        );
        
        setEditingClipId(null);
        setEditingDuration(0);
    };

    const handleCancelEdit = () => {
        setEditingClipId(null);
        setEditingDuration(0);
    };

    const handleMergeClips = () => {
        if (selectedClipIds.length === 0) return;

        // Show progress modal
        setProgressModal({ show: true, title: t('ui.mergingClips'), progress: 0 });

        // Simulate merge progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3 + 2; // 2-5% per interval
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setProgressModal({ show: false, title: '', progress: 0 });
                    setMergedVideoUrl('merged_video_url_mock');
                    pushView('merge_preview');
                }, 1000);
            }
            setProgressModal((prev: { show: boolean; title: string; progress: number; message?: string }) => ({ ...prev, progress: Math.min(progress, 100) }));
        }, 200);
    };

    const handleApplyTemplate = (templateId: string, labelKey: string, proOnly: boolean) => {
        if (proOnly && !isVip) {
            setToastMessage(t('compose.proOnlyTemplate'));
            setTimeout(() => setToastMessage(null), 2500);
            return;
        }
        const tmpl = COMPOSE_TEMPLATES.find((x) => x.id === templateId);
        const tag = tmpl?.tag || 'full_game';
        const sport = (resultSport || 'soccer') as 'basketball' | 'soccer';
        const pick = pickClipIdsForTemplate(sport, tag);
        setShowComposeTemplateModal(false);
        setShareContext({ type: 'template_compose', templateId, selectedClipIds: pick, templateLabelKey: labelKey });
        setProgressModal({ show: true, title: t('compose.generating'), progress: 0 });
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 4 + 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setProgressModal({ show: false, title: '', progress: 0 });
                    setMergedVideoUrl('mock://template-compose');
                    pushView('merge_preview');
                }, 500);
                return;
            }
            setProgressModal((prev: { show: boolean; title: string; progress: number; message?: string }) => ({
                ...prev,
                progress: Math.min(progress, 100),
            }));
        }, 180);
    };

    // Manual correction: 事件类型 / 得分结果 (type + scoreType + label; 得分结果含 命中/未中)
    type EventTypeOption = { id: string | number; labelKey: string; type: string; scoreType: number | string; scored?: boolean };
    const eventTypeOptions: EventTypeOption[] = [
            { id: 3, labelKey: 'clips.3ptShort', type: 'score', scoreType: 3, scored: true },
            { id: 2, labelKey: 'clips.2ptShort', type: 'score', scoreType: 2, scored: true },
            { id: 1, labelKey: 'clips.ftShort', type: 'score', scoreType: 1, scored: true },
            { id: 'rebound', labelKey: 'clips.reboundShort', type: 'basketball_event', scoreType: 'rebound' },
            { id: 'steal', labelKey: 'clips.steal', type: 'basketball_event', scoreType: 'steal' },
            { id: 'assist', labelKey: 'clips.assist', type: 'basketball_event', scoreType: 'assist' },
        ];

    // Label helper for event type correction (type + scoreType → display label)
    const getLabelForEvent = (sport: string, type: string, scoreType: number | string): string => {
        const m: Record<string, string> = { '3': 'clips.3ptShort', '2': 'clips.2ptShort', '1': 'clips.ftShort', rebound: 'clips.reboundShort', steal: 'clips.steal', assist: 'clips.assist' };
        return t(m[String(scoreType)] ?? 'clips.score');
    };

    const handleCorrectEventType = (clipId: number, opt: EventTypeOption) => {
        const sport = resultSport || 'soccer';
        const label = t(opt.labelKey);
        const scored = opt.scored;
        setClips(prev =>
            prev.map(c => {
                if (c.id !== clipId) return c;
                const next = { ...c, type: opt.type, scoreType: opt.scoreType } as (typeof prev)[number];
                (next as any).labelKey = undefined;
                (next as any).label = label;
                if (scored !== undefined) (next as any).scored = scored;
                return next;
            })
        );
        const idx = AI_CLIPS_ADVANCED.findIndex(c => c.id === clipId);
        if (idx !== -1) {
            const clip = AI_CLIPS_ADVANCED[idx] as any;
            clip.type = opt.type;
            clip.scoreType = opt.scoreType;
            clip.labelKey = undefined;
            clip.labelKey = undefined;
            clip.label = label;
            if (scored !== undefined) clip.scored = scored;
        }
        setOpenTypeMenuId(null);
        setToastMessage(t('ui.typeCorrected'));
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleShare = () => {
        setShareType('selected');
        setShowShareModal(true);
    };

    const handleExportAll = () => {
        // Show progress modal for export
        setProgressModal({ show: true, title: t('ui.exportingAll'), progress: 0 });

        // Simulate export progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3 + 5; // 5-8% per interval
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setProgressModal({ show: false, title: '', progress: 0 });
                    setShareType('all');
                    setShowShareModal(true);
                }, 1000);
            }
            setProgressModal((prev: { show: boolean; title: string; progress: number; message?: string }) => ({ ...prev, progress: Math.min(progress, 100) }));
        }, 200);
    };

    const toggleClipSelection = (id: number) => { if (selectedClipIds.includes(id)) { setSelectedClipIds(selectedClipIds.filter(cid => cid !== id)); } else { setSelectedClipIds([...selectedClipIds, id]); } };

    // Quick mark player function
    const handleQuickMarkPlayer = (clipId: number, playerLabel: string) => {
        setEventClaims((prev: Record<number, string>) => ({
            ...prev,
            [clipId]: playerLabel
        }));
        const globalClipIndex = AI_CLIPS_ADVANCED.findIndex(c => c.id === clipId);
        if (globalClipIndex !== -1) {
            (AI_CLIPS_ADVANCED[globalClipIndex] as any).player = playerLabel;
            (AI_CLIPS_ADVANCED[globalClipIndex] as any).confidence = 'high';
        }
        setOpenPlayerMenuId(null);
        setPlayerDropdownRect(null);
        setToastMessage(t('ui.marked'));
        setTimeout(() => setToastMessage(null), 2000);
    };

    const filters = [ { id: 'all', labelKey: 'filter.all' }, { id: 'score', labelKey: 'filter.score' }, { id: 1, labelKey: 'filter.ft' }, { id: 3, labelKey: 'filter.threePt' } ];

    const statsData = isSoccer ? liveSoccerStats : TEAM_MATCH_STATS;
    const comparativeRows = React.useMemo(
        () => statsData.comparison.filter((row: any) => ['goals', 'shotsOnTarget', 'possession', 'corners'].includes(row.rowKey)),
        [statsData]
    );

    // --- Logic for Simplified Basic Stats ---

    // Simplified Stats Table Rows

    // Basketball: Show only Total Score

    // Soccer: Show Goals and Penalties

    let basicStatsComparison: Array<{ rowKey: string; a: any; b: any; highlight?: boolean }> = [];

    if (isSoccer) {

        // Soccer: Only show goals (score)
        basicStatsComparison = statsData.comparison.filter((i: any) => i.rowKey === 'goals');

    } else {

        // Basketball: Only show total score
        const totalScoreRow = statsData.comparison.find((i: any) => i.rowKey === 'totalPoints');
        if (totalScoreRow) basicStatsComparison.push(totalScoreRow);

    }

    if (isSoccer) {
      const soccerMvpPayload = buildSoccerMvpCloudJobResultFromClips(
        clips.filter((c) => c.sport === 'soccer'),
        statsData.teamA.score,
        statsData.teamB.score,
        t,
        {
          teamA: (statsData.teamA as { displayLabel: string }).displayLabel,
          teamB: (statsData.teamB as { displayLabel: string }).displayLabel,
        }
      );
      return (
        <div className="flex flex-col h-full bg-[#0F172A] text-white relative" onClick={() => setEditingClipId(null)}>
          <div className="absolute top-4 left-4 z-30">
            <button type="button" onClick={popToHome} className="p-2 bg-black/40 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="shrink-0 pt-12">
            <div className="h-[156px] bg-black relative">
            <AssetThumbnail type="video" category={resultSport || 'soccer'} />
            {showJumpToast && (
              <div className="absolute top-[60%] left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 z-30">
                <RotateCcw className="w-3 h-3" /> {t('ui.jumpTo')} {currentTime}
              </div>
            )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-10" data-correction-scroll>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-3">
              <p className="text-[10px] font-bold text-emerald-200/90 mb-2">{t('matchReport.soccerMvpKeyEventsTitle')}</p>
              {soccerMvpPayload.events.length === 0 ? (
                <p className="text-[10px] text-slate-500">{t('matchReport.soccerMvpNoCoreEvents')}</p>
              ) : (
                <div className="space-y-2">
                  {soccerMvpPayload.events.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClipClick(ev.time);
                      }}
                      className="w-full text-left rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {ev.time}
                          <span className="text-slate-500 font-medium mx-1">·</span>
                          {ev.scoreType === 'goal' ? t('matchReport.soccerMvpTypeGoal') : t('matchReport.soccerMvpTypePenalty')}
                        </span>
                        <span
                          className={`text-[8px] px-1.5 py-0.5 rounded shrink-0 ${ev.team === 'A' ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}
                        >
                          {ev.team === 'A'
                            ? (statsData.teamA as { displayLabel: string }).displayLabel
                            : (statsData.teamB as { displayLabel: string }).displayLabel}
                        </span>
                      </div>
                      {ev.player ? <p className="text-[9px] text-slate-400 mt-1">{ev.player}</p> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return (

      <div className="flex flex-col h-full bg-[#0F172A] text-white relative" onClick={() => { setEditingClipId(null); }}>

         <div className="absolute top-4 left-4 z-30">
           <button onClick={popToHome} className="p-2 bg-black/40 rounded-full">
             <ArrowLeft className="w-5 h-5" />
           </button>
         </div>

        {/* Tab Switcher (Score-first layout) */}
        <div className="flex border-b border-white/10 bg-[#0F172A]">
            <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-slate-500'}`}>
                {t('matchReport.tabMatchInsight')}
                {activeTab === 'stats' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>}
            </button>
            <button onClick={() => setActiveTab('clips')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'clips' ? 'text-white' : 'text-slate-500'}`}>
                {t('matchReport.tabVideoReview')}
                {activeTab === 'clips' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full"></div>}
            </button>
        </div>

        {/* Top Player Section (Video carrier, secondary) */}

         <div className="h-[156px] bg-black relative shrink-0">

             <AssetThumbnail type="video" category={resultSport || 'soccer'} />

             {/* No Extra Actions for Basic Highlight View */}

             

             {!isSoccer && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-4xl font-bold drop-shadow-lg opacity-80">{currentTime}</div>}

             {showJumpToast && (<div className="absolute top-[60%] left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 z-30"><RotateCcw className="w-3 h-3" /> {t('ui.jumpTo')} {currentTime}</div>)}

             

             {/* Simple Score Overlay for Context */}

             {!isSoccer && <div className="absolute bottom-0 left-0 right-0 p-4 pb-4 z-20 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent">

                <div className="flex justify-between items-end mb-2">

                    <div className="flex flex-col items-center"><span className={`text-2xl font-black ${statsData.teamA.color} drop-shadow-lg`}>{statsData.teamA.score}</span></div>

                    <div className="text-xl font-black text-slate-500 pb-1">VS</div>

                    <div className="flex flex-col items-center"><span className={`text-2xl font-black ${statsData.teamB.color} drop-shadow-lg`}>{statsData.teamB.score}</span></div>

                </div>

             </div>}

         </div>

         {!isSoccer && <div className="px-4 py-3 bg-[#0F172A] border-b border-white/10">
           <div className="flex items-start gap-3">
             <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
               <FileText className="w-5 h-5 text-orange-400" />
             </div>
             <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 flex-wrap">
                 <h2 className="text-sm font-black text-white tracking-tight">{t('matchReport.sessionTitle')}</h2>
                 <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/25 text-orange-100 border border-orange-400/40">
                   {t('matchReport.badgeBasic')}
                 </span>
               </div>
               <p className="text-[11px] text-slate-300 mt-2 font-medium leading-snug">
                 {t(statsData.teamA.nameKey)} {statsData.teamA.score} {t('matchReport.scoreLineSep')} {statsData.teamB.score} {t(statsData.teamB.nameKey)}
                 <span className="text-slate-500 mx-1.5">·</span>
                 {t('matchReport.sportBasketball')}
               </p>
             </div>
           </div>
         </div>}

         <div className="flex-1 overflow-y-auto bg-[#0F172A]" data-correction-scroll>

             {activeTab === 'clips' ? (

                 <div className="p-4 pb-24">

                    <div className="mb-3 rounded-2xl overflow-hidden border border-orange-500/35 bg-gradient-to-br from-orange-950/90 via-[#1a1520] to-[#0F172A]">
                       <div className="flex gap-3 p-3">
                         <button
                           type="button"
                           onClick={() => {
                             setMergedVideoUrl('mock://highlight-reel-preview');
                             setShareContext({ type: 'all' });
                             pushView('merge_preview');
                           }}
                           className="w-[104px] shrink-0 aspect-video rounded-xl bg-black relative overflow-hidden border border-white/10 text-left group"
                         >
                           <AssetThumbnail type="video" category={resultSport || 'soccer'} />
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-active:bg-black/50">
                             <PlayCircle className="w-11 h-11 text-white drop-shadow-lg" />
                             <span className="text-[9px] font-bold text-white/90 mt-1">{featuredReelDuration}</span>
                           </div>
                         </button>
                         <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                           <span className="text-[9px] font-bold text-orange-200/90 tracking-wide">{t('basicTrain.featuredReelKicker')}</span>
                           <span className="text-sm font-black text-white leading-tight">{t('basicTrain.featuredReelTitle')}</span>
                           <span className="text-[10px] text-slate-400 leading-snug">
                             {t('basicTrain.featuredReelMeta', { count: displayClips.length, dur: featuredReelDuration })}
                           </span>
                           <div className="flex flex-wrap gap-2 mt-1">
                             <button
                               type="button"
                               onClick={() => setShowComposeTemplateModal(true)}
                               className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-[10px] font-bold text-white shadow-md shadow-orange-900/30"
                             >
                               {t('compose.openTemplateSheet')}
                             </button>
                             <button
                               type="button"
                               onClick={() => {
                                 setMergedVideoUrl('mock://highlight-reel-preview');
                                 setShareContext({ type: 'all' });
                                 pushView('merge_preview');
                               }}
                               className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 text-[10px] font-bold text-slate-200"
                             >
                               {t('basicTrain.previewReel')}
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Collections - Horizontal Scroll */}

                     <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-2">

                         {HIGHLIGHT_COLLECTIONS.map(col => (

                            <button key={col.id} onClick={() => { setSelectedCollection(col.id); setSelectedFilter('all'); }} className={`flex-none px-3 py-2 rounded-lg border flex flex-col items-start min-w-[80px] transition-all ${selectedCollection === col.id ? `bg-${col.theme}-500/20 border-${col.theme}-500` : 'bg-black/40 border-white/10'}`}>

                                <span className={`text-xs font-bold ${selectedCollection === col.id ? 'text-white' : 'text-slate-300'}`}>{t(col.labelKey)}</span>

                            </button>

                         ))}

                     </div>

                    {/* Filter Pills */}

                    <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">

                        {filters.map(f => (

                            <button key={f.id} onClick={() => setSelectedFilter(f.id as EventFilterType)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedFilter === f.id ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}>{t((f as any).labelKey)}</button>

                        ))}

                    </div>

                    {/* Player Filter */}
                    {availablePlayers.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                            <button 
                                onClick={() => setSelectedPlayer(null)} 
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedPlayer === null || selectedPlayer === 'all' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}
                            >
                                {t('ui.allPlayers')}
                            </button>
                            {availablePlayers.map(player => (
                                <button 
                                    key={player} 
                                    onClick={() => setSelectedPlayer(player)} 
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedPlayer === player ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}
                                >
                                    {player}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selection Toggle inside Clips Tab */}

                     <div className="flex justify-end mb-2">

                         <button onClick={(e) => { e.stopPropagation(); setIsSelectionMode(!isSelectionMode); }} className={`text-xs font-bold flex items-center gap-1 transition-colors ${isSelectionMode ? 'text-orange-400' : 'text-slate-500'}`}>

                             {isSelectionMode ? t('ui.cancelSelect') : t('ui.selectClips')}

                         </button>

                     </div>

                     {/* Clip List */}

                     <div className="space-y-3">

                         {displayClips.length === 0 && <div className="text-center text-slate-500 text-xs py-8">{t('ui.noClipsInCategory')}</div>}

                         {displayClips.map((clip, index) => { 

                             const isSelected = selectedClipIds.includes(clip.id); 

                             return (

                                 <div key={clip.id} 

                                     onClick={(e) => { 

                                         e.stopPropagation(); 

                                         if (isSelectionMode) { toggleClipSelection(clip.id); } 

                                         else { handleClipClick(clip.time); } 

                                     }} 

                                     className={`bg-[#1E293B] rounded-xl overflow-hidden border flex h-20 group active:scale-[0.99] transition-transform cursor-pointer relative ${isSelectionMode && isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-white/5'}`}

                                 >

                                     {isSelectionMode && (<div className="absolute top-2 left-2 z-30"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-white/50 bg-black/40'}`}>{isSelected && <Check className="w-3 h-3 text-white" />}</div></div>)}

                                     <div className="w-28 h-full relative shrink-0 bg-black">

                                        <AssetThumbnail type="video" category={resultSport || 'soccer'} />

                                         {!isSelectionMode && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle className="w-6 h-6 text-white/80" /></div>}

                                         <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px]">{editingClipId === clip.id ? `${editingDuration}s` : clip.duration}</div>

                                     </div>

                                     <div className="flex-1 p-2.5 flex flex-col justify-between relative">

                                         <div>

                                            <div className="flex items-center justify-between mb-1.5">

                                                <h4 className="text-sm font-bold text-slate-200">{clip.labelKey ? t(clip.labelKey) : (clip as any).label}</h4>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {clip.time}</span>
                                                    <span className={`text-[8px] px-1 rounded ${clip.team === 'A' ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}>{clip.team === 'A' ? t('ui.teamA') : t('ui.teamB')}</span>
                                                </div>

                                            </div>

                                         </div>

                                         <div>
                                             {!isSelectionMode && editingClipId === clip.id ? (
                                                 <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                     <button 
                                                         onClick={() => setEditingDuration(Math.max(1, editingDuration - 1))}
                                                         className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors flex-shrink-0"
                                                     >
                                                         <Minus className="w-3 h-3" />
                                                     </button>
                                                     <span className="text-[10px] font-bold text-white font-mono min-w-[35px] text-center">{editingDuration}s</span>
                                                     <button 
                                                         onClick={() => setEditingDuration(Math.min(15, editingDuration + 1))}
                                                         className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors flex-shrink-0"
                                                     >
                                                         <Plus className="w-3 h-3" />
                                                     </button>
<button 
                                                         onClick={handleCancelEdit}
                                                         className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[8px] font-bold text-slate-300 transition-colors whitespace-nowrap shrink-0"
                                                     >
                                                        {t('ui.cancel')}
                                                     </button>
                                                     <button 
                                                         onClick={handleSaveDuration}
                                                         className="px-2 py-1 bg-orange-500 hover:bg-orange-600 rounded text-[8px] font-bold text-white transition-colors whitespace-nowrap shrink-0"
                                                     >
                                                        {t('ui.confirm')}
                                                     </button>
                                                </div>
                                            ) : (
                                                !isSelectionMode && (
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleEditDuration(clip.id, clip.duration); 
                                                            }}
                                                            className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-[8px] font-bold text-slate-300 flex items-center gap-0.5 transition-colors shrink-0"
                                                            title={t('ui.editDuration')}
                                                        >
                                                            <Edit3 className="w-2.5 h-2.5" /> <span className="hidden sm:inline">{t('ui.editDuration')}</span>
                                                        </button>
                                                        <div className="relative shrink-0" data-correction-menu>
                                                            <button
                                                                ref={el => { typeTriggerRefs.current[clip.id] = el; }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenTypeMenuId(openTypeMenuId === clip.id ? null : clip.id);
                                                                    setOpenPlayerMenuId(null);
                                                                }}
                                                                className="px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors shrink-0"
                                                                title={t('ui.correctType')}
                                                            >
                                                                <Edit3 className="w-2.5 h-2.5" /> <span className="hidden sm:inline">{t('ui.typeLabel')}</span> <ChevronDown className={`w-2.5 h-2.5 transition-transform ${openTypeMenuId === clip.id ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        </div>
                                                        <div className="relative shrink-0" data-correction-menu>
                                                            <button
                                                                ref={el => { playerTriggerRefs.current[clip.id] = el; }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenPlayerMenuId(openPlayerMenuId === clip.id ? null : clip.id);
                                                                    setOpenTypeMenuId(null);
                                                                }}
                                                                className="px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
                                                                title={t('ui.markPlayer')}
                                                            >
                                                                {(eventClaims[clip.id] ?? clip.player) ? (
                                                                    <><User className="w-2.5 h-2.5" /><span className="max-w-[40px] truncate">{eventClaims[clip.id] ?? clip.player}</span><ChevronDown className={`w-2.5 h-2.5 transition-transform ${openPlayerMenuId === clip.id ? 'rotate-180' : ''}`} /></>
                                                                ) : (
                                                                    <><User className="w-2.5 h-2.5" /><span className="hidden sm:inline">{t('ui.unmarked')}</span><ChevronDown className={`w-2.5 h-2.5 transition-transform ${openPlayerMenuId === clip.id ? 'rotate-180' : ''}`} /></>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                    </div>

                                </div>

                             ); 

                         })}

                     </div>

                 </div>

            ) : (

                <div className="p-4 space-y-4">

                    <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-3 space-y-2">
                      <p className="text-[10px] font-bold text-slate-300">{t('matchReport.comparativeData')}</p>
                      {comparativeRows.map((row: any) => {
                        const aRaw = String(row.a).replace('%', '').split(' ')[0];
                        const bRaw = String(row.b).replace('%', '').split(' ')[0];
                        const aNum = Number(aRaw) || 0;
                        const bNum = Number(bRaw) || 0;
                        const total = Math.max(aNum + bNum, 1);
                        return (
                          <div key={row.rowKey}>
                            <div className="flex items-center justify-between text-[9px] text-slate-300">
                              <span>{row.a}</span>
                              <span>{t(`report.${row.rowKey}`)}</span>
                              <span>{row.b}</span>
                            </div>
                            <div className="h-1.5 mt-1 rounded-full bg-slate-800 overflow-hidden flex">
                              <span className="bg-blue-500" style={{ width: `${(aNum / total) * 100}%` }} />
                              <span className="bg-orange-400" style={{ width: `${(bNum / total) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#1E293B] p-4 space-y-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        {t('basicTrain.weeklyTitle')}
                      </h3>
                      {basicWeeklyTrainingByIssues.length === 0 ? (
                        <p className="text-[10px] text-slate-500">{t('basicTrain.weeklyEmpty')}</p>
                      ) : (
                        <div className="space-y-2">
                          {basicWeeklyTrainingByIssues.slice(0, 3).map((row) => (
                            <div key={row.issueKey} className="bg-black/30 rounded-xl p-3 border border-white/10">
                              <div className="text-[10px] font-bold text-orange-200/95">{t(row.issueKey)}</div>
                              <p className="text-[10px] text-slate-300 mt-1">{t(row.hintKey)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </div>

            )}

         </div>

         {/* Bottom Action Bar (Only visible in Clips tab if Selection Mode is active, or default) */}

         {activeTab === 'clips' && isSelectionMode && (

             <div className="absolute bottom-0 left-0 right-0 bg-[#1E293B] border-t border-white/10 p-4 pb-8 z-30 animate-in slide-in-from-bottom">

                 <div className="flex justify-between items-center mb-3">

                     <span className="text-xs text-slate-400">{t('ui.selectedCount', { count: selectedClipIds.length })}</span>

                     <button onClick={() => setSelectedClipIds(selectedClipIds.length === displayClips.length ? [] : displayClips.map(c => c.id))} className="text-xs text-blue-400 font-bold">{selectedClipIds.length === displayClips.length ? t('ui.deselectAll') : t('ui.selectAll')}</button>

                 </div>

                 <div className="flex gap-3">

                     <button onClick={handleMergeClips} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Layers className="w-4 h-4" /> {t('ui.mergeClips')}</button>

                     <button onClick={handleShare} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"><Share2 className="w-4 h-4" /> {t('ui.exportShare')}</button>

                 </div>

             </div>

         )}

         

         {/* Default Footer for Highlights (When not selecting) */}

         {activeTab === 'clips' && !isSelectionMode && (

             <div className="p-4 bg-[#0F172A] border-t border-white/10">

                 <button onClick={handleExportAll} className="w-full bg-orange-500 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">

                     <Share2 className="w-4 h-4" /> {t('ui.exportAllHighlights')}

                 </button>

             </div>

         )}

         {/* Portal dropdown for type correction (avoid clip card overflow clipping) */}
         {openTypeMenuId != null && typeDropdownRect != null && (() => {
            const clip = displayClips.find(c => c.id === openTypeMenuId);
            if (!clip) return null;
            const style: React.CSSProperties = {
                position: 'fixed',
                left: typeDropdownRect.left,
                minWidth: typeDropdownRect.minWidth,
                zIndex: 50,
                ...(typeDropdownRect.placement === 'below' ? { top: typeDropdownRect.top } : { bottom: typeDropdownRect.bottom }),
            };
            return createPortal(
                <div data-correction-menu className="bg-[#1E293B] border border-white/10 rounded-lg shadow-xl max-h-[220px] overflow-y-auto" style={style}>
                    {eventTypeOptions.map((opt, i) => (
                        <React.Fragment key={String(opt.id)}>
                            {!isSoccer && i === 3 && <div className="border-t border-white/10 my-1" />}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCorrectEventType(clip.id, opt); }}
                                className="w-full px-3 py-2 text-left text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                                {t(opt.labelKey)}
                            </button>
                        </React.Fragment>
                    ))}
                </div>,
                document.body
            );
        })()}

         {/* Portal dropdown for player correction (avoid clip card overflow clipping) */}
         {openPlayerMenuId != null && playerDropdownRect != null && (() => {
             const clip = displayClips.find(c => c.id === openPlayerMenuId);
             if (!clip) return null;
             const style: React.CSSProperties = {
                 position: 'fixed',
                 left: playerDropdownRect.left,
                 minWidth: playerDropdownRect.minWidth,
                 zIndex: 50,
                 ...(playerDropdownRect.placement === 'below' ? { top: playerDropdownRect.top } : { bottom: playerDropdownRect.bottom }),
             };
             return createPortal(
                 <div data-correction-menu className="bg-[#1E293B] border border-white/10 rounded-lg shadow-xl max-h-[200px] overflow-y-auto" style={style}>
                     {availablePlayers.length > 0 && (
                         <>
                             {availablePlayers.map(player => (
                                 <button
                                     key={player}
                                     onClick={(e) => { e.stopPropagation(); handleQuickMarkPlayer(clip.id, player); }}
                                     className="w-full px-3 py-2 text-left text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors first:rounded-t-lg"
                                 >
                                     {player}
                                 </button>
                             ))}
                             <div className="border-t border-white/10" />
                         </>
                     )}
                     <button
                         onClick={(e) => {
                             e.stopPropagation();
                             setOpenPlayerMenuId(null);
                             setPlayerDropdownRect(null);
                             setSelectedEventForClaim(clip.id);
                             setShowPlayerSelector(true);
                         }}
                         className="w-full px-3 py-2 text-left text-[10px] text-blue-400 hover:bg-slate-700 transition-colors rounded-b-lg"
                     >
                         {t('ui.custom')}
                     </button>
                 </div>,
                 document.body
             );
         })()}

         {showComposeTemplateModal && (
            <div className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/50">
              <button type="button" className="flex-1 min-h-0 border-0 cursor-default bg-transparent" aria-label="close" onClick={() => setShowComposeTemplateModal(false)} />
              <div className="bg-[#0F172A] rounded-t-3xl border-t border-white/10 p-4 pb-8 max-h-[70%] overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white">{t('compose.sheetTitle')}</h3>
                  <button type="button" onClick={() => setShowComposeTemplateModal(false)} className="p-1 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">{t('compose.sheetDesc')}</p>
                <div className="space-y-2">
                  {COMPOSE_TEMPLATES.filter((tm) => isVip || !tm.proOnly).map((tm) => (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tm.id, tm.labelKey, tm.proOnly)}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-white/10 bg-[#1E293B] text-left gap-2"
                    >
                      <span className="text-xs font-bold text-white">{t(tm.labelKey)}</span>
                      {tm.proOnly && isVip && (
                        <span className="text-[8px] font-black text-amber-300/90 shrink-0">{t('compose.badgeMemberTemplate')}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
         )}

      </div>

    );

};

  

  // --- Statistics Calculation Functions ---
const calculatePlayerStats = (sport: string, eventClaims: Record<number, string>) => {
  const isSoccer = sport === 'soccer';
  const events = AI_CLIPS_ADVANCED.filter(e => e.sport === sport);

  type PlayerKey = string; // "team_label"
  const pair = (t: string, l: string) => `${t}_${l}`;

  const keys = new Set<PlayerKey>();
  events.forEach(e => {
    const L = (eventClaims[e.id] ?? e.player) as string | null | undefined;
    if (L && String(L).trim()) keys.add(pair(e.team, String(L).trim()));
  });

  const statsData = isSoccer ? SOCCER_MATCH_STATS : TEAM_MATCH_STATS;
  const teamColor = (t: string) => t === 'A' ? 'bg-blue-500' : 'bg-red-500';

  return Array.from(keys).sort().map(key => {
    const idx = key.indexOf('_');
    const team = key.slice(0, idx);
    const labelStr = key.slice(idx + 1);
    const playerEvents = events.filter(e => {
      const L = (eventClaims[e.id] ?? e.player) as string | null | undefined;
      const l = L && String(L).trim();
      return e.team === team && l === labelStr;
    });

    if (isSoccer) {
      const goals = playerEvents.filter(e => e.scoreType === 'goal').length;
      const corners = playerEvents.filter(e => e.scoreType === 'corner').length;
      const setpieces = playerEvents.filter(e => e.scoreType === 'setpiece').length;
      const penalties = playerEvents.filter(e => e.scoreType === 'penalty').length;
      return {
        key,
        team,
        label: labelStr,
        color: teamColor(team),
        goals,
        assists: 0,
        corners,
        setpieces,
        penalties,
        rating: 8.0,
        events: playerEvents.map(e => ({ id: e.id, type: e.scoreType, time: e.time, label: (e as any).labelKey ? i18n.t((e as any).labelKey) : (e as any).label, claimed: true }))
      };
    } else {
      const scored = (e: { scoreType: number | string; scored?: boolean }) => (e as any).scored !== false;
      const fgAttempts = playerEvents.filter(e => e.type === 'score').length;
      const fgMade = playerEvents.filter(e => e.type === 'score' && scored(e)).length;

      const tpAttempts = playerEvents.filter(e => e.type === 'score' && e.scoreType === 3).length;
      const tpMade = playerEvents.filter(e => e.type === 'score' && e.scoreType === 3 && scored(e)).length;

      const ftAttempts = playerEvents.filter(e => e.type === 'score' && e.scoreType === 1).length;
      const ftMade = playerEvents.filter(e => e.type === 'score' && e.scoreType === 1 && scored(e)).length;

      const pts1 = ftMade; // 每次罚球命中 1 分
      const pts2 = playerEvents.filter(e => e.scoreType === 2 && scored(e)).length * 2;
      const pts3 = tpMade * 3;
      const pts = pts1 + pts2 + pts3;

      const reb = playerEvents.filter(e => e.scoreType === 'rebound').length;
      const offReb = 0;
      const defReb = reb;
      const ast = playerEvents.filter(e => e.scoreType === 'assist').length;
      const stl = playerEvents.filter(e => e.scoreType === 'steal').length;
      const blk = 0;
      const tov = 0;
      const pf = 0;

      const eff = pts + reb * 1.2 + ast * 1.5 + stl * 1.0;
      return {
        key,
        team,
        label: labelStr,
        color: teamColor(team),
        number: 0,
        pts,
        reb,
        ast,
        stl,
        offReb,
        defReb,
        blk,
        tov,
        pf,
        fgMade,
        fgAtt: fgAttempts,
        tpMade,
        tpAtt: tpAttempts,
        ftMade,
        ftAtt: ftAttempts,
        eff: `+${Math.round(eff)}`,
        events: playerEvents.map(e => ({ id: e.id, type: e.scoreType, time: e.time, label: (e as any).labelKey ? i18n.t((e as any).labelKey) : (e as any).label, claimed: true }))
      };
    }
  });
};

// --- Player Detail View Component ---
const PlayerDetailView = ({ player, sport, onClose }: { player: any, sport: string, onClose: () => void }) => {
  const { t, setShowShareModal, setShareType, setShareContext } = useAppContext();
  const isSoccer = sport === 'soccer';

  const handleSharePlayerDashboard = () => {
    setShareContext({ type: 'player_dashboard', playerLabel: player.label });
    setShareType('all');
    setShowShareModal(true);
  };

  return (
    <div className="bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden mt-4 animate-in slide-in-from-top-4">
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" /> {player.label} {t('ui.detail')}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-2">
          {isSoccer ? (
            <>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">{t('report.goals')}</div>
                <div className="text-lg font-bold text-white">{player.goals || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">{t('report.corners')}</div>
                <div className="text-lg font-bold text-white">{player.corners || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">{t('clips.penaltyShort')}</div>
                <div className="text-lg font-bold text-white">{player.penalties || 0}</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">{t('report.totalPoints')}</div>
                <div className="text-lg font-bold text-white">{player.pts || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">{t('report.rebounds')}</div>
                <div className="text-lg font-bold text-white">{player.reb || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">{t('report.assists')}</div>
                <div className="text-lg font-bold text-white">{player.ast || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">{t('report.steals')}</div>
                <div className="text-lg font-bold text-white">{(player as any).stl || 0}</div>
              </div>
            </>
          )}
        </div>

        {/* Share actions */}
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button
            onClick={handleSharePlayerDashboard}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" /> {t('ui.shareDashboard')}
          </button>
        </div>
      </div>

    </div>
  );
};

// --- New Internal Components for Advanced Analysis Views ---

  // Basketball Heatmap Component (personal view only, used in stats tab)
  const BasketballHeatmap = ({ playerLabel }: { playerLabel: string | null }) => {
    const { t, eventClaims, resultSport } = useAppContext();

    const hasPlayer = resultSport === 'basketball' && playerLabel && playerLabel !== 'all';

    // 根据球员事件简单推导出手分布：用 3 分 / 2 分 次数来映射外线 / 内线热度
    let perimeterIntensity = 0; // 外线（三分）热度 0-1
    let paintIntensity = 0;     // 内线（两分）热度 0-1

    if (hasPlayer) {
      const eventsForPlayer = AI_CLIPS_ADVANCED.filter(e => {
        if (e.sport !== 'basketball') return false;
        const label = (eventClaims[e.id] ?? e.player) as string | null | undefined;
        return label === playerLabel;
      });

      const scored = (e: any) => (e as any).scored !== false;

      const threeMade = eventsForPlayer.filter(e => e.type === 'score' && e.scoreType === 3 && scored(e)).length;
      const twoMade   = eventsForPlayer.filter(e => e.type === 'score' && e.scoreType === 2 && scored(e)).length;

      const total = Math.max(threeMade + twoMade, 1);
      perimeterIntensity = threeMade / total; // 外线占比越高，越亮
      paintIntensity     = twoMade   / total; // 内线占比越高，越亮
    }

    return (
      <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{hasPlayer ? t('ui.personalShotHeatmap') : t('ui.heatmapShot')}</span>
              </h3>
              {hasPlayer ? (
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 max-w-[120px] truncate">
                      {playerLabel}
                  </span>
              ) : (
                  <span className="text-[10px] text-slate-400">
                      {t('ui.selectPlayerAbove')}
                  </span>
              )}
          </div>
          <div className="aspect-[4/3] bg-orange-600/20 rounded-xl relative border border-white/5 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" className="absolute inset-0">
                  <rect x="0" y="0" width="200" height="200" fill="#FF6B35" fillOpacity="0.1" />
                  <line x1="0" y1="200" x2="200" y2="200" stroke="white" strokeWidth="2" />
                  <rect x="60" y="120" width="80" height="80" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="60" y1="120" x2="140" y2="120" stroke="white" strokeWidth="2" />
                  <circle cx="100" cy="120" r="20" fill="none" stroke="white" strokeWidth="2" />
                  <path d="M 10 200 Q 100 20 190 200" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4,4" />
                  <path d="M 80 200 Q 100 170 120 200" fill="none" stroke="white" strokeWidth="2" />
                  <circle cx="100" cy="190" r="3" fill="white" />
                  <defs>
                      <radialGradient id="advTeamAHeat" cx="50%" cy="50%">
                          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                          <stop offset="50%" stopColor="rgba(59, 130, 246, 0.5)" />
                          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                      </radialGradient>
                      <radialGradient id="advTeamBHeat" cx="50%" cy="50%">
                          <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                          <stop offset="50%" stopColor="rgba(239, 68, 68, 0.5)" />
                          <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                      </radialGradient>
                  </defs>
                  {hasPlayer && (
                      <g opacity={0.25 + 0.7 * perimeterIntensity}>
                          <ellipse cx="25" cy="185" rx="18" ry="15" fill="url(#advTeamAHeat)" />
                          <ellipse cx="20" cy="190" rx="15" ry="12" fill="url(#advTeamAHeat)" />
                          <ellipse cx="175" cy="185" rx="18" ry="15" fill="url(#advTeamAHeat)" />
                          <ellipse cx="180" cy="190" rx="15" ry="12" fill="url(#advTeamAHeat)" />
                          <ellipse cx="30" cy="120" rx="20" ry="18" fill="url(#advTeamAHeat)" />
                          <ellipse cx="25" cy="110" rx="18" ry="16" fill="url(#advTeamAHeat)" />
                          <ellipse cx="170" cy="120" rx="20" ry="18" fill="url(#advTeamAHeat)" />
                          <ellipse cx="175" cy="110" rx="18" ry="16" fill="url(#advTeamAHeat)" />
                          <ellipse cx="50" cy="50" rx="22" ry="20" fill="url(#advTeamAHeat)" />
                          <ellipse cx="150" cy="50" rx="22" ry="20" fill="url(#advTeamAHeat)" />
                      </g>
                  )}
                  {hasPlayer && (
                      <g opacity={0.25 + 0.7 * paintIntensity}>
                          <ellipse cx="100" cy="190" rx="25" ry="20" fill="url(#advTeamBHeat)" />
                          <ellipse cx="95" cy="185" rx="22" ry="18" fill="url(#advTeamBHeat)" />
                          <ellipse cx="105" cy="185" rx="20" ry="16" fill="url(#advTeamBHeat)" />
                          <ellipse cx="100" cy="175" rx="20" ry="18" fill="url(#advTeamBHeat)" />
                          <ellipse cx="85" cy="150" rx="18" ry="16" fill="url(#advTeamBHeat)" />
                          <ellipse cx="115" cy="150" rx="18" ry="16" fill="url(#advTeamBHeat)" />
                          <ellipse cx="100" cy="125" rx="16" ry="14" fill="url(#advTeamBHeat)" />
                          <ellipse cx="75" cy="160" rx="15" ry="13" fill="url(#advTeamBHeat)" />
                          <ellipse cx="125" cy="160" rx="15" ry="13" fill="url(#advTeamBHeat)" />
                      </g>
                  )}
              </svg>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-[9px] text-slate-400">
              <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500/60" />
                  <span>{t('ui.darkerAreaMeaning')}</span>
              </div>
          </div>
      </div>
    );
  };

  // Soccer Heatmap Component (personal view only, used in stats tab)
  const SoccerHeatmap = ({ playerLabel }: { playerLabel: string | null }) => {
    const { t, eventClaims, resultSport } = useAppContext();

    const hasPlayer = resultSport === 'soccer' && playerLabel && playerLabel !== 'all';

    // 只展示“进球”的热力情况：进球越多，禁区附近越亮
    let goalIntensity = 0; // 0-1

    if (hasPlayer) {
      const eventsForPlayer = AI_CLIPS_ADVANCED.filter(e => {
        if (e.sport !== 'soccer') return false;
        const label = (eventClaims[e.id] ?? e.player) as string | null | undefined;
        return label === playerLabel && e.scoreType === 'goal';
      });
      const goals = eventsForPlayer.length;
      goalIntensity = Math.min(goals / 3, 1); // 简单归一化，多于 3 球就视为满格
    }

    return (
      <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-emerald-500" />
                  <span>{hasPlayer ? t('ui.personalRunHeatmap') : t('ui.heatmapRun')}</span>
              </h3>
              {hasPlayer ? (
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 max-w-[120px] truncate">
                      {playerLabel}
                  </span>
              ) : (
                  <span className="text-[10px] text-slate-400">
                      {t('ui.selectPlayerAbove')}
                  </span>
              )}
          </div>
          <div className="aspect-[16/9] bg-emerald-900/40 rounded-xl relative border border-white/5 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0">
                  <defs>
                      <radialGradient id="advGreenHeatLow" cx="50%" cy="50%">
                          <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                          <stop offset="50%" stopColor="rgba(34, 197, 94, 0.15)" />
                          <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                      </radialGradient>
                      <radialGradient id="advGreenHeatMid" cx="50%" cy="50%">
                          <stop offset="0%" stopColor="rgba(22, 163, 74, 0.6)" />
                          <stop offset="50%" stopColor="rgba(22, 163, 74, 0.3)" />
                          <stop offset="100%" stopColor="rgba(22, 163, 74, 0)" />
                      </radialGradient>
                      <radialGradient id="advGreenHeatHigh" cx="50%" cy="50%">
                          <stop offset="0%" stopColor="rgba(20, 83, 45, 0.8)" />
                          <stop offset="50%" stopColor="rgba(20, 83, 45, 0.5)" />
                          <stop offset="100%" stopColor="rgba(20, 83, 45, 0)" />
                      </radialGradient>
                  </defs>
                  <rect x="0" y="0" width="100" height="50" fill="rgba(34, 197, 94, 0.05)" />
                  <rect x="0" y="0" width="100" height="50" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <line x1="50" y1="0" x2="50" y2="50" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <circle cx="50" cy="25" r="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <circle cx="50" cy="25" r="0.5" fill="white" opacity="0.4" />
                  <rect x="0" y="12" width="18" height="26" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <rect x="0" y="18" width="6" height="14" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <circle cx="12" cy="25" r="0.4" fill="white" opacity="0.4" />
                  <path d="M 18 25 A 6 6 0 0 1 18 15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <rect x="82" y="12" width="18" height="26" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <rect x="94" y="18" width="6" height="14" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  <circle cx="88" cy="25" r="0.4" fill="white" opacity="0.4" />
                  <path d="M 82 25 A 6 6 0 0 0 82 15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                  {hasPlayer && (
                      <g opacity={0.3 + 0.6 * goalIntensity}>
                          <ellipse cx="15" cy="20" rx="8" ry="6" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="12" cy="18" rx="6" ry="4" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="25" cy="25" rx="10" ry="8" fill="url(#advGreenHeatMid)" />
                          <ellipse cx="22" cy="23" rx="8" ry="6" fill="url(#advGreenHeatMid)" />
                          <ellipse cx="8" cy="25" rx="6" ry="5" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="6" cy="27" rx="5" ry="4" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="5" cy="15" rx="4" ry="3" fill="url(#advGreenHeatLow)" />
                          <ellipse cx="5" cy="35" rx="4" ry="3" fill="url(#advGreenHeatLow)" />
                      </g>
                  )}
                  {hasPlayer && (
                      <g opacity={0.25 + 0.6 * goalIntensity}>
                          <ellipse cx="85" cy="20" rx="8" ry="6" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="88" cy="18" rx="6" ry="4" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="75" cy="25" rx="10" ry="8" fill="url(#advGreenHeatMid)" />
                          <ellipse cx="78" cy="23" rx="8" ry="6" fill="url(#advGreenHeatMid)" />
                          <ellipse cx="92" cy="25" rx="6" ry="5" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="94" cy="27" rx="5" ry="4" fill="url(#advGreenHeatHigh)" />
                          <ellipse cx="95" cy="15" rx="4" ry="3" fill="url(#advGreenHeatLow)" />
                          <ellipse cx="95" cy="35" rx="4" ry="3" fill="url(#advGreenHeatLow)" />
                      </g>
                  )}
              </svg>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-[9px] text-slate-400">
              <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(to right, rgba(34, 197, 94, 0.3), rgba(20, 83, 45, 0.8))' }} />
                  <span>{t('ui.darkerAreaRun')}</span>
              </div>
          </div>
      </div>
    );
  };


  const AnalysisResultScreen = () => {
    const {
      popToHome,
      resultSport,
      setShowShareModal,
      setShareType,
      setShareContext,
      setToastMessage,
      t,
      galleryHybridDemoView,
      setGalleryHybridDemoView,
      liveSoccerStats,
      updateSoccerMatchPresentation,
    } = useAppContext();

    const isSoccer = resultSport === 'soccer';
    const [viewMode, setViewMode] = useState<'review' | 'fullMatch'>('review');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimeSec, setCurrentTimeSec] = useState(0);
    const [durationSec, setDurationSec] = useState(90 * 60);
    const [activeEventId, setActiveEventId] = useState<number | null>(null);
    const [showScoreEditModal, setShowScoreEditModal] = useState(false);
    const [isScoreCollapsed, setIsScoreCollapsed] = useState(false);
    const [editingScoreA, setEditingScoreA] = useState<string>(String(liveSoccerStats.teamA.score));
    const [editingScoreB, setEditingScoreB] = useState<string>(String(liveSoccerStats.teamB.score));
    const [editingNameA, setEditingNameA] = useState<string>(String((liveSoccerStats.teamA as { displayLabel: string }).displayLabel));
    const [editingNameB, setEditingNameB] = useState<string>(String((liveSoccerStats.teamB as { displayLabel: string }).displayLabel));
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [eventDraft, setEventDraft] = useState<{ scoreType: string; time: string }>({ scoreType: 'goal', time: '00:00' });
    const [eventCorrections, setEventCorrections] = useState<Record<number, { scoreType?: string; time?: string }>>({});
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [activeTimelineFilter, setActiveTimelineFilter] = useState<'all' | 'goal' | 'corner' | 'setpiece' | 'penalty'>('all');

    const eventItemRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const ignoreCollapseUntilRef = useRef(0);

    const sourceClips = React.useMemo(
      () => AI_CLIPS_ADVANCED.filter((clip) => clip.sport === (resultSport || 'soccer')),
      [resultSport]
    );

    const soccerTimelineEvents = React.useMemo(() => {
      if (!isSoccer) return [] as any[];
      return sourceClips
        .filter((clip) => ['goal', 'corner', 'setpiece', 'penalty'].includes(String(clip.scoreType)))
        .sort((a, b) => parseMatchClockToSeconds(String(a.time)) - parseMatchClockToSeconds(String(b.time)));
    }, [isSoccer, sourceClips]);

    const resolvedEvents = React.useMemo(
      () =>
        soccerTimelineEvents.map((clip) => ({
          ...clip,
          scoreType: eventCorrections[clip.id]?.scoreType ?? String(clip.scoreType),
          time: eventCorrections[clip.id]?.time ?? String(clip.time),
        })),
      [soccerTimelineEvents, eventCorrections]
    );

    const filteredTimelineEvents = React.useMemo(() => {
      if (activeTimelineFilter === 'all') return resolvedEvents;
      return resolvedEvents.filter((event) => String(event.scoreType) === activeTimelineFilter);
    }, [resolvedEvents, activeTimelineFilter]);

    const maxEventTimeSec = React.useMemo(
      () => resolvedEvents.reduce((acc, event) => Math.max(acc, parseMatchClockToSeconds(String(event.time))), 0),
      [resolvedEvents]
    );

    const selectedVideoDuration =
      viewMode === 'fullMatch'
        ? 95 * 60
        : Math.min(20 * 60, Math.max(45, maxEventTimeSec + 30));

    useEffect(() => {
      setDurationSec(selectedVideoDuration);
      setCurrentTimeSec(0);
      setIsPlaying(false);
      setActiveEventId(null);
    }, [selectedVideoDuration, viewMode]);

    useEffect(() => {
      if (!isPlaying) return;
      const id = window.setInterval(() => {
        setCurrentTimeSec((prev) => Math.min(prev + 1, durationSec));
      }, 1000);
      return () => window.clearInterval(id);
    }, [isPlaying, durationSec]);

    useEffect(() => {
      if (currentTimeSec >= durationSec) setIsPlaying(false);
    }, [currentTimeSec, durationSec]);

    useEffect(() => {
      if (viewMode !== 'review') return;
      let idx = -1;
      for (let i = 0; i < resolvedEvents.length; i += 1) {
        if (parseMatchClockToSeconds(String(resolvedEvents[i].time)) <= currentTimeSec + 1) {
          idx = i;
        }
      }
      if (idx < 0) return;
      const candidate = resolvedEvents[idx];
      if (candidate?.id !== activeEventId) {
        setActiveEventId(candidate.id);
        ignoreCollapseUntilRef.current = Date.now() + 450;
        eventItemRefs.current[candidate.id]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, [currentTimeSec, viewMode, resolvedEvents, activeEventId]);

    useEffect(() => {
      if (!showScoreEditModal) return;
      setEditingScoreA(String(liveSoccerStats.teamA.score));
      setEditingScoreB(String(liveSoccerStats.teamB.score));
      setEditingNameA(String((liveSoccerStats.teamA as { displayLabel: string }).displayLabel));
      setEditingNameB(String((liveSoccerStats.teamB as { displayLabel: string }).displayLabel));
    }, [showScoreEditModal, liveSoccerStats]);

    const handleSeekToEvent = (event: { id: number; time: string; scoreType: string }) => {
      const sec = parseMatchClockToSeconds(String(event.time));
      setCurrentTimeSec(sec);
      if (viewMode === 'review') {
        setActiveEventId(event.id);
      }
      setToastMessage(t('ui.jumpToEvent', { event: scoreTypeLabel(String(event.scoreType)) }));
      setTimeout(() => setToastMessage(null), 1200);
    };

    const formatClock = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const scoreTypeLabel = (scoreType: string) => {
      if (scoreType === 'goal') return t('ui.eventGoal');
      if (scoreType === 'corner') return t('ui.eventCornerKick');
      if (scoreType === 'setpiece') return t('ui.eventFreeKick');
      return t('ui.eventPenaltyKicks');
    };

    const scoreTypeIcon = (scoreType: string) => {
      if (scoreType === 'goal') return <CircleDot className="w-3.5 h-3.5 text-emerald-300" />;
      if (scoreType === 'corner') return <Hexagon className="w-3.5 h-3.5 text-sky-300" />;
      if (scoreType === 'setpiece') return <Disc className="w-3.5 h-3.5 text-violet-300" />;
      return <Target className="w-3.5 h-3.5 text-amber-300" />;
    };

    const startEditEvent = (event: { id: number; time: string; scoreType: string }) => {
      setEditingEventId(event.id);
      setEventDraft({ scoreType: String(event.scoreType), time: String(event.time) });
    };

    const saveEventEdit = (eventId: number) => {
      const timeRegex = /^([0-5]?[0-9]):([0-5][0-9])$/;
      if (!timeRegex.test(eventDraft.time)) {
        setToastMessage(t('matchReport.scoreEditInvalid'));
        setTimeout(() => setToastMessage(null), 1600);
        return;
      }
      setEventCorrections((prev) => ({
        ...prev,
        [eventId]: { scoreType: eventDraft.scoreType, time: eventDraft.time },
      }));
      setEditingEventId(null);
      setToastMessage(t('ui.updated'));
      setTimeout(() => setToastMessage(null), 1200);
    };

    const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (Date.now() < ignoreCollapseUntilRef.current) return;
      const top = e.currentTarget.scrollTop;
      if (top > 12 && !isScoreCollapsed) setIsScoreCollapsed(true);
      if (top <= 4 && isScoreCollapsed) setIsScoreCollapsed(false);
    };

    const handleSaveSoccerScore = () => {
      const scoreA = Number.parseInt(editingScoreA, 10);
      const scoreB = Number.parseInt(editingScoreB, 10);
      const invalid = !Number.isFinite(scoreA) || !Number.isFinite(scoreB) || scoreA < 0 || scoreB < 0 || scoreA > 99 || scoreB > 99;
      if (invalid) {
        setToastMessage(t('matchReport.scoreEditInvalid'));
        setTimeout(() => setToastMessage(null), 2200);
        return;
      }
      updateSoccerMatchPresentation({
        teamAScore: scoreA,
        teamBScore: scoreB,
        teamALabel: editingNameA,
        teamBLabel: editingNameB,
      });
      setShowScoreEditModal(false);
      setToastMessage(t('matchReport.scoreEditSaved'));
      setTimeout(() => setToastMessage(null), 1200);
    };

    const shareMatchVideo = () => {
      setShareType('all');
      setShareContext({ type: 'all' });
      setShowShareModal(true);
    };

    useEffect(() => {
      setCarouselIndex(0);
    }, [activeTimelineFilter]);

    const activeKeyEvent = filteredTimelineEvents.length > 0 ? filteredTimelineEvents[carouselIndex % filteredTimelineEvents.length] : null;

    const timelineFilters: Array<{ id: 'all' | 'goal' | 'corner' | 'setpiece' | 'penalty'; label: string }> = [
      { id: 'all', label: t('filter.all') },
      { id: 'goal', label: scoreTypeLabel('goal') },
      { id: 'corner', label: scoreTypeLabel('corner') },
      { id: 'setpiece', label: scoreTypeLabel('setpiece') },
      { id: 'penalty', label: scoreTypeLabel('penalty') },
    ];

    if (!isSoccer) {
      return (
        <div className="h-full bg-[#0F172A] text-white flex flex-col items-center justify-center px-6 text-center">
          <FileText className="w-10 h-10 text-slate-500 mb-3" />
          <p className="text-sm font-bold">{t('matchReport.sessionTitle')}</p>
          <p className="text-xs text-slate-400 mt-2">{t('ui.eventReview')}</p>
          <button onClick={popToHome} className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-sm font-bold">{t('ui.backToHome')}</button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-[#0F172A] text-white relative">
        <div className="absolute top-4 left-4 z-30">
          <button onClick={popToHome} className="p-2 bg-black/40 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {galleryHybridDemoView === 'edge_result' && (
          <div className="relative z-20 px-4 pt-14 pb-2">
            <div className="rounded-xl border border-emerald-500/45 bg-emerald-950/55 px-3 py-2.5 space-y-2">
              <p className="text-[12px] font-bold text-white leading-snug">{t('gallery.hybridEdgeBannerTitle')}</p>
              <p className="text-[10px] text-emerald-100/85 leading-relaxed">{t('gallery.hybridEdgeBannerSub')}</p>
              <button
                type="button"
                onClick={() => {
                  setGalleryHybridDemoView('cloud_result');
                  setToastMessage(t('gallery.hybridCloudPreviewToast'));
                  setTimeout(() => setToastMessage(null), 1800);
                }}
                className="w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
              >
                {t('gallery.hybridUploadToCloudCta')}
              </button>
            </div>
          </div>
        )}

        <div
          className={`px-4 ${galleryHybridDemoView === 'edge_result' ? 'pt-0' : 'pt-14'} pb-2 bg-[#0F172A] border-b border-white/10 transition-all`}
        >
          <div className={`rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/80 via-[#111827] to-[#0F172A] transition-all ${isScoreCollapsed ? 'px-2.5 py-1.5' : 'p-3 space-y-3'}`}>
            <div className="flex items-center justify-between gap-2">
              {!isScoreCollapsed && <span className="text-[10px] font-bold text-emerald-200/90 tracking-wide">{t('matchReport.gameStatistics')}</span>}
              <div className="flex items-center gap-2">
                {!isScoreCollapsed && (
                  <button type="button" onClick={() => setShowScoreEditModal(true)} className="text-[9px] font-bold px-2 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-100 inline-flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    {t('matchReport.adjustMatchButton')}
                  </button>
                )}
                <button type="button" onClick={() => setIsScoreCollapsed((prev) => !prev)} className="text-[9px] font-bold px-2 py-1 rounded-full bg-slate-800 border border-white/15 text-slate-100 whitespace-nowrap">
                  {isScoreCollapsed ? t('ui.expandDetail') : t('ui.collapseDetail')}
                </button>
              </div>
            </div>
            <div className={`${isScoreCollapsed ? 'mt-0.5' : 'mt-2'} grid grid-cols-3 items-end`}>
              <div className="text-left">
                <p className={`${isScoreCollapsed ? 'text-xl' : 'text-3xl'} font-black ${liveSoccerStats.teamA.color}`}>{liveSoccerStats.teamA.score}</p>
                {!isScoreCollapsed && <p className="text-[11px] font-bold text-slate-200">{(liveSoccerStats.teamA as { displayLabel: string }).displayLabel}</p>}
              </div>
              <div className={`text-center text-slate-500 ${isScoreCollapsed ? 'text-[10px] pb-0' : 'text-xs pb-1'} font-black`}>VS</div>
              <div className="text-right">
                <p className={`${isScoreCollapsed ? 'text-xl' : 'text-3xl'} font-black ${liveSoccerStats.teamB.color}`}>{liveSoccerStats.teamB.score}</p>
                {!isScoreCollapsed && <p className="text-[11px] font-bold text-slate-200">{(liveSoccerStats.teamB as { displayLabel: string }).displayLabel}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[176px] bg-black relative shrink-0 border-y border-white/10">
          <AssetThumbnail type="video" category={resultSport || 'soccer'} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-3 right-4 z-20">
            <div className="rounded-full p-1 bg-slate-950/80 border border-white/20 flex gap-1 shadow-lg backdrop-blur">
              <button type="button" onClick={() => setViewMode('review')} className={`px-3 py-1 rounded-full text-[10px] font-bold ${viewMode === 'review' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>
                {t('ui.eventReview')}
              </button>
              <button type="button" onClick={() => setViewMode('fullMatch')} className={`px-3 py-1 rounded-full text-[10px] font-bold ${viewMode === 'fullMatch' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}>
                {t('ui.fullMatchView')}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            {isPlaying ? <Minimize2 className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white" />}
          </button>
          <div className="absolute left-4 right-4 bottom-3">
            <div className="flex justify-between text-[10px] font-mono text-white/85 mb-1">
              <span>{formatClock(currentTimeSec)}</span>
              <span>{formatClock(durationSec)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={durationSec}
              value={currentTimeSec}
              onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            {viewMode === 'fullMatch' && (
              <p className="text-[9px] text-slate-300 mt-1">{t('ui.fullMatchNoSync')}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" data-correction-scroll onScroll={handleTimelineScroll}>
          <div className="px-4 py-3 space-y-3 pb-24">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{t('ui.matchFlowTitle')}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('ui.matchFlowSubtitle')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={resolvedEvents.length === 0}
                    onClick={() => setCarouselIndex((prev) => (resolvedEvents.length ? (prev - 1 + resolvedEvents.length) % resolvedEvents.length : 0))}
                    className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center disabled:opacity-40"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={resolvedEvents.length === 0}
                    onClick={() => setCarouselIndex((prev) => (resolvedEvents.length ? (prev + 1) % resolvedEvents.length : 0))}
                    className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2">
                {timelineFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveTimelineFilter(filter.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
                      activeTimelineFilter === filter.id
                        ? 'bg-blue-600/95 text-white border-blue-500 shadow-sm shadow-blue-900/40'
                        : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700/80'
                    }`}
                  >
                    {filter.id === 'all' ? (
                      <Filter className="w-3.5 h-3.5" />
                    ) : (
                      scoreTypeIcon(filter.id)
                    )}
                    {filter.label}
                  </button>
                ))}
              </div>
              {activeKeyEvent ? (
                <button
                  type="button"
                  onClick={() => handleSeekToEvent(activeKeyEvent)}
                  className="w-full text-left rounded-lg border border-emerald-500/35 bg-emerald-900/15 px-2.5 py-1.5"
                >
                  <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0 text-emerald-100">
                      {scoreTypeIcon(String(activeKeyEvent.scoreType))}
                      <span className="font-bold truncate">{scoreTypeLabel(String(activeKeyEvent.scoreType))}</span>
                    </div>
                    <span className="font-mono text-slate-200">{activeKeyEvent.time}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        activeKeyEvent.team === 'A'
                          ? 'bg-blue-600/85 text-white'
                          : 'bg-red-600/85 text-white'
                      }`}
                    >
                      {activeKeyEvent.team === 'A' ? t('ui.teamA') : t('ui.teamB')}
                    </span>
                    <span className="text-slate-300">{carouselIndex + 1}/{filteredTimelineEvents.length}</span>
                  </div>
                </button>
              ) : (
                <p className="text-xs text-slate-500">{t('ui.noEventsInType')}</p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
              <div className="relative">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-2 px-1">
                  <span className="text-[10px] font-bold text-blue-300">{t('ui.teamA')}</span>
                  <span className="text-[9px] text-slate-500">TIME</span>
                  <span className="text-[10px] font-bold text-red-300 text-right">{t('ui.teamB')}</span>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-7 bottom-1 w-px bg-white/15" />
                <div className="space-y-2">
                  {filteredTimelineEvents.map((event) => {
                    const isActive = activeEventId === event.id;
                    const isEditing = editingEventId === event.id;
                    return (
                      <div
                        key={event.id}
                        ref={(el) => {
                          eventItemRefs.current[event.id] = el;
                        }}
                        className="relative"
                      >
                        {!isEditing ? (
                          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                            <button
                              type="button"
                              onClick={() => handleSeekToEvent(event as any)}
                              className={`min-h-[68px] text-left rounded-lg border p-2 transition-colors ${event.team === 'A' ? `${isActive && viewMode === 'review' ? 'border-blue-500 bg-blue-500/15' : 'border-white/10 bg-[#1E293B]/70'}` : 'opacity-25 border-white/5 bg-[#111827]/40'}`}
                              disabled={event.team !== 'A'}
                            >
                              {event.team === 'A' && (
                                <>
                                  <div className="mt-1 flex items-center gap-2">
                                    {scoreTypeIcon(String(event.scoreType))}
                                    <span className="text-xs font-bold text-slate-100">{scoreTypeLabel(String(event.scoreType))}</span>
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditEvent(event as any);
                                      }}
                                      className="text-[10px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 inline-flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      {t('ui.edit')}
                                    </button>
                                  </div>
                                </>
                              )}
                            </button>
                            <div className="flex flex-col items-center justify-start pt-2.5 px-1">
                              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{event.time}</span>
                              <div className={`mt-1 w-3 h-3 rounded-full border-2 ${event.team === 'A' ? 'bg-blue-500 border-[#0F172A]' : 'bg-red-500 border-[#0F172A]'}`} />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSeekToEvent(event as any)}
                              className={`min-h-[68px] text-left rounded-lg border p-2 transition-colors ${event.team === 'B' ? `${isActive && viewMode === 'review' ? 'border-red-500 bg-red-500/15' : 'border-white/10 bg-[#1E293B]/70'}` : 'opacity-25 border-white/5 bg-[#111827]/40'}`}
                              disabled={event.team !== 'B'}
                            >
                              {event.team === 'B' && (
                                <>
                                  <div className="mt-1 flex items-center gap-2">
                                    {scoreTypeIcon(String(event.scoreType))}
                                    <span className="text-xs font-bold text-slate-100">{scoreTypeLabel(String(event.scoreType))}</span>
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditEvent(event as any);
                                      }}
                                      className="text-[10px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 inline-flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      {t('ui.edit')}
                                    </button>
                                  </div>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-white/10 bg-[#1E293B]/80 p-2.5 space-y-2">
                            <div className="text-[10px] font-bold text-slate-300">{event.team === 'A' ? t('ui.teamA') : t('ui.teamB')} · {event.time}</div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="text-[10px] text-slate-400">
                                {t('ui.typeLabel')}
                                <select
                                  className="mt-1 w-full rounded bg-slate-800 border border-white/10 px-2 py-1 text-xs text-white"
                                  value={eventDraft.scoreType}
                                  onChange={(e) => setEventDraft((prev) => ({ ...prev, scoreType: e.target.value }))}
                                >
                                  <option value="goal">{t('ui.eventGoal')}</option>
                                  <option value="corner">{t('ui.eventCornerKick')}</option>
                                  <option value="setpiece">{t('ui.eventFreeKick')}</option>
                                  <option value="penalty">{t('ui.eventPenaltyKicks')}</option>
                                </select>
                              </label>
                              <label className="text-[10px] text-slate-400">
                                {t('ui.clipTimeLabel')}
                                <input
                                  value={eventDraft.time}
                                  onChange={(e) => setEventDraft((prev) => ({ ...prev, time: e.target.value }))}
                                  className="mt-1 w-full rounded bg-slate-800 border border-white/10 px-2 py-1 text-xs text-white font-mono"
                                />
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingEventId(null)} className="flex-1 py-1.5 rounded bg-slate-700 text-xs font-bold">{t('ui.cancel')}</button>
                              <button type="button" onClick={() => saveEventEdit(event.id)} className="flex-1 py-1.5 rounded bg-blue-600 text-xs font-bold">{t('ui.save')}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredTimelineEvents.length === 0 && <p className="text-xs text-slate-500 pl-2">{t('ui.noEventsInType')}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#0F172A] border-t border-white/10">
          <button onClick={shareMatchVideo} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> {t('ui.shareMatchVideo')}
          </button>
        </div>

        {showScoreEditModal && (
          <div className="absolute inset-0 z-40 flex items-end">
            <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setShowScoreEditModal(false)} aria-label="close" />
            <div className="relative w-full rounded-t-3xl bg-[#111827] border-t border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">{t('matchReport.editMatchPresentation')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[10px] text-slate-400">{t('matchReport.teamNameSideA')}</span>
                  <input type="text" maxLength={24} value={editingNameA} onChange={(e) => setEditingNameA(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] text-slate-400">{t('matchReport.teamNameSideB')}</span>
                  <input type="text" maxLength={24} value={editingNameB} onChange={(e) => setEditingNameB(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[10px] text-slate-400">{t('matchReport.scoreSideA')}</span>
                  <input type="number" min={0} max={99} inputMode="numeric" value={editingScoreA} onChange={(e) => setEditingScoreA(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] text-slate-400">{t('matchReport.scoreSideB')}</span>
                  <input type="number" min={0} max={99} inputMode="numeric" value={editingScoreB} onChange={(e) => setEditingScoreB(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowScoreEditModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold">{t('ui.cancel')}</button>
                <button type="button" onClick={handleSaveSoccerScore} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold">{t('ui.save')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Merge Preview Screen Component ---

  const MergePreviewScreen = () => {

    const { popView, setShowShareModal, shareContext, t, setToastMessage } = useAppContext();

    const isTraining = shareContext.type === 'pro_training_video';

    const mockDurationSec = isTraining ? 300 : 120;

    const [isPlaying, setIsPlaying] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
      if (!isPlaying) return;
      const id = window.setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, mockDurationSec));
      }, 1000);
      return () => window.clearInterval(id);
    }, [isPlaying, mockDurationSec]);

    useEffect(() => {
      if (currentTime >= mockDurationSec) setIsPlaying(false);
    }, [currentTime, mockDurationSec]);

    const handlePlayPause = () => {
      if (currentTime >= mockDurationSec) setCurrentTime(0);
      setIsPlaying(!isPlaying);
    };

    const handleShare = () => {
      setShowShareModal(true);
    };

    const handleRemerge = () => {
      popView();
    };

    const trainingBadge =
      isTraining &&
      (shareContext.variant === 'issue_drill'
        ? t('proTrainReview.badgePaidDrill')
        : shareContext.tier === 'curated_sample'
          ? t('trainingPlans.badgeSample')
          : t('trainingPlans.badgePaid'));

    const trainingPlayerBg =
      isTraining && shareContext.sport === 'soccer'
        ? 'from-emerald-800/90 via-teal-950 to-black'
        : 'from-violet-700/90 via-indigo-950 to-black';

    const previewTitle =
      shareContext.type === 'player_clips' && shareContext.playerLabel
        ? `${shareContext.playerLabel} 集锦`
        : shareContext.type === 'template_compose'
          ? t(shareContext.templateLabelKey)
          : shareContext.type === 'pro_training_video'
            ? t(shareContext.titleKey)
            : t('matchReport.mergePreviewTitle');

    const formatClock = (sec: number) =>
      `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

    return (

      <div className="h-full bg-[#0F172A] flex flex-col">

          <div className="flex items-center justify-between p-4 border-b border-white/10">

              <button type="button" onClick={popView} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <div className="flex-1 min-w-0 px-2 text-center">
                <h2 className="text-base font-bold text-white line-clamp-2 leading-tight">{previewTitle}</h2>
                {isTraining && (
                  <p className="text-[10px] text-slate-400 mt-1">{t(shareContext.durationKey)}</p>
                )}
              </div>

              <div className="w-9 shrink-0" />

          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-black relative overflow-hidden">
              {isTraining && (shareContext.focusKey || shareContext.descKey) && (
                <div className="shrink-0 px-4 py-2.5 bg-slate-900/95 border-b border-white/10">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {shareContext.focusKey ? t(shareContext.focusKey) : t(shareContext.descKey!)}
                  </p>
                </div>
              )}

              <div
                className={`flex-1 flex flex-col items-center justify-center relative min-h-0 ${
                  isTraining ? `bg-gradient-to-br ${trainingPlayerBg}` : 'bg-gradient-to-br from-slate-800 to-slate-900'
                }`}
              >
                  {isTraining && (
                    <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 bg-black/40 text-amber-100">
                      {trainingBadge}
                    </span>
                  )}

                  {!isPlaying && (
                      <button
                          type="button"
                          onClick={handlePlayPause}
                          className="absolute z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                          <Play className="w-8 h-8 text-white" />
                      </button>
                  )}

                  <div className="w-full px-6 flex flex-col items-center justify-center text-center">
                      <Film className={`w-16 h-16 mx-auto mb-3 ${isTraining ? 'text-white/40' : 'text-slate-600'}`} />
                      <p className={`text-sm font-bold ${isTraining ? 'text-white/95' : 'text-slate-400'}`}>
                        {isTraining ? t('trainingPlans.previewPlayerKicker') : t('matchReport.mergePreviewPlaceholderTitle')}
                      </p>
                      <p className={`text-xs mt-2 leading-relaxed max-w-sm ${isTraining ? 'text-white/70' : 'text-slate-500'}`}>
                        {isTraining ? t('trainingPlans.previewPlayerBody') : t('matchReport.mergePreviewPlaceholderDur', { time: formatClock(mockDurationSec) })}
                      </p>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-between text-[10px] font-mono text-white/80 mb-1">
                      <span>{formatClock(currentTime)}</span>
                      <span>{formatClock(mockDurationSec)}</span>
                    </div>
                    <div className="h-1 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${isTraining ? 'bg-violet-400' : 'bg-blue-500'}`}
                        style={{ width: `${mockDurationSec ? (currentTime / mockDurationSec) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

              </div>

          </div>

          <div className="p-4 bg-[#0F172A] border-t border-white/10 shrink-0">

              <div className="flex gap-3 mb-3">
                  <button
                      type="button"
                      onClick={handlePlayPause}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                      {isPlaying ? (
                          <>
                              <Minimize2 className="w-4 h-4" /> {t('ui.pause')}
                          </>
                      ) : (
                          <>
                              <Play className="w-4 h-4" /> {t('trainingPlans.previewPlay')}
                          </>
                      )}
                  </button>
              </div>

              {isTraining ? (
                  <div className="flex gap-3">
                      <button
                          type="button"
                          onClick={() => {
                            setToastMessage(t('trainingPlans.favoriteDemoToast'));
                            setTimeout(() => setToastMessage(null), 2400);
                          }}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                          <Save className="w-4 h-4" /> {t('trainingPlans.favoriteDemo')}
                      </button>
                      <button
                          type="button"
                          onClick={popView}
                          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                          <ArrowLeft className="w-4 h-4" /> {t('trainingPlans.backToReport')}
                      </button>
                  </div>
              ) : (
                  <div className="flex gap-3">
                      <button
                          type="button"
                          onClick={handleRemerge}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                          <RotateCcw className="w-4 h-4" /> {t('matchReport.mergePreviewRemerge')}
                      </button>
                      <button
                          type="button"
                          onClick={handleShare}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-colors"
                      >
                          <Share2 className="w-4 h-4" /> {t('matchReport.mergePreviewShare')}
                      </button>
                  </div>
              )}

          </div>

      </div>

    );

  };

  const HomeScreen = () => {

    const { 

        t, pushView, transferStep, transferProgress, handleEntryClick, setTargetAnalysisType, setAiMode, setIsTaskCompleted, networkState, falconState, setNetworkState, setFalconState, setToastMessage, setResultSport, setSelectionMode, setSportType,

        isVip, cloudTasks, assetDocFilter, setAssetDocFilter, setHighlightEntryIntent,

    } = useAppContext();

    const assetItemsAll = React.useMemo(() => buildAssetItems(cloudTasks || []), [cloudTasks]);
    const assetItems = React.useMemo(
      () => filterAssetItems(assetItemsAll, assetDocFilter).filter((it) => it.cover === 'soccer'),
      [assetItemsAll, assetDocFilter]
    );

    const [toolboxHomeTab, setToolboxHomeTab] = useState<'quality_templates' | 'my_projects'>('quality_templates');
    const [templateTempo, setTemplateTempo] = useState<'all' | 'slow' | 'fast'>('all');
    const templateCards = React.useMemo(() => {
      if (templateTempo === 'all') return TOOLBOX_QUALITY_TEMPLATES.filter((tm) => tm.cover === 'soccer');
      if (templateTempo === 'slow') return TOOLBOX_QUALITY_TEMPLATES.filter((tm) => tm.cover === 'soccer' && tm.id !== 'qt2');
      return TOOLBOX_QUALITY_TEMPLATES.filter((tm) => tm.cover === 'soccer' && tm.id !== 'qt6');
    }, [templateTempo]);

    const openHighlightToolbox = (intent: 'template_compose' | 'merge_export' | 'manual_edit') => {
      setHighlightEntryIntent(intent);
      setTargetAnalysisType('highlight');
      setAiMode('cloud');
      setIsTaskCompleted(true);
      setResultSport('soccer');
      pushView('ai_result_highlight');
    };

    // Manual Toggle Handlers for Header

    const toggleNetwork = () => {

        const nextState = networkState === 'wifi' ? 'offline' : 'wifi';

        setNetworkState(nextState);

        setToastMessage(nextState === 'offline' ? '已模拟断网' : '网络已恢复');

        setTimeout(() => setToastMessage(null), 2000);

    };

    const toggleFalcon = () => {

        const nextState = falconState === 'connected' ? 'disconnected' : 'connected';

        setFalconState(nextState);

        setToastMessage(nextState === 'disconnected' ? '已模拟设备断开' : '设备已连接');

        setTimeout(() => setToastMessage(null), 2000);

    };

    return (

    <div className="flex flex-col h-full bg-[#F5F5F5] relative">

      <TransferOverlay />

      <FloatingProgress />

      <div className="pt-12 pb-2 px-5 bg-white flex justify-between items-start sticky top-0 z-10 border-b border-slate-100">

        <div className="min-w-0 pr-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Studio</h1>
        </div>

        <div className="flex gap-2">

           {/* Language switcher */}
           <button
             onClick={() => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
             className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold"
             title={i18n.language === 'zh' ? '切换到英文' : 'Switch to Chinese'}
           >
             {i18n.language === 'zh' ? 'EN' : '中'}
           </button>

           {/* Interactive Status Icons */}

           <div className="flex items-center gap-2 mr-1">

               <button onClick={toggleNetwork} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${networkState === 'offline' ? 'bg-red-100 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>

                   {networkState === 'offline' ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}

               </button>

               <button onClick={toggleFalcon} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${falconState === 'disconnected' ? 'bg-red-100 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>

                   {falconState === 'disconnected' ? <div className="w-3 h-3 rounded-sm border-2 border-current relative"><div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div></div> : <div className="w-3 h-3 rounded-sm border-2 border-current"></div>}

               </button>

           </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => pushView('task_center')}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors relative"
              title={t('ui.historyTasksHint')}
            >
              {transferStep !== 'idle' && transferStep !== 'completed' ? (
                <div className="absolute inset-0">
                  <svg className="w-full h-full -rotate-90 p-0.5" viewBox="0 0 36 36">
                    <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path
                      className={`${transferStep === 'failed' ? 'text-red-500' : transferStep === 'paused' ? 'text-yellow-500' : 'text-blue-500'} transition-all duration-300`}
                      strokeDasharray={`${transferProgress}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => pushView('transfer_list')}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
              title={t('transferList.title')}
            >
              <ArrowDownUp className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => {
              handleEntryClick('highlight');
              setResultSport('soccer');
            }}
            className="w-full rounded-2xl border border-orange-200/60 bg-[#FFF7F4] p-5 flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4" />
            </span>
            <span className="font-black text-orange-600 text-[22px] leading-none">New Project</span>
          </button>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                handleEntryClick('highlight');
                setResultSport('soccer');
              }}
              className="col-span-1 rounded-2xl border border-slate-200 bg-white p-3 text-left flex flex-col items-center justify-center min-h-[112px]"
            >
              <PlayCircle className="w-8 h-8 text-slate-700" />
              <span className="text-sm font-bold text-slate-800 mt-1.5">Auto Edit</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Videos with Markers</span>
            </button>
            <div className="col-span-2 grid grid-rows-2 gap-2.5">
              <button
                type="button"
                onClick={() => openHighlightToolbox('manual_edit')}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2.5"
              >
                <Target className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-bold text-slate-800">Edit Markers</span>
              </button>
              <button
                type="button"
                onClick={() => openHighlightToolbox('merge_export')}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2.5"
              >
                <Layers className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-bold text-slate-800">Fast Video Merge</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              handleEntryClick('analysis');
              setResultSport('soccer');
            }}
            className="w-full rounded-2xl bg-[#2f2f32] text-white px-3.5 py-3 flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center">
                <span className="text-lg font-black">AI</span>
              </span>
              <span className="text-left">
                <span className="block text-[12px] font-bold">AI Analysis</span>
                <span className="block text-[10px] text-white/70">Quickly detect game highlights</span>
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-white/75" />
          </button>
        </section>

        <section className="min-h-[240px]">
          <div className="flex items-end justify-between gap-3 mb-3 px-0.5">
            <div className="flex items-center gap-8 min-w-0">
              <button
                type="button"
                onClick={() => setToolboxHomeTab('quality_templates')}
                className={`relative pb-1 text-[22px] font-black transition-colors ${
                  toolboxHomeTab === 'quality_templates' ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {t('ui.toolboxSubTabTemplates')}
                {toolboxHomeTab === 'quality_templates' && <span className="absolute left-0 right-0 -bottom-0.5 h-1 bg-orange-500 rounded-full" />}
              </button>
              <button
                type="button"
                onClick={() => setToolboxHomeTab('my_projects')}
                className={`relative pb-1 text-[22px] font-black transition-colors ${
                  toolboxHomeTab === 'my_projects' ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {t('ui.toolboxSubTabMyProjects')}
                {toolboxHomeTab === 'my_projects' && <span className="absolute left-0 right-0 -bottom-0.5 h-1 bg-orange-500 rounded-full" />}
              </button>
            </div>
            {toolboxHomeTab === 'my_projects' && (
              <button
                type="button"
                onClick={() => pushView('task_center')}
                className="flex items-center gap-0.5 shrink-0 text-[13px] font-bold text-slate-600 active:text-slate-900 pb-1 -mr-0.5"
              >
                {t('ui.openTaskCenterFromDocs')}
                <ChevronRight className="w-[18px] h-[18px] text-slate-400" />
              </button>
            )}
          </div>

          {toolboxHomeTab === 'quality_templates' && (
            <>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { id: 'all' as const, label: 'All' },
                  { id: 'slow' as const, label: 'Slow tempo' },
                  { id: 'fast' as const, label: 'Fast tempo' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplateTempo(item.id)}
                    className={`shrink-0 px-4 py-2 rounded-lg text-[11px] font-bold border ${
                      templateTempo === item.id
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400/30'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {templateCards.map((tm) => {
                  const leftBadge = tm.badge === 'ai' ? t('ui.templateBadgeAi') : t('ui.templateBadgeClassic');
                  const leftClass =
                    tm.badge === 'ai' ? 'bg-orange-500 text-white border-orange-400/40' : 'bg-sky-600 text-white border-sky-400/40';
                  const rightBadge = tm.paid ? t('ui.paid') : t('ui.templateCurated');
                  const rightClass = tm.paid ? 'bg-pink-500/95 text-white border-pink-400/40' : 'bg-emerald-600/95 text-white border-emerald-400/40';
                  return (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => {
                        setToastMessage(t('toolbox.templateApplyHint'));
                        setTimeout(() => setToastMessage(null), 2500);
                      }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/60 overflow-hidden text-left active:scale-[0.98] transition-transform"
                    >
                      <div className="relative aspect-[4/3] bg-slate-100">
                        <AssetThumbnail type="video" category={tm.cover} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                          <Sparkles className="w-9 h-9 text-white/90 drop-shadow-md" />
                        </div>
                        <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md border shadow-sm ${leftClass}`}>
                          {leftBadge}
                        </span>
                        <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md border shadow-sm ${rightClass}`}>
                          {rightBadge}
                        </span>
                        <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white bg-black/45 px-1.5 py-0.5 rounded-md">
                          {tm.usage}
                          {t('toolbox.usageSuffix')}
                        </span>
                      </div>
                      <div className="p-2.5 pt-2">
                        <h4 className="font-bold text-[13px] text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem]">{t(tm.titleKey)}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                          {t(tm.descKey)} · {t(tm.tagKey)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {toolboxHomeTab === 'my_projects' && (
            <>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-0.5 px-0.5 mb-3">
                {(['all', 'cloud', 'drafts'] as AssetDocFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAssetDocFilter(f)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                      assetDocFilter === f
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 shadow-sm'
                    }`}
                  >
                    {t(`ui.assetFilter_${f}`)}
                  </button>
                ))}
              </div>

              {assetItems.length === 0 && (
                <div className="text-center text-slate-400 py-10 text-xs">{t('ui.assetsEmpty')}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {assetItems.map((it) => {
              const title = it.titleKey ? t(it.titleKey) : it.titleFallback || '';
              const dateStr = it.dateKey ? t(it.dateKey) : it.dateFallback || '';
              const onOpen = () => {
                if (it.kind === 'draft') {
                  setToastMessage(t('ui.draftContinueHint'));
                  setTimeout(() => setToastMessage(null), 2500);
                  return;
                }
                if (it.kind === 'cloud_job') {
                  pushView('task_center');
                  return;
                }
                if (it.kind === 'failed') {
                  setToastMessage(t('ui.assetFailedHint'));
                  setTimeout(() => setToastMessage(null), 2500);
                  return;
                }
                if (it.kind === 'paused') {
                  setToastMessage(t('ui.assetPausedHint'));
                  setTimeout(() => setToastMessage(null), 2500);
                  return;
                }
                if (it.kind === 'completed_match' && it.analysisType) {
                  setTargetAnalysisType(it.analysisType);
                  setAiMode('cloud');
                  setIsTaskCompleted(true);
                  setResultSport(it.cover);
                  pushView(it.analysisType === 'highlight' ? 'ai_result_highlight' : 'ai_result_analysis');
                }
              };

              const sportLabel = it.cover === 'soccer' ? t('matchReport.sportSoccer') : t('matchReport.sportBasketball');

              /** 统一 AI 分析服务：卡片仅左上角单一标签（草稿 / 运动类型），不叠「集锦 vs 数据」产品档 */
              const leftTag = it.kind === 'draft' ? t('ui.assetBadgeDraft') : sportLabel;
              const leftTagClass =
                it.kind === 'draft'
                  ? 'bg-amber-500 text-white border-amber-400/50'
                  : it.cover === 'soccer'
                    ? 'bg-emerald-600 text-white border-emerald-500/40'
                    : 'bg-orange-600 text-white border-orange-500/40';

              let subtitle = dateStr;
              if (it.kind === 'failed') {
                subtitle = it.failureReasonKey ? `${dateStr} · ${t(it.failureReasonKey)}` : `${dateStr} · ${t('ui.failed')}`;
              } else if (it.kind === 'paused') {
                subtitle = `${dateStr} · ${t('ui.paused')}`;
              }

              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={onOpen}
                  className="bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/60 overflow-hidden text-left active:scale-[0.98] transition-transform"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <AssetThumbnail type="video" category={it.cover} />
                    {(it.kind === 'completed_match' || it.kind === 'failed') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle className="w-10 h-10 text-white/90 drop-shadow-md" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md border shadow-sm ${leftTagClass}`}
                    >
                      {leftTag}
                    </span>
                  </div>
                  <div className="p-2.5 pt-2">
                    <h4 className="font-bold text-[13px] text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem]">{title}</h4>
                    {subtitle ? (
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-1">{subtitle}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
              </div>
            </>
          )}
        </section>

      </div>

      <div className="h-[83px] bg-white border-t border-slate-100 flex justify-around items-end pb-6 pt-2 absolute bottom-0 w-full z-10 px-1">

         <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><Home className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.home')}</span></div>

         <button
           type="button"
           onClick={() => {
             pushView('gallery');
           }}
           className="flex flex-col items-center gap-1 text-slate-600 w-14 mb-1 active:scale-95 transition-transform"
         >
           <ImageIcon className="w-6 h-6" />
           <span className="text-[10px] font-bold">{t('nav.gallery')}</span>
         </button>

         <div className="flex flex-col items-center justify-end -mt-6">

            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-900/20 border-[3px] border-white mb-1 active:scale-95 transition-transform"><Camera className="w-6 h-6" /></div>

            <span className="text-[10px] font-bold text-slate-900">{t('nav.shoot')}</span>

         </div>

         <div className="flex flex-col items-center gap-1 text-orange-500 w-14 mb-1"><CreditCard className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.toolbox')}</span></div>

         <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><User className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.my')}</span></div>

      </div>

    </div>

  );

  };

  const App = () => {

  const { t, i18n } = useTranslation();

  const [viewStack, setViewStack] = useState<ViewState[]>(['home']);

  const currentView = viewStack[viewStack.length - 1];

  const [showUpsellModal, setShowUpsellModal] = useState(false);

  const [showExportToast, setShowExportToast] = useState(false); 

  const [aiMode, setAiMode] = useState<AIMode>('cloud');

  const [analysisPipeline, setAnalysisPipeline] = useState<AnalysisPipeline>('falcon_direct_cloud');

  /** Hybrid pipeline: false = 端侧核心分析阶段；true = 已完成端侧，进入上传/云端全量阶段 */
  const [hybridPastEdge, setHybridPastEdge] = useState(false);

  /** 当前混合任务素材来源（用于重试时从下载或端侧分析重启） */
  const [hybridSourceMedia, setHybridSourceMedia] = useState<'falcon' | 'local' | null>(null);

  /** 相册第四条路线演示：从卡片进入赛果页时的预览类型 */
  const [galleryHybridDemoView, setGalleryHybridDemoView] = useState<null | 'edge_result' | 'cloud_result'>(null);

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');

  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);

  const [isTaskCompleted, setIsTaskCompleted] = useState(false); 

  const [sportType, setSportType] = useState<SportType>('soccer');

  // Subscription: isVip = true means member subscription. Members get the same paid capabilities (templates, stats, share, etc.).
  // Highlights entry stays available without subscription; full-game stats/analysis entry requires membership.
  const [isVip, setIsVip] = useState(false);

  const [targetAnalysisType, setTargetAnalysisType] = useState<AnalysisType>('highlight');

  

  // New: Result Context

  const [resultSport, setResultSport] = useState<string>('soccer'); // To toggle result view type

  /** 从工具箱进入高光页时的意图（由 HighlightResultScreen 消费后复位） */
  const [highlightEntryIntent, setHighlightEntryIntent] = useState<
    'none' | 'template_compose' | 'merge_export' | 'manual_edit'
  >('none');

  const [videoSourceTab, setVideoSourceTab] = useState<VideoSource>('all');

  const [videoSportFilter, setVideoSportFilter] = useState<SportType>('all');

  const [videoSortOrder, setVideoSortOrder] = useState<SortOrder>('newest');

  // --- Exception States ---

  const [transferStep, setTransferStep] = useState<TransferStep>('idle');

  const [transferProgress, setTransferProgress] = useState(0);

  const [isTransferMinimized, setIsTransferMinimized] = useState(false); 

  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'video' | 'image'>('all');

  const [assetDocFilter, setAssetDocFilter] = useState<AssetDocFilter>('all');

  const [showPostRecordCloudModal, setShowPostRecordCloudModal] = useState(false);

  const [postRecordModalPayload, setPostRecordModalPayload] = useState<{
    cloudAlreadyQueued: boolean;
    videoId: number;
    videoName: string;
    analysisType: AnalysisType;
    sport: string;
  } | null>(null);

  const prevTransferStepRef = useRef<TransferStep>('idle');

  /** 与 hybridPastEdge 同步，供传输进度 interval 内可靠读取 */
  const hybridPastEdgeRef = useRef(false);

  /** 混合路线：用户选「云端深析」时，Falcon 素材下载完成后跳过端侧快析，直接进入上云 */
  const hybridSkipEdgeAfterDownloadRef = useRef(false);

  /** 混合路线：用户选「极速本地快析」时，端侧阶段结束后不再上云（与运营文案一致） */
  const hybridLocalOnlyThisRunRef = useRef(false);

  /** 与 ref 同步，供 TransferOverlay / FloatingProgress 展示端侧「处理中」布局 */
  const [hybridLocalOnlyThisRun, setHybridLocalOnlyThisRun] = useState(false);

  /** 混合路线 +「专业云端深析」：流水线第三格走云端（Falcon→App→云→AI），而非本机快析 */
  const [hybridCloudDeepThisRun, setHybridCloudDeepThisRun] = useState(false);

  /** 最近一次足球集锦云端分析完成时间戳（演示：直传云完成后写入，见 docs/soccer-mvp-api-contract.md） */
  const [soccerMvpCloudReadyAt, setSoccerMvpCloudReadyAt] = useState<number | null>(null);
  const [soccerDisplayScore, setSoccerDisplayScore] = useState(() => ({
    teamA: SOCCER_MATCH_STATS.teamA.score,
    teamB: SOCCER_MATCH_STATS.teamB.score,
  }));
  const [soccerTeamLabels, setSoccerTeamLabels] = useState(() => ({
    teamA: i18n.t('ui.teamA'),
    teamB: i18n.t('ui.teamB'),
  }));
  const liveSoccerStats = React.useMemo(
    () =>
      buildSoccerStatsWithScore(
        soccerDisplayScore.teamA,
        soccerDisplayScore.teamB,
        soccerTeamLabels.teamA,
        soccerTeamLabels.teamB
      ),
    [soccerDisplayScore.teamA, soccerDisplayScore.teamB, soccerTeamLabels.teamA, soccerTeamLabels.teamB]
  );
  const updateSoccerMatchPresentation = (patch: {
    teamAScore?: number;
    teamBScore?: number;
    teamALabel?: string;
    teamBLabel?: string;
  }) => {
    const clampScore = (n: number) => Math.max(0, Math.min(99, Math.trunc(n)));
    const normalizeName = (raw: string | undefined, fallbackKey: 'ui.teamA' | 'ui.teamB') => {
      if (raw === undefined) return undefined;
      const s = raw.trim().slice(0, 24);
      return s.length > 0 ? s : i18n.t(fallbackKey);
    };
    setSoccerDisplayScore((prev) => ({
      teamA: patch.teamAScore !== undefined ? clampScore(patch.teamAScore) : prev.teamA,
      teamB: patch.teamBScore !== undefined ? clampScore(patch.teamBScore) : prev.teamB,
    }));
    setSoccerTeamLabels((prev) => ({
      teamA:
        patch.teamALabel !== undefined ? normalizeName(patch.teamALabel, 'ui.teamA')! : prev.teamA,
      teamB:
        patch.teamBLabel !== undefined ? normalizeName(patch.teamBLabel, 'ui.teamB')! : prev.teamB,
    }));
  };

  const lastSubmittedAnalysisRef = useRef<{ sport: string; analysisType: AnalysisType } | null>(null);

  useEffect(() => {
    hybridPastEdgeRef.current = hybridPastEdge;
  }, [hybridPastEdge]);

  useEffect(() => {
    if (transferStep === 'idle' || transferStep === 'completed') {
      setHybridPastEdge(false);
      hybridPastEdgeRef.current = false;
      hybridSkipEdgeAfterDownloadRef.current = false;
      hybridLocalOnlyThisRunRef.current = false;
      setHybridLocalOnlyThisRun(false);
      setHybridCloudDeepThisRun(false);
      setHybridSourceMedia(null);
    }
    if (transferStep === 'failed') {
      hybridSkipEdgeAfterDownloadRef.current = false;
      hybridLocalOnlyThisRunRef.current = false;
      setHybridLocalOnlyThisRun(false);
      setHybridCloudDeepThisRun(false);
    }
  }, [transferStep]);

  const [networkState, setNetworkState] = useState<NetworkState>('wifi');

  const [falconState, setFalconState] = useState<FalconState>('connected');

  const [storageState, setStorageState] = useState<'ok' | 'full'>('ok');

  const [failureReason, setFailureReason] = useState<string | null>(null);

  const [showCellularAlert, setShowCellularAlert] = useState(false);

  const [showStorageAlert, setShowStorageAlert] = useState(false);

  const [showCrashRecovery, setShowCrashRecovery] = useState(false);

  // New: Toast state for concurrency

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New: Analysis completion toast with action button
  const [analysisCompleteToast, setAnalysisCompleteToast] = useState<{
    show: boolean;
    message: string;
    targetAnalysisType: AnalysisType;
    resultSport: string;
  } | null>(null);

  // New: Progress Modal state

  const [progressModal, setProgressModal] = useState<{
    show: boolean;
    title: string;
    progress: number;
    message?: string;
  }>({
    show: false,
    title: '',
    progress: 0,
  });

  // New: Share Modal state

  const [showShareModal, setShowShareModal] = useState(false);

  const [shareType, setShareType] = useState<'all' | 'selected' | 'report'>('all');

  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);

  const [shareContext, setShareContext] = useState<ShareContext>({ type: 'all' });

  // Player claim state management: eventId -> user-defined label (e.g. "7号", "小明")
  const [eventClaims, setEventClaims] = useState<Record<number, string>>({});
  const [expandedPlayerKey, setExpandedPlayerKey] = useState<string | null>(null); // "team_label" e.g. "A_7号"
  const [selectedEventForClaim, setSelectedEventForClaim] = useState<number | null>(null);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);

  // Cloud task queue management
  const [cloudTasks, setCloudTasks] = useState<CloudTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const maxConcurrentTasks = 5;

  // Queue management functions
  const getAnalyzingTasksCount = () => {
    return cloudTasks.filter(task => task.status === 'analyzing').length;
  };

  const getQueuedTasks = () => {
    return cloudTasks.filter(task => task.status === 'queued').sort((a, b) => a.createdAt - b.createdAt);
  };

  const addCloudTask = (videoId: number, videoName: string, type: 'highlight' | 'analysis'): string => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const analyzingCount = getAnalyzingTasksCount();
    
    let status: CloudTaskStatus = 'uploading';
    let queuePosition: number | undefined = undefined;
    
    if (analyzingCount >= maxConcurrentTasks) {
      status = 'queued';
      const queuedTasks = getQueuedTasks();
      queuePosition = queuedTasks.length + 1;
    }
    
    const newTask: CloudTask = {
      id: taskId,
      videoId,
      videoName,
      type,
      status,
      progress: 0,
      queuePosition,
      createdAt: Date.now(),
    };
    
    setCloudTasks(prev => [...prev, newTask]);
    setCurrentTaskId(taskId);
    return taskId;
  };

  const startTaskAnalysis = (taskId: string) => {
    setCloudTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, status: 'analyzing' as CloudTaskStatus, progress: 0, queuePosition: undefined };
      }
      return task;
    }));
  };

  const updateTaskProgress = (taskId: string, progress: number) => {
    setCloudTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, progress: Math.min(progress, 100) };
      }
      return task;
    }));
  };

  const completeTask = (taskId: string) => {
    setCloudTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === taskId) {
          return { ...task, status: 'completed' as CloudTaskStatus, progress: 100 };
        }
        return task;
      });
      
      // Auto start next queued task
      const analyzingCount = updated.filter(task => task.status === 'analyzing').length;
      const queuedTasks = updated.filter(task => task.status === 'queued').sort((a, b) => a.createdAt - b.createdAt);
      
      if (analyzingCount < maxConcurrentTasks && queuedTasks.length > 0) {
        const nextTask = queuedTasks[0];
        const nextUpdated = updated.map(task => {
          if (task.id === nextTask.id) {
            return { ...task, status: 'analyzing' as CloudTaskStatus, progress: 0, queuePosition: undefined };
          }
          // Update queue positions for remaining queued tasks
          if (task.status === 'queued' && task.id !== nextTask.id && task.createdAt > nextTask.createdAt) {
            const newPosition = (task.queuePosition || 0) - 1;
            return { ...task, queuePosition: newPosition > 0 ? newPosition : undefined };
          }
          return task;
        });
        return nextUpdated;
      }
      
      return updated;
    });
    
    // Clear current task if it's the completed one
    if (currentTaskId === taskId) {
      setCurrentTaskId(null);
    }
  };

  const pushView = (view: ViewState) => setViewStack([...viewStack, view]);

  const popView = () => setViewStack(viewStack.slice(0, -1));

  const popToHome = () => {
    setGalleryHybridDemoView(null);
    setViewStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : ['home']));
  };

  const replaceView = (view: ViewState) => setViewStack(prev => [...prev.slice(0, -1), view]);

  const handleExport = () => { setShowExportToast(true); setTimeout(() => setShowExportToast(false), 2500); };

  const handleEntryClick = (type: AnalysisType) => { 

      // Storage check logic

      if (storageState === 'full') {

          setShowStorageAlert(true);

          return;

      }

      setTargetAnalysisType(type); 

      // Entry: highlight available to everyone; full-game stats/analysis requires membership.

      if (type === 'highlight') {

          setAiMode('cloud'); 

          setSelectionMode('single'); 

          pushView('media_picker'); 

      } else {

          if (isVip) { 

              setAiMode('cloud'); 

              setSelectionMode('single'); 

              pushView('media_picker'); 

          } else { 

              setShowUpsellModal(true); 

          } 

      }

  };

  const handleUnlockVip = () => { setIsVip(true); setShowUpsellModal(false); setAiMode('cloud'); setSelectionMode('single'); pushView('media_picker'); };

  const handleSelect = (id: number) => {

    if (selectionMode === 'single') {

        setSelectedMedia([id]);

    } else {

        setSelectedMedia(prev => {

            if (prev.includes(id)) return prev.filter(i => i !== id);

            return [...prev, id];

        });

    }

  };

  const submitAiAnalysis = (
    videoIds: number[],
    entrySurface: 'media_picker_next' | 'gallery_badge' | 'gallery_aggregate' | 'video_detail',
    mode: 'single' | 'merge',
    hybridTierChoice?: 'local_fast' | 'cloud_deep'
  ) => {
    if (videoIds.length === 0) {
      setToastMessage(t('ui.selectVideoFirst'));
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const selectedVideos = videoIds
      .map((id) => ALL_VIDEOS.find((video) => video.id === id))
      .filter(Boolean) as (typeof ALL_VIDEOS)[number][];
    if (selectedVideos.length === 0) return;

    const mainVideo = selectedVideos[0];
    const merged = mode === 'merge' && selectedVideos.length > 1;
    const taskName = merged
      ? t('ui.aiMergedTaskName', { title: t((mainVideo as any).labelKey), count: selectedVideos.length - 1 })
      : t((mainVideo as any).labelKey);

    lastSubmittedAnalysisRef.current = {
      sport: String((mainVideo as any).category || 'soccer'),
      analysisType: (targetAnalysisType || 'highlight') as AnalysisType,
    };
    setSoccerMvpCloudReadyAt(null);

    setSelectedMedia(videoIds);
    setSelectionMode(merged ? 'multiple' : 'single');

    hybridLocalOnlyThisRunRef.current = false;
    setHybridLocalOnlyThisRun(false);
    setHybridCloudDeepThisRun(false);

    console.info('[ai_entry]', {
      event: 'ai_entry_click',
      entrySurface,
      mode,
      segmentCount: selectedVideos.length,
      videoIds,
      hybridTierChoice: hybridTierChoice ?? null,
    });

    if (mainVideo.source === 'falcon') {
      setPostRecordModalPayload({
        cloudAlreadyQueued: false,
        videoId: mainVideo.id,
        videoName: taskName,
        analysisType: targetAnalysisType || 'highlight',
        sport: String((mainVideo as any).category || 'soccer'),
      });
      if (analysisPipeline === 'on_device') {
        setTransferStep('analyzing');
      } else if (analysisPipeline === 'falcon_direct_cloud') {
        setTransferStep('uploading');
      } else if (analysisPipeline === 'edge_cloud_hybrid') {
        hybridSkipEdgeAfterDownloadRef.current = hybridTierChoice === 'cloud_deep';
        const localOnly = hybridTierChoice === 'local_fast';
        const cloudDeep = hybridTierChoice === 'cloud_deep';
        hybridLocalOnlyThisRunRef.current = localOnly;
        setHybridLocalOnlyThisRun(localOnly);
        setHybridCloudDeepThisRun(cloudDeep);
        setHybridPastEdge(false);
        hybridPastEdgeRef.current = false;
        setHybridSourceMedia('falcon');
        setTransferStep('downloading');
      } else {
        setTransferStep('downloading');
      }
      setTransferProgress(0);
      pushView('home');
      return;
    }

    if (mainVideo.source === 'local') {
      if (analysisPipeline === 'on_device') {
        setPostRecordModalPayload({
          cloudAlreadyQueued: false,
          videoId: mainVideo.id,
          videoName: taskName,
          analysisType: targetAnalysisType || 'highlight',
          sport: String((mainVideo as any).category || 'soccer'),
        });
        setTransferStep('analyzing');
        setTransferProgress(0);
        pushView('home');
        if (merged) {
          setToastMessage(t('ui.aiMergeTaskCreated', { count: selectedVideos.length }));
          setTimeout(() => setToastMessage(null), 2800);
        }
        return;
      }

      if (analysisPipeline === 'edge_cloud_hybrid') {
        setPostRecordModalPayload({
          cloudAlreadyQueued: false,
          videoId: mainVideo.id,
          videoName: taskName,
          analysisType: targetAnalysisType || 'highlight',
          sport: String((mainVideo as any).category || 'soccer'),
        });
        if (hybridTierChoice === 'cloud_deep') {
          hybridLocalOnlyThisRunRef.current = false;
          setHybridLocalOnlyThisRun(false);
          setHybridCloudDeepThisRun(true);
          hybridPastEdgeRef.current = true;
          setHybridPastEdge(true);
          setHybridSourceMedia('local');
          addCloudTask(mainVideo.id, taskName, targetAnalysisType || 'highlight');
          setPostRecordModalPayload({
            cloudAlreadyQueued: true,
            videoId: mainVideo.id,
            videoName: taskName,
            analysisType: targetAnalysisType || 'highlight',
            sport: String((mainVideo as any).category || 'soccer'),
          });
          const analyzingCount = getAnalyzingTasksCount();
          const isQueued = analyzingCount >= maxConcurrentTasks;
          if (networkState === '4g') {
            setShowCellularAlert(true);
            pushView('home');
          } else if (networkState === 'offline') {
            setTransferStep('paused');
            pushView('home');
          } else {
            setTransferStep('uploading');
            setTransferProgress(0);
            pushView('home');
            if (isQueued) {
              setToastMessage('分析任务繁忙，等待排队分析');
              setTimeout(() => setToastMessage(null), 8000);
            } else if (merged) {
              setToastMessage(t('ui.aiMergeTaskCreated', { count: selectedVideos.length }));
              setTimeout(() => setToastMessage(null), 2800);
            }
          }
          return;
        }
        hybridLocalOnlyThisRunRef.current = true;
        setHybridLocalOnlyThisRun(true);
        setHybridCloudDeepThisRun(false);
        setHybridPastEdge(false);
        hybridPastEdgeRef.current = false;
        setHybridSourceMedia('local');
        setTransferStep('analyzing');
        setTransferProgress(0);
        pushView('home');
        if (merged) {
          setToastMessage(t('ui.aiMergeTaskCreated', { count: selectedVideos.length }));
          setTimeout(() => setToastMessage(null), 2800);
        }
        return;
      }

      hybridLocalOnlyThisRunRef.current = false;
      setHybridLocalOnlyThisRun(false);
      setHybridCloudDeepThisRun(false);
      addCloudTask(mainVideo.id, taskName, targetAnalysisType || 'highlight');
      setPostRecordModalPayload({
        cloudAlreadyQueued: true,
        videoId: mainVideo.id,
        videoName: taskName,
        analysisType: targetAnalysisType || 'highlight',
        sport: String((mainVideo as any).category || 'soccer'),
      });
      const analyzingCount = getAnalyzingTasksCount();
      const isQueued = analyzingCount >= maxConcurrentTasks;

      if (networkState === '4g') {
        setShowCellularAlert(true);
        pushView('home');
      } else if (networkState === 'offline') {
        setTransferStep('paused');
        pushView('home');
      } else {
        setTransferStep('uploading');
        setTransferProgress(0);
        pushView('home');
        if (isQueued) {
          setToastMessage('分析任务繁忙，等待排队分析');
          setTimeout(() => setToastMessage(null), 8000);
        } else if (merged) {
          setToastMessage(t('ui.aiMergeTaskCreated', { count: selectedVideos.length }));
          setTimeout(() => setToastMessage(null), 2800);
        }
      }
      return;
    }

    const toastMsg = targetAnalysisType === 'highlight' ? t('ui.highlightCompleteToast') : t('ui.analysisCompleteToast');
    setAnalysisCompleteToast({
      show: true,
      message: toastMsg,
      targetAnalysisType: targetAnalysisType,
      resultSport: 'soccer',
    });
  };

  const handleNext = () => {

      // Storage check again

      if (storageState === 'full') {

          setShowStorageAlert(true);

          return;

      }

      submitAiAnalysis(selectedMedia, 'media_picker_next', selectedMedia.length > 1 ? 'merge' : 'single');

  };

  // --- Automation Logic: Run Scenarios ---

  const runScenario = (type: string) => {

      // Reset state first

      setTransferStep('idle');

      setTransferProgress(0);

      setNetworkState('wifi');

      setFalconState('connected');

      setStorageState('ok');

      setFailureReason(null);

      

      if (type === 'device_disconnect') {

          setToastMessage('开始演练：设备断连...');

          setTimeout(() => setToastMessage(null), 2500); // Auto hide

          setTimeout(() => {

              setTransferStep('downloading');

              setTransferProgress(10);

              pushView('home');

              // Auto Disconnect after 2s

              setTimeout(() => {

                  setFalconState('disconnected');

              }, 2000);

          }, 500);

      } 

      else if (type === 'network_4g') {

          setToastMessage('开始演练：4G 流量保护...');

          setTimeout(() => setToastMessage(null), 2500); // Auto hide

          setTimeout(() => {

              setTransferStep('uploading');

              setTransferProgress(20);

              pushView('home');

              // Auto Switch to 4G after 2s

              setTimeout(() => {

                  setNetworkState('4g');

                  setShowCellularAlert(true);

              }, 2000);

          }, 500);

      }

      else if (type === 'crash_recovery') {

          setToastMessage('开始演练：App 崩溃恢复...');

          setTimeout(() => setToastMessage(null), 2500); // Auto hide

          pushView('home');

          setTimeout(() => {

              setShowCrashRecovery(true);

          }, 1000);

      }

      else if (type === 'storage_full') {

          setToastMessage('开始演练：存储空间不足...');

          setTimeout(() => setToastMessage(null), 2500); // Auto hide

          pushView('home');

          setStorageState('full');

          // Automatically try to start a task to show the alert

          setTimeout(() => {

              handleEntryClick('highlight'); 

          }, 1500);

      }

      else if (type === 'concurrent_task') {

          setToastMessage('开始演练：多任务并发...');

          setTimeout(() => setToastMessage(null), 2000); // Auto hide

          

          setTimeout(() => {

              // Start first task

              setTransferStep('uploading');

              setTransferProgress(30);

              pushView('home');

              

              // Try to start second task after 1.5s

              setTimeout(() => {

                  setToastMessage('尝试启动第二个任务...');

                  setTimeout(() => setToastMessage(null), 1000);

                  handleEntryClick('analysis');

              }, 1500);

          }, 500);

      }

      else if (type === 'network_offline') {

          setToastMessage('开始演练：网络完全断开...');

          setTimeout(() => setToastMessage(null), 2500); // Auto hide

          setTimeout(() => {

              setTransferStep('uploading');

              setTransferProgress(25);

              pushView('home');

              // Auto disconnect after 2s

              setTimeout(() => {

                  setNetworkState('offline');

              }, 2000);

          }, 500);

      }

      else if (type === 'cloud_queue_full') {

          setToastMessage('开始演练：云端队列已满...');

          setTimeout(() => setToastMessage(null), 2500); // Auto hide

          // Create 5 mock analyzing tasks
          const mockTasks: CloudTask[] = [];
          const videoNames = ['周五下午球局', '晨练投篮记录', '全场回放', '上半场录像', '手机实拍片段'];
          
          for (let i = 0; i < 5; i++) {
            mockTasks.push({
              id: `mock_task_${i}_${Date.now()}`,
              videoId: 100 + i,
              videoName: videoNames[i] || `视频 ${i + 1}`,
              type: i % 2 === 0 ? 'highlight' : 'analysis',
              status: 'analyzing',
              progress: Math.random() * 50 + 20, // Random progress between 20-70%
              createdAt: Date.now() - i * 10000,
            });
          }

          setCloudTasks(mockTasks);

          pushView('home');

          // After 1.5s, try to start a new task to trigger queue
          setTimeout(() => {

              setToastMessage('尝试启动新任务...');

              setTimeout(() => setToastMessage(null), 1000);

              // Simulate adding a new task that will be queued
              const newTaskId = addCloudTask(200, '新视频任务', 'highlight');
              const queuedTasks = getQueuedTasks();
              const queuePosition = queuedTasks.length;

              setTimeout(() => {

                  setToastMessage('分析任务繁忙，等待排队分析');

                  setTimeout(() => setToastMessage(null), 8000);

              }, 500);

          }, 1500);

      }

  };

  // --- Exception Simulation Effect ---

  useEffect(() => {

    if (transferStep === 'idle' || transferStep === 'completed' || transferStep === 'failed') return;

    // 1. Check for immediate interruptions

    if (transferStep === 'downloading' && falconState === 'disconnected') {

        setTransferStep('paused');

        return;

    }

    if ((transferStep === 'uploading' || transferStep === 'analyzing') && networkState === 'offline') {

        setTransferStep('paused');

        return;

    }

    if (
      (analysisPipeline === 'falcon_app_cloud' ||
        analysisPipeline === 'falcon_direct_cloud' ||
        analysisPipeline === 'edge_cloud_hybrid') &&
      transferStep === 'uploading' &&
      networkState === '4g' &&
      !showCellularAlert
    ) {
      setTransferStep('paused');

      return;
    }

    // 2. Resume logic (Auto resume for demo if environment fixed)
    // Note: This logic is disabled as it requires tracking previous state
    // if (transferStep === 'paused') {
    //     // Resume logic would need a previousState variable to track what step was paused
    //     return; 
    // }

    const interval = setInterval(() => {

        setTransferProgress(prev => {

            if (prev >= 100) {

                if (transferStep === 'downloading') {

                     if (analysisPipeline === 'edge_cloud_hybrid') {
                       if (hybridSkipEdgeAfterDownloadRef.current) {
                         hybridSkipEdgeAfterDownloadRef.current = false;
                         hybridPastEdgeRef.current = true;
                         setHybridPastEdge(true);
                         if (postRecordModalPayload) {
                           addCloudTask(
                             postRecordModalPayload.videoId,
                             postRecordModalPayload.videoName,
                             postRecordModalPayload.analysisType
                           );
                         }
                         setTransferStep('uploading');
                         return 0;
                       }
                       hybridPastEdgeRef.current = false;
                       setHybridPastEdge(false);
                       setTransferStep('analyzing');
                       return 0;
                     }

                     setTransferStep('uploading');

                     return 0;

                } else if (transferStep === 'uploading') {

                     setTransferStep('analyzing');
                     
                     // Update cloud task status to analyzing
                     if (currentTaskId) {
                       startTaskAnalysis(currentTaskId);
                     }

                     return 0;

                } else if (transferStep === 'analyzing') {

                     if (analysisPipeline === 'edge_cloud_hybrid' && !hybridPastEdgeRef.current) {
                       if (hybridLocalOnlyThisRunRef.current) {
                         setTransferStep('completed');
                         const toastMsg =
                           targetAnalysisType === 'highlight'
                             ? t('ui.highlightCompleteToast')
                             : t('ui.analysisCompleteToast');
                         setAnalysisCompleteToast({
                           show: true,
                           message: toastMsg,
                           targetAnalysisType: targetAnalysisType,
                           resultSport: 'soccer',
                         });
                         clearInterval(interval);
                         return 100;
                       }
                       hybridPastEdgeRef.current = true;
                       setHybridPastEdge(true);
                       if (postRecordModalPayload) {
                         addCloudTask(
                           postRecordModalPayload.videoId,
                           postRecordModalPayload.videoName,
                           postRecordModalPayload.analysisType
                         );
                       }
                       setTransferStep('uploading');
                       return 0;
                     }

                     setTransferStep('completed');
                     
                     // Complete cloud task
                     if (currentTaskId) {
                       completeTask(currentTaskId);
                     }

                     // Show toast with action button instead of auto-navigation
                     const toastMsg = targetAnalysisType === 'highlight' ? t('ui.highlightCompleteToast') : t('ui.analysisCompleteToast');
                     setAnalysisCompleteToast({
                       show: true,
                       message: toastMsg,
                       targetAnalysisType: targetAnalysisType,
                       resultSport: 'soccer' // Default, can be set based on selected video
                     });

                     clearInterval(interval);

                     return 100;

                }

                return 100;

            }

            // FIX: Ensure progress increments during analyzing step
            const newProgress = prev + 1;
            
            // Update cloud task progress（混合路线仅在云端分析段有 currentTaskId）
            if (
              currentTaskId &&
              transferStep === 'analyzing' &&
              (analysisPipeline !== 'edge_cloud_hybrid' || hybridPastEdgeRef.current)
            ) {
              updateTaskProgress(currentTaskId, newProgress);
            }

            return newProgress; 

        });
        
        // Update all analyzing tasks progress
        setCloudTasks(prevTasks => {
          return prevTasks.map(task => {
            if (task.status === 'analyzing' && task.id !== currentTaskId) {
              const increment = 1;
              const newProgress = Math.min(task.progress + increment, 100);
              if (newProgress >= 100) {
                // Task completed, trigger completion
                setTimeout(() => completeTask(task.id), 0);
              }
              return { ...task, progress: newProgress };
            }
            return task;
          });
        });

    }, 100);

    return () => clearInterval(interval);

  }, [
    transferStep,
    pushView,
    networkState,
    falconState,
    showCellularAlert,
    targetAnalysisType,
    setAnalysisCompleteToast,
    setIsTaskCompleted,
    setResultSport,
    currentTaskId,
    startTaskAnalysis,
    updateTaskProgress,
    completeTask,
    analysisPipeline,
    postRecordModalPayload,
    t,
  ]);

  useEffect(() => {
    const prev = prevTransferStepRef.current;
    // Keep transfer-step transition tracking only; post-record cloud modal is removed.
    prevTransferStepRef.current = transferStep;
  }, [transferStep, postRecordModalPayload]);

  useEffect(() => {
    if (transferStep !== 'completed') return;
    const ctx = lastSubmittedAnalysisRef.current;
    if (!ctx || ctx.sport !== 'soccer' || ctx.analysisType !== 'highlight') return;
    setSoccerMvpCloudReadyAt(Date.now());
  }, [transferStep]);

  return (

    <AppContext.Provider value={{

      viewStack, currentView, pushView, popView, popToHome, replaceView,

      showUpsellModal, setShowUpsellModal, showExportToast, handleExport,

      aiMode, setAiMode,

      analysisPipeline, setAnalysisPipeline,

      hybridPastEdge,

      setHybridPastEdge,

      hybridSourceMedia,

      hybridLocalOnlyThisRun,

      hybridCloudDeepThisRun,

      galleryHybridDemoView,

      setGalleryHybridDemoView,

      selectionMode, setSelectionMode, selectedMedia, setSelectedMedia,

      isTaskCompleted, setIsTaskCompleted, sportType, setSportType,

      isVip, setIsVip, targetAnalysisType, setTargetAnalysisType, handleEntryClick, handleUnlockVip,

      videoSourceTab, setVideoSourceTab, videoSportFilter, setVideoSportFilter, videoSortOrder, setVideoSortOrder,

      transferStep, setTransferStep, transferProgress, setTransferProgress, isTransferMinimized, setIsTransferMinimized,

      mediaTypeFilter, setMediaTypeFilter, handleSelect, handleNext, submitAiAnalysis,

      filteredVideos: ALL_VIDEOS,

      // Exception Context

      networkState, setNetworkState,

      falconState, setFalconState,

      storageState, setStorageState,

      failureReason, setFailureReason,

      showCellularAlert, setShowCellularAlert,

      showStorageAlert, setShowStorageAlert,

      showCrashRecovery, setShowCrashRecovery,

      setToastMessage, runScenario,

      resultSport, setResultSport,

      highlightEntryIntent, setHighlightEntryIntent,

      // New: Progress and Share Modal states
      progressModal, setProgressModal,
      showShareModal, setShowShareModal,
      shareType, setShareType,
      mergedVideoUrl, setMergedVideoUrl,
      shareContext, setShareContext,

      // New: Analysis completion toast
      analysisCompleteToast, setAnalysisCompleteToast,

      // Player claim state
      eventClaims, setEventClaims,
      expandedPlayerKey, setExpandedPlayerKey,
      selectedEventForClaim, setSelectedEventForClaim,
      showPlayerSelector, setShowPlayerSelector,

      // Cloud task queue
      cloudTasks,
      currentTaskId,
      maxConcurrentTasks,
      getAnalyzingTasksCount,
      getQueuedTasks,
      addCloudTask,
      startTaskAnalysis,
      updateTaskProgress,
      completeTask,

      assetDocFilter,
      setAssetDocFilter,

      showPostRecordCloudModal,
      setShowPostRecordCloudModal,

      postRecordModalPayload,
      setPostRecordModalPayload,

      soccerMvpCloudReadyAt,
      liveSoccerStats,
      updateSoccerMatchPresentation,

      t,

    }}>

      <div className="flex flex-col sm:flex-row justify-center items-center min-h-screen bg-gray-100 font-sans text-slate-800 gap-6 p-4">

        <TechRouteToggle />

        <div className="w-full max-w-[375px] h-[812px] bg-black overflow-hidden relative shadow-2xl flex flex-col rounded-[40px] border-[8px] border-slate-900 ring-4 ring-slate-300/50 shrink-0">

          <div className="absolute inset-0 bg-white">

             {currentView === 'home' && <HomeScreen />}

             {currentView === 'gallery' && <GalleryScreen />}

             {currentView === 'media_picker' && <MediaPickerScreen />}

             {currentView === 'task_submitted' && <TaskSubmittedScreen />}

             {currentView === 'ai_result_highlight' && <HighlightResultScreen />}

             {currentView === 'ai_result_analysis' && <AnalysisResultScreen />}

            {currentView === 'merge_preview' && <MergePreviewScreen />}

             {currentView === 'task_center' && <TaskCenterScreen />}

             {currentView === 'transfer_list' && <TransferListScreen />}

          </div>

          <TransferOverlay />

          <FloatingProgress />

          <ScenarioWizard />

          

          {/* Global Alerts */}

          {showUpsellModal && <UpsellModal />}

          {showCellularAlert && <CellularDataModal />}

          {showStorageAlert && <StorageFullModal />}

          {showCrashRecovery && <CrashRecoveryModal />}

          {/* Progress and Share Modals */}

          <ProgressModal />

          {showShareModal && <ShareModal />}

          <PlayerSelectorModal />

          {/* Global Toast */}

          {toastMessage && (

              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl z-[80] animate-in fade-in slide-in-from-top-4 flex items-center gap-2">

                  <AlertTriangle className="w-4 h-4 text-yellow-500" />

                  {toastMessage}

              </div>

          )}

          {/* Analysis Completion Toast with Action Button */}

          {analysisCompleteToast && analysisCompleteToast.show && (

              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-xl z-[80] animate-in fade-in slide-in-from-top-4 flex items-center gap-3 min-w-[280px]">

                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />

                  <span className="flex-1">{analysisCompleteToast.message}</span>

                  <button 
                      onClick={() => {
                          setIsTaskCompleted(true);
                          setResultSport(analysisCompleteToast.resultSport);
                          pushView(analysisCompleteToast.targetAnalysisType === 'highlight' ? 'ai_result_highlight' : 'ai_result_analysis');
                          setAnalysisCompleteToast(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0"
                  >
                      查看
                  </button>

                  <button 
                      onClick={() => setAnalysisCompleteToast(null)}
                      className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  >
                      <X className="w-4 h-4" />
                  </button>

              </div>

          )}

          

        </div>

        <style>{`

          .scrollbar-hide::-webkit-scrollbar { display: none; }

          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

          @keyframes slide-in-from-bottom { from { transform: translateY(100%); } to { transform: translateY(0); } }

          .animate-in { animation-fill-mode: both; }

          .bg-noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E"); }

        `}</style>

      </div>

    </AppContext.Provider>

  );

};

export default App;