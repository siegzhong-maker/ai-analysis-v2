import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import i18n from './src/i18n';

import { 

  Sparkles, BarChart3, LayoutTemplate, Scissors, 

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

  AlertTriangle, WifiOff, Wifi, Signal, HardDrive, RefreshCw, Play, Zap, HelpCircle, Minus, Plus,

  Activity, Map, HelpCircle as QuestionIcon, Lock, Footprints, AreaChart, Flame, TrendingUp,

  MessageSquare, Save, User, ChevronDown

} from 'lucide-react';

// --- Types ---

type ViewState =
  | 'home'
  | 'media_picker'
  | 'editor_manual'
  | 'templates_list'
  | 'template_detail'
  | 'ai_processing'
  | 'ai_result_highlight'
  | 'ai_result_analysis'
  | 'task_submitted'
  | 'task_center'
  | 'merge_preview'
  | 'aigc_preview';

type AIMode = 'cloud'; 

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

type HomeTabType = 'recent' | 'templates' | 'drafts';

type NetworkState = 'wifi' | '4g' | 'offline';

type FalconState = 'connected' | 'disconnected';

type ShareContext =
  | { type: 'all' | 'selected' | 'report' }
  | { type: 'player_clips'; playerLabel?: string }
  | { type: 'player_dashboard'; playerLabel?: string }
  | { type: 'aigc_one_click_video'; selectedClipIds: number[] }
  | { type: 'aigc_coach_clip'; clipId: number; aiCoachComment?: string };

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
  { id: 'b1', titleKey: 'tasks.titleFinalReport', dateKey: 'tasks.date2hAgo', type: 'analysis', status: 'completed', cover: 'basketball' },
  { id: 'b2', titleKey: 'tasks.titleWeekendFriendly', dateKey: 'tasks.dateYesterday', type: 'highlight', status: 'completed', cover: 'basketball' },
  { id: 'f1', titleKey: 'tasks.titleWedTraining', dateKey: 'tasks.date3dAgo', type: 'highlight', status: 'failed', cover: 'soccer', failureReasonKey: 'tasks.failureNetwork' },
  { id: 'f2', titleKey: 'tasks.titlePreseason', dateKey: 'tasks.date5dAgo', type: 'analysis', status: 'failed', cover: 'basketball', failureReasonKey: 'tasks.failureFormat' },
  { id: 'p1', titleKey: 'tasks.titleFriendlyMoments', dateKey: 'tasks.date1wAgo', type: 'highlight', status: 'paused', cover: 'basketball' },

];

const DRAFT_TASKS = [

  { id: 'd1', titleKey: 'tasks.titleUntitled', dateKey: 'tasks.date10mAgo', progress: '30%', cover: 'basketball' },
  { id: 'd2', titleKey: 'tasks.titleFridayEdit', dateKey: 'tasks.dateYesterday23', progress: '80%', cover: 'soccer' },
  { id: 'd3', titleKey: 'tasks.titleShootingDay1', dateKey: 'tasks.titleProgress15', progress: '15%', cover: 'basketball' },

];

const TEMPLATE_DATA = [

  { id: 't1', titleKey: 'templates.nbaReport', type: 'vertical', usage: '1.2k', tagKey: 'templates.hot' },
  { id: 't2', titleKey: 'templates.highlightReel', type: 'horizontal', usage: '856', tagKey: 'templates.recommended' },
  { id: 't3', titleKey: 'templates.slowMoAnalysis', type: 'vertical', usage: '430', tagKey: 'templates.tutorial' },

];

const ALL_VIDEOS = [

  { id: 101, type: 'video', source: 'falcon', dateKey: 'videos.today', dateSuffix: '14:30', duration: '45:00', labelKey: 'videos.fridayGame', device: 'Falcon X1', battery: 85, synced: true, category: 'basketball' },
  { id: 102, type: 'video', source: 'falcon', dateKey: 'videos.yesterday', dateSuffix: '09:00', duration: '62:15', labelKey: 'videos.morningShooting', device: 'Falcon X1', battery: 42, synced: true, category: 'basketball' },
  { id: 201, type: 'video', source: 'cloud', dateKey: 'videos.monday', dateSuffix: '18:00', duration: '58:00', labelKey: 'videos.fullReplay', category: 'basketball' },
  { id: 202, type: 'video', source: 'cloud', dateKey: 'videos.monday', dateSuffix: '16:30', duration: '45:00', labelKey: 'videos.firstHalf', category: 'soccer' },
  { id: 301, type: 'video', source: 'local', dateKey: 'videos.yesterday', dateSuffix: '12:00', duration: '03:20', labelKey: 'videos.phoneClip', category: 'basketball' },
  { id: 302, type: 'video', source: 'local', dateKey: 'videos.dayBefore', dateSuffix: '10:15', duration: '00:15', labelKey: 'videos.threePtPractice', category: 'basketball' },
  { id: 103, type: 'video', source: 'falcon', dateKey: 'videos.sunday', dateSuffix: '15:20', duration: '15:20', labelKey: 'videos.halfCourt', device: 'Falcon Mini', battery: 100, synced: false, category: 'soccer' },
  { id: 303, type: 'video', source: 'local', dateKey: 'videos.lastFriday', dateSuffix: '', duration: '20:00', labelKey: 'videos.battingPractice', category: 'baseball' },

] as const;

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

const PLAYER_STATS_BASKETBALL = [

    {
      id: 1,
      name: 'LJ',
      number: 23,
      pts: 28,
      reb: 8,
      ast: 7,
      eff: '+25',
      color: 'bg-blue-500',
      team: 'A',
      // 细分投篮数据
      fgMade: 10,
      fgAtt: 20,
      tpMade: 3,
      tpAtt: 8,
      ftMade: 5,
      ftAtt: 6,
      // 篮板拆分
      offReb: 3,
      defReb: 5,
      // 其他技术统计
      stl: 2,
      blk: 1,
      tov: 3,
      pf: 2,
      // 保持原有字段
      unclaimedCount: 0,
      events: [],
    },

    {
      id: 2,
      name: 'KL',
      number: 11,
      pts: 22,
      reb: 5,
      ast: 3,
      eff: '+18',
      color: 'bg-red-500',
      team: 'B',
      fgMade: 8,
      fgAtt: 18,
      tpMade: 2,
      tpAtt: 6,
      ftMade: 4,
      ftAtt: 5,
      offReb: 1,
      defReb: 4,
      stl: 1,
      blk: 0,
      tov: 2,
      pf: 3,
      unclaimedCount: 0,
      events: [],
    },

    {
      id: 3,
      name: 'Tatum',
      number: 0,
      pts: 18,
      reb: 9,
      ast: 4,
      eff: '+15',
      color: 'bg-blue-500',
      team: 'A',
      fgMade: 7,
      fgAtt: 17,
      tpMade: 1,
      tpAtt: 5,
      ftMade: 3,
      ftAtt: 4,
      offReb: 4,
      defReb: 5,
      stl: 2,
      blk: 2,
      tov: 1,
      pf: 1,
      unclaimedCount: 0,
      events: [],
    },

];

const PLAYER_STATS_SOCCER = [

    {
      id: 1,
      name: 'Son',
      number: 7,
      goals: 1,
      assists: 0,
      shots: 5,
      shotsOnTarget: 3,
      xG: 0.9,
      keyPasses: 3,
      tackles: 4,
      interceptions: 2,
      dist: '11.2km',
      sprints: 24,
      rating: 8.5,
      color: 'bg-blue-500',
      team: 'A',
      unclaimedCount: 0,
      events: [],
    },

    {
      id: 2,
      name: 'Kane',
      number: 10,
      goals: 1,
      assists: 1,
      shots: 4,
      shotsOnTarget: 2,
      xG: 0.85,
      keyPasses: 5,
      tackles: 2,
      interceptions: 1,
      dist: '10.5km',
      sprints: 18,
      rating: 8.2,
      color: 'bg-blue-500',
      team: 'A',
      unclaimedCount: 0,
      events: [],
    },

    {
      id: 3,
      name: 'Salah',
      number: 11,
      goals: 1,
      assists: 0,
      shots: 6,
      shotsOnTarget: 4,
      xG: 1.1,
      keyPasses: 2,
      tackles: 3,
      interceptions: 2,
      dist: '10.8km',
      sprints: 32,
      rating: 8.4,
      color: 'bg-red-500',
      team: 'B',
      unclaimedCount: 0,
      events: [],
    },

];

// --- Helper Functions for Advanced Shooting Metrics ---

const calcEFG = (player: any): number | null => {
  const fgMade = player.fgMade ?? 0;
  const fgAtt = player.fgAtt ?? 0;
  const tpMade = player.tpMade ?? 0;
  if (!fgAtt) return null;
  return (fgMade + 0.5 * tpMade) / fgAtt;
};

const calcTS = (player: any): number | null => {
  const pts = player.pts ?? 0;
  const fgAtt = player.fgAtt ?? 0;
  const ftAtt = player.ftAtt ?? 0;
  const denom = 2 * (fgAtt + 0.44 * ftAtt);
  if (!denom) return null;
  return pts / denom;
};

const getEventTypeLabel = (clip: any, isSoccer: boolean): { label: string; color: string; bgColor: string } => {
  const t = i18n.t.bind(i18n);
  if (isSoccer) {
    if (clip.scoreType === 'goal') return { label: t('clips.goal'), color: 'text-emerald-300', bgColor: 'bg-emerald-500/20' };
    if (clip.scoreType === 'corner') return { label: t('clips.cornerShort'), color: 'text-blue-300', bgColor: 'bg-blue-500/20' };
    if (clip.scoreType === 'setpiece') return { label: t('clips.setpieceShort'), color: 'text-purple-300', bgColor: 'bg-purple-500/20' };
    if (clip.scoreType === 'penalty') return { label: t('clips.penaltyShort'), color: 'text-orange-300', bgColor: 'bg-orange-500/20' };
    return { label: t('clips.other'), color: 'text-slate-300', bgColor: 'bg-slate-500/20' };
  }
  if (clip.type === 'score') {
    if (clip.scoreType === 3) return { label: t('clips.3ptShort'), color: 'text-blue-300', bgColor: 'bg-blue-500/20' };
    if (clip.scoreType === 2) return { label: t('clips.2ptShort'), color: 'text-green-300', bgColor: 'bg-green-500/20' };
    if (clip.scoreType === 1) return { label: t('clips.ftShort'), color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' };
  }
  if (clip.type === 'basketball_event') {
    if (clip.scoreType === 'rebound') return { label: t('clips.reboundShort'), color: 'text-purple-300', bgColor: 'bg-purple-500/20' };
    if (clip.scoreType === 'steal') return { label: t('clips.steal'), color: 'text-red-300', bgColor: 'bg-red-500/20' };
    if (clip.scoreType === 'assist') return { label: t('clips.assist'), color: 'text-cyan-300', bgColor: 'bg-cyan-500/20' };
  }
  return { label: t('clips.other'), color: 'text-slate-300', bgColor: 'bg-slate-500/20' };
};

// AI 足球球员点评（多语言，走 i18n 文案）
const generateSoccerPlayerComment = (player: any): string => {
  const tAi = i18n.t.bind(i18n);

  const name =
    player.name ??
    (player.label ?? tAi('aiComment.defaultPlayer'));

  const goals = player.goals ?? 0;
  const assists = player.assists ?? 0;
  const shots = player.shots ?? 0;
  const shotsOnTarget = player.shotsOnTarget ?? 0;
  const xG = player.xG ?? 0;
  const keyPasses = player.keyPasses ?? 0;
  const tackles = player.tackles ?? 0;
  const interceptions = player.interceptions ?? 0;
  const dist = player.dist ?? '0km';
  const sprints = player.sprints ?? 0;

  const lines: string[] = [];

  // 进攻表现
  if (goals >= 2) {
    lines.push(tAi('aiComment.soccerGoals2', { name }));
  } else if (goals === 1) {
    if (xG >= 1.0) {
      lines.push(tAi('aiComment.soccerGoal1High', { name }));
    } else {
      lines.push(tAi('aiComment.soccerGoal1', { name }));
    }
  } else if (goals === 0 && shots > 0) {
    if (shotsOnTarget === 0) {
      lines.push(tAi('aiComment.soccerNoGoalBad', { name }));
    } else {
      lines.push(tAi('aiComment.soccerNoGoalOk', { name }));
    }
  }

  // 助攻与组织
  if (assists >= 2) {
    lines.push(tAi('aiComment.soccerAssist2'));
  } else if (assists === 1) {
    lines.push(tAi('aiComment.soccerAssist1'));
  } else if (keyPasses >= 5) {
    lines.push(tAi('aiComment.soccerKeyPasses'));
  }

  // 跑动与覆盖
  const distNum = parseFloat(dist.replace('km', '')) || 0;
  if (distNum >= 12) {
    lines.push(tAi('aiComment.soccerDist'));
  } else if (sprints >= 30) {
    lines.push(tAi('aiComment.soccerSprints'));
  }

  // 防守贡献
  if (tackles + interceptions >= 6) {
    lines.push(tAi('aiComment.soccerDefenseHigh'));
  } else if (tackles + interceptions >= 3) {
    lines.push(tAi('aiComment.soccerDefenseMid'));
  }

  // xG 效率
  if (goals > 0 && xG > 0) {
    const efficiency = goals / xG;
    if (efficiency >= 1.2) {
      lines.push(tAi('aiComment.soccerXgHigh'));
    } else if (efficiency < 0.8) {
      lines.push(tAi('aiComment.soccerXgLow'));
    }
  }

  if (lines.length === 0) {
    return tAi('aiComment.soccerDefault', { name });
  }

  return lines.join(' ');
};

// AI 篮球球员点评（多语言，走 i18n 文案）
const generatePlayerComment = (player: any): string => {
  const tAi = i18n.t.bind(i18n);

  const pts = player.pts ?? 0;
  const reb = player.reb ?? 0;
  const ast = player.ast ?? 0;
  const stl = player.stl ?? 0;
  const blk = player.blk ?? 0;
  const tov = player.tov ?? 0;

  const name =
    player.name ??
    (player.label ?? tAi('aiComment.defaultPlayer'));

  const efg = calcEFG(player);
  const ts = calcTS(player);

  const lines: string[] = [];

  // 进攻表现
  if (pts >= 30) {
    lines.push(tAi('aiComment.basketballPts30', { name, pts }));
  } else if (pts >= 20) {
    lines.push(tAi('aiComment.basketballPts20', { name, pts }));
  } else if (pts >= 10) {
    lines.push(tAi('aiComment.basketballPts10', { name, pts }));
  } else {
    lines.push(tAi('aiComment.basketballPtsLow', { name, pts }));
  }

  // 命中率
  if (efg != null && efg >= 0.6) {
    lines.push(tAi('aiComment.basketballEfgHigh'));
  } else if (efg != null && efg <= 0.4 && pts > 0) {
    lines.push(tAi('aiComment.basketballEfgLow'));
  }

  // 篮板 / 助攻
  if (reb >= 10) {
    lines.push(tAi('aiComment.basketballReb10'));
  } else if (reb >= 7) {
    lines.push(tAi('aiComment.basketballReb7'));
  }

  if (ast >= 8) {
    lines.push(tAi('aiComment.basketballAst8'));
  } else if (ast >= 5) {
    lines.push(tAi('aiComment.basketballAst5'));
  }

  // 防守端
  if (stl + blk >= 4) {
    lines.push(tAi('aiComment.basketballDef4'));
  } else if (stl + blk >= 2) {
    lines.push(tAi('aiComment.basketballDef2'));
  }

  // 失误小吐槽
  if (tov >= 4) {
    lines.push(tAi('aiComment.basketballTovHigh'));
  } else if (tov === 0 && pts + ast > 0) {
    lines.push(tAi('aiComment.basketballTovZero'));
  }

  return lines.join(' ');
};

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

// --- Sub-Screens ---

const TutorialOverlay = () => {

  const { t, showTutorial, setShowTutorial, tutorialStep, setTutorialStep } = useAppContext();

  if (!showTutorial) return null;

  const steps = [

    { titleKey: 'tutorial.dualModeTitle', descKey: 'tutorial.dualModeDesc', style: { top: '65px', left: '12px', height: '280px', width: 'calc(100% - 24px)' }, position: 'bottom', arrow: 'top' },

    { titleKey: 'tutorial.projectTitle', descKey: 'tutorial.projectDesc', style: { top: '460px', left: '12px', height: '250px', width: 'calc(100% - 24px)' }, position: 'top', arrow: 'bottom' },

    { titleKey: 'tutorial.taskCenterTitle', descKey: 'tutorial.taskCenterDesc', style: { top: '10px', right: '50px', height: '44px', width: '44px', borderRadius: '50%' }, position: 'bottom', arrow: 'top' }

  ];

  const current = steps[tutorialStep];

  const topHeight = current.style.top ? current.style.top : `calc(100% - ${(current.style as any).bottom || '0px'} - ${current.style.height})`;

  const bottomTop = (current.style as any).bottom ? `calc(100% - ${(current.style as any).bottom})` : `calc(${current.style.top} + ${current.style.height})`;

  return (

    <div className="absolute inset-0 z-[100] overflow-hidden" onClick={() => { if (tutorialStep < steps.length - 1) setTutorialStep((s: number) => s + 1); else setShowTutorial(false); }}>

      <div className="absolute left-0 right-0 bg-black/75 transition-all duration-300" style={{ top: 0, height: topHeight }} />

      <div className="absolute left-0 right-0 bg-black/75 transition-all duration-300" style={{ top: bottomTop, bottom: 0 }} />

      <div className="absolute bg-black/75 transition-all duration-300" style={{ left: 0, width: current.style.left, top: topHeight, bottom: 0, height: current.style.height }} />

      <div className="absolute bg-black/75 transition-all duration-300" style={{ right: 0, left: `calc(${current.style.left} + ${current.style.width})`, top: topHeight, bottom: 0, height: current.style.height }} />

      <div className="absolute border-2 border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 pointer-events-none rounded-[24px]" style={{ ...current.style, borderRadius: current.style.borderRadius || '24px' }} ><div className="absolute -inset-1 rounded-[inherit] border border-white/20 animate-ping opacity-50"></div></div>

      <div className="absolute left-6 right-6 flex flex-col items-center text-center transition-all duration-300" style={{ top: current.position === 'bottom' ? `calc(${parseInt(current.style.top as string) + parseInt(current.style.height as string)}px + 24px)` : 'auto', bottom: current.position === 'top' ? `calc(${(current.style as any).bottom ? (current.style as any).bottom : (812 - parseInt(current.style.top as string))}px + 24px)` : 'auto' }} onClick={(e) => e.stopPropagation()} >

        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-2xl relative w-full max-w-xs animate-in zoom-in-95 duration-300">

          <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 transform ${current.arrow === 'top' ? '-top-2' : '-bottom-2'}`} />

          <div className="flex justify-between items-start mb-2"><h3 className="text-lg font-black text-slate-900">{t((current as any).titleKey)}</h3><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tutorialStep + 1} / {steps.length}</span></div>

          <p className="text-sm text-slate-600 mb-5 leading-relaxed text-left">{t((current as any).descKey)}</p>

          <div className="flex gap-3 justify-end"><button onClick={() => setShowTutorial(false)} className="text-slate-400 text-xs font-bold px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors">{t('ui.skip')}</button><button onClick={() => { if (tutorialStep < steps.length - 1) setTutorialStep((s: number) => s + 1); else setShowTutorial(false); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-lg shadow-slate-900/20 active:scale-95 transition-transform flex items-center gap-1">{tutorialStep < steps.length - 1 ? (<>{t('ui.next')} <ChevronRight className="w-3 h-3" /></>) : (<>{t('ui.getStarted')} <Check className="w-3 h-3" /></>)}</button></div>

        </div>

      </div>

    </div>

  );

};

const TransferOverlay = () => {

  const { t,

    transferStep, transferProgress, isTransferMinimized, setIsTransferMinimized, 

    networkState, falconState, failureReason, setTransferStep, setTransferProgress, setFalconState, setNetworkState, pushView 

  } = useAppContext();

  

   if ((transferStep === 'idle' || transferStep === 'completed') || isTransferMinimized) return null;

   

   const isAnalyzing = transferStep === 'analyzing';

   const isFailed = transferStep === 'failed';

   const isPaused = transferStep === 'paused';

   

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

   } else if (transferStep === 'downloading') {

       statusText = t('ui.downloadingFromDevice');

   } else if (transferStep === 'uploading') {

       statusText = t('ui.uploadingToCloud');

   } else if (transferStep === 'analyzing') {

       statusText = t('ui.aiAnalyzing');

   }

   const handleRetry = () => {

       if (falconState === 'disconnected') setFalconState('connected'); 

       if (networkState === 'offline') setNetworkState('wifi'); 

       setTransferStep(transferProgress < 33 ? 'downloading' : 'uploading');

   };

   return (

      <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">

         <div className="w-full max-w-xs bg-[#1E293B] rounded-2xl p-6 text-center border border-white/10 shadow-2xl relative">

            <button onClick={() => setIsTransferMinimized(true)} className="absolute top-3 right-3 text-slate-400 hover:text-white"><Minimize2 className="w-4 h-4" /></button>

            

            <h3 className={`text-base font-bold mb-6 ${isFailed ? 'text-red-500' : (isPaused ? 'text-yellow-500' : 'text-white')}`}>
                {isFailed
                  ? t('ui.taskFailed')
                  : (isPaused
                      ? t('ui.taskPaused')
                      : (isAnalyzing
                          ? t('ui.cloudAnalyzing')
                          : t('ui.uploadProcessing')))}
            </h3>

            {/* Icons row */}

            <div className="flex items-center justify-between px-2 mb-8 relative">

               <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-slate-700 -z-10"></div>

               {/* Progress Line */}

               <div className={`absolute left-6 h-0.5 transition-all duration-1000 -z-10 ${isFailed ? 'bg-red-500' : (isPaused ? 'bg-yellow-500' : 'bg-blue-500')}`} style={{ width: transferStep === 'downloading' ? '33%' : (transferStep === 'uploading' ? '66%' : '100%') }}></div>

               

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

               <div className={`flex flex-col items-center gap-2 ${isAnalyzing || isFailed ? 'opacity-100 scale-110' : 'opacity-60'}`}>

                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isFailed ? 'bg-red-500 border-red-400 text-white' : (isAnalyzing ? 'bg-orange-500 border-orange-400 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400')}`}>

                       {isFailed ? <X className="w-4 h-4" /> : <Cloud className="w-3 h-3" />}

                   </div>

                   <span className="text-[8px] text-slate-400">Cloud</span>

               </div>

               

               <div className={`flex flex-col items-center gap-2 ${isAnalyzing || isFailed ? 'opacity-100 scale-110' : 'opacity-40'}`}>

                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isAnalyzing ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>

                       <Sparkles className="w-3 h-3" />

                   </div>

                   <span className="text-[8px] text-slate-400">AI</span>

               </div>

            </div>

            {/* Status Panel */}

            <div className={`rounded-lg p-3 mb-4 ${isFailed ? 'bg-red-500/10 border border-red-500/20' : (isPaused ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-slate-800/50')}`}>

                <div className="flex justify-between text-xs text-white mb-2">

                    <span className={isFailed ? 'text-red-400 font-bold' : (isPaused ? 'text-yellow-400 font-bold' : '')}>{statusText}</span>

                    {!isAnalyzing && !isFailed && <span className="font-mono">{transferProgress}%</span>}

                </div>

                

                {subText && <p className="text-[10px] text-slate-400 text-left mb-2">{subText}</p>}

                {isAnalyzing && !isFailed ? (

                  <div className="flex gap-1 h-1.5 w-full"><div className="h-full bg-orange-500 w-1/3 rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{animationDelay: '0ms'}}></div><div className="h-full bg-orange-500 w-1/3 rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{animationDelay: '200ms'}}></div><div className="h-full bg-orange-500 w-1/3 rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{animationDelay: '400ms'}}></div></div>

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

  const { t, transferStep, transferProgress, isTransferMinimized, setIsTransferMinimized, networkState, falconState } = useAppContext();

  if (!isTransferMinimized || transferStep === 'idle' || transferStep === 'completed') return null;

  

  const isAnalyzing = transferStep === 'analyzing';

  const isFailed = transferStep === 'failed';

  const isPaused = transferStep === 'paused';

  

  let icon = <Sparkles className="w-4 h-4 text-orange-400" />;

  let text = `${transferProgress}%`;

  

  if (isFailed) {

      icon = <AlertTriangle className="w-4 h-4 text-red-500" />;

      text = t('ui.failed');

  } else if (isPaused) {

      icon = <AlertTriangle className="w-4 h-4 text-yellow-500" />;

      text = t('ui.paused');

  } else if (transferStep === 'downloading') {

      icon = <DownloadCloud className="w-4 h-4 text-blue-400" />;

  } else if (transferStep === 'uploading') {

      icon = <UploadCloud className="w-4 h-4 text-purple-400" />;

  } else if (isAnalyzing) {

      text = t('ui.analyzing');

  }

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

  const { t, showShareModal, setShowShareModal, setProgressModal, setToastMessage, currentView, shareContext } = useAppContext();
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const isPro = currentView === 'ai_result_analysis';

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

            {/* Pro Watermark Toggle */}
            {isPro && shareContext.type !== 'player_dashboard' && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-white">{t('ui.proOnly')}</span>
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
    setToastMessage
  } = useAppContext();
  const [newLabel, setNewLabel] = useState('');

  if (!showPlayerSelector || !selectedEventForClaim) return null;

  const eventToClaim = AI_CLIPS_ADVANCED.find(e => e.id === selectedEventForClaim);
  if (!eventToClaim) return null;

  const isSoccer = resultSport === 'soccer';
  const sport = resultSport || 'basketball';
  const team = eventToClaim.team;
  const statsData = isSoccer ? SOCCER_MATCH_STATS : TEAM_MATCH_STATS;
  const teamName = team === 'A' ? t(statsData.teamA.nameKey) : t(statsData.teamB.nameKey);

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

const TaskCenterScreen = () => {

  const { t, transferStep, transferProgress, popView, setTargetAnalysisType, setAiMode, setIsTaskCompleted, pushView, failureReason, setResultSport, setTransferStep, setTransferProgress, cloudTasks, getAnalyzingTasksCount, getQueuedTasks, maxConcurrentTasks } = useAppContext();

  // Get paused tasks from history
  const pausedTasks = HISTORY_TASKS.filter((task: any) => task.status === 'paused');
  
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

  return (

    <div className="flex flex-col h-full bg-[#F5F5F5] animate-in slide-in-from-right">

      <div className="pt-12 pb-2 px-5 bg-white flex justify-between items-center sticky top-0 z-10 border-b border-slate-100">

         <div className="flex items-center gap-3"><button onClick={popView}><ArrowLeft className="w-6 h-6 text-slate-800" /></button><h1 className="text-xl font-black text-slate-900 tracking-tight">{t('ui.taskCenter')}</h1></div>

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

                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transferStep === 'failed' ? 'bg-red-100 text-red-600' : (transferStep === 'downloading' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600')}`}>

                           {transferStep === 'failed' ? <AlertTriangle className="w-5 h-5"/> : (transferStep === 'downloading' ? <DownloadCloud className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />)}

                       </div>

                       <div>

                           <h4 className={`text-sm font-bold ${transferStep === 'failed' ? 'text-red-700' : 'text-slate-800'}`}>

                               {transferStep === 'failed' ? t('ui.taskFailedShort') : (transferStep === 'paused' ? t('ui.taskPaused') : (transferStep === 'downloading' ? t('ui.downloadingFromFalcon') : t('ui.uploadingToCloudShort')))}

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

         {/* Analysis History Only - Only show completed and failed */}

         <section>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">{t('ui.analysisHistory')}</h3>

            <div className="space-y-3">

                {HISTORY_TASKS.filter((task: any) => task.status !== 'paused').map((task: any) => {

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

                {HISTORY_TASKS.length === 0 && <div className="text-center text-slate-400 py-8 text-xs">{t('ui.noHistory')}</div>}

            </div>

         </section>

      </div>

    </div>

  );

};

const MediaPickerScreen = () => {

  const { t, popView, targetAnalysisType, setSportType, setMediaTypeFilter, handleSelect, handleNext, selectionMode, selectedMedia, sportType, mediaTypeFilter, pushView } = useAppContext();

  

  const SPORTS_CONFIG = [

    { id: 'basketball', label: '篮球', desc: '投篮/运球', color: 'orange', icon: CircleDot },

    { id: 'soccer', label: '足球', desc: '射门/传球', color: 'emerald', icon: Hexagon },

    { id: 'baseball', label: '棒球', desc: '击球/投球', color: 'blue', icon: Target },

    { id: 'ice_hockey', label: '冰球', desc: '射门/滑行', color: 'cyan', icon: Disc },

  ] as const;

  const filteredAssets = ALL_VIDEOS.filter(item => {

    const matchType = mediaTypeFilter === 'all' ? true : (item.type === mediaTypeFilter);

    const matchSport = sportType === 'all' ? true : item.category === sportType;

    return matchType && matchSport;

  });

  return (

    <div className="flex flex-col h-full bg-[#121212] text-white animate-in slide-in-from-bottom duration-300 relative z-50">

        <div className="h-12 flex items-center justify-between px-2 bg-[#1E1E1E] shrink-0"><button onClick={popView} className="p-3"><X className="w-6 h-6" /></button><span className="text-sm font-bold">{targetAnalysisType === 'highlight' ? t('ui.selectVideoForHighlight') : t('ui.selectVideoForStats')}</span><div className="w-12" /></div>

        

        <div className="bg-[#121212] pt-3 pb-2">
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x">
            {SPORTS_CONFIG.map((sport) => {
              const isSelected = sportType === sport.id;
              const Icon = sport.icon;
              let activeClass = '';
              if (sport.color === 'orange') activeClass = 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/50';
              else if (sport.color === 'emerald') activeClass = 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50';
              else if (sport.color === 'blue') activeClass = 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50';
              else if (sport.color === 'cyan') activeClass = 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/50';

              const sportLabelKeyMap: Record<string, string> = {
                basketball: 'ui.sportBasketball',
                soccer: 'ui.sportSoccer',
                baseball: 'ui.sportBaseball',
                ice_hockey: 'ui.sportIceHockey',
              };
              const sportDescKeyMap: Record<string, string> = {
                basketball: 'ui.sportBasketballDesc',
                soccer: 'ui.sportSoccerDesc',
                baseball: 'ui.sportBaseballDesc',
                ice_hockey: 'ui.sportIceHockeyDesc',
              };

              const labelKey = sportLabelKeyMap[sport.id] ?? '';
              const descKey = sportDescKeyMap[sport.id] ?? '';

              return (
                <button
                  key={sport.id}
                  onClick={() => { setSportType(sport.id as SportType); }}
                  className={`flex-none w-28 py-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all snap-start ${isSelected ? activeClass : 'bg-[#1E1E1E] border-white/5 text-slate-500'}`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold leading-none mb-1">
                      {labelKey ? t(labelKey) : sport.label}
                    </span>
                    <span className={`text-[9px] font-mono ${isSelected ? 'opacity-80' : 'opacity-40'}`}>
                      {descKey ? t(descKey) : sport.desc}
                    </span>
                  </div>
                </button>
              );
            })}
            <div className="w-1" />
          </div>
        </div>

        

        <div className="px-4 py-2 bg-[#121212] border-b border-white/5"><div className="flex bg-[#1E1E1E] rounded-lg p-0.5">{([['all', t('ui.mediaAll')], ['video', t('ui.mediaVideo')], ['image', t('ui.mediaImage')]] as const).map(([key, label]) => (<button key={key} onClick={() => setMediaTypeFilter(key as any)} className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${mediaTypeFilter === key ? 'bg-[#333] text-white' : 'text-gray-500'}`}>{label}</button>))}</div></div>

        

        <div className="flex-1 overflow-y-auto p-[1px]"><div className="grid grid-cols-4 gap-[1px] pb-32">{filteredAssets.map((item) => { const isSelected = selectedMedia.includes(item.id); let highlightColor = 'border-white'; if (sportType === 'basketball') highlightColor = 'border-orange-500 bg-orange-500'; return (<div key={item.id} onClick={() => handleSelect(item.id)} className={`aspect-square relative overflow-hidden`}><AssetThumbnail type="video" category={item.category as any} /><div className={`absolute inset-0 transition-colors ${isSelected ? `bg-black/40 border-2 ${highlightColor.split(' ')[0]}` : ''}`} /><div className="absolute top-1 right-1">{isSelected ? (<div className={`w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm ${highlightColor.split(' ')[1]}`}>{selectionMode === 'single' ? <Check className="w-3 h-3 text-white" /> : <span className="text-[10px] font-bold">{selectedMedia.indexOf(item.id) + 1}</span>}</div>) : (<div className="w-5 h-5 rounded-full border border-white/30 bg-black/20" />)}</div><div className="absolute bottom-1 right-1 text-[9px] font-medium text-white drop-shadow-md">{item.duration}</div></div>); })}</div></div>

        

        <div className="absolute bottom-0 w-full bg-[#1E1E1E] border-t border-white/10 pb-8 pt-3 px-4 flex flex-col justify-between min-h-[100px]"><div className="flex items-center justify-between mt-auto"><div className="text-xs text-gray-500">{selectionMode === 'single' ? (targetAnalysisType === 'highlight' ? t('ui.aiDetectHighlight') : t('ui.aiMineTactics')) : t('ui.selectedMediaCount', { count: selectedMedia.length })}</div><button onClick={handleNext} disabled={selectedMedia.length === 0} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedMedia.length > 0 ? (targetAnalysisType === 'highlight' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white') : 'bg-[#333] text-gray-500'}`}>{selectionMode === 'single' ? (targetAnalysisType === 'highlight' ? t('ui.generateHighlight') : t('ui.startStats')) : t('ui.importMedia')}</button></div></div>

    </div>

  );

}

const TaskSubmittedScreen = () => {

    const { t, targetAnalysisType, popToHome, setIsTaskCompleted } = useAppContext();

    return <div className="flex flex-col h-full bg-slate-900 text-white items-center justify-center p-8 animate-in zoom-in-95"><div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-pulse ${targetAnalysisType === 'highlight' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>{targetAnalysisType === 'highlight' ? <Film className="w-12 h-12" /> : <ScanLine className="w-12 h-12" />}</div><h2 className="text-2xl font-bold mb-2">{targetAnalysisType === 'highlight' ? t('ui.aiClipping') : t('ui.aiStatsProcessing')}</h2><p className="text-slate-400 text-sm text-center mb-8">{targetAnalysisType === 'highlight' ? t('ui.aiDetectHighlightDesc') : t('ui.aiTrackRunDesc')}</p><button onClick={() => { setIsTaskCompleted(true); popToHome(); }} className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-full active:scale-95 transition-transform">{t('ui.backToHome')}</button></div>;

};

// --- Updated Highlight Result Screen (Unified Structure) ---

const HighlightResultScreen = () => {

    const { t, popToHome, replaceView, resultSport, setProgressModal, pushView, setShowShareModal, setShareType, setMergedVideoUrl, setSelectedEventForClaim, setShowPlayerSelector, eventClaims, setEventClaims, setToastMessage } = useAppContext();

    const [selectedCollection, setSelectedCollection] = useState('full');

    const [selectedFilter, setSelectedFilter] = useState<EventFilterType>('all');

    // Player filter state for basic version
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

    const [currentTime, setCurrentTime] = useState('00:00');

    const [showJumpToast, setShowJumpToast] = useState(false);

    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const [selectedClipIds, setSelectedClipIds] = useState<number[]>([]);

    const [activeTab, setActiveTab] = useState<'clips' | 'stats'>('clips');

    

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

    const initialClips = AI_CLIPS_ADVANCED.filter(clip => clip.sport === (resultSport || 'basketball'));

    const [clips, setClips] = useState(initialClips);

    const [editingClipId, setEditingClipId] = useState<number | null>(null);
    const [editingDuration, setEditingDuration] = useState<number>(0); // Duration in seconds

    // Update clips when sport changes (in case of context switch)

    useEffect(() => {

        setClips(AI_CLIPS_ADVANCED.filter(clip => clip.sport === (resultSport || 'basketball')));

    }, [resultSport]);

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
            if (isSoccer) {
                // Soccer: filter by goal or penalty
                if (selectedFilter === 'goal') return clip.scoreType === 'goal';
                if (selectedFilter === 'penalty') return clip.scoreType === 'penalty';
            } else {
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
            }
            return false;
        } 

        // For 'all' filter, show only relevant events for basic view
        if (isSoccer) {
            // Soccer: only show goal and penalty
            return clip.scoreType === 'goal' || clip.scoreType === 'penalty';
        } else {
            // Basketball: only show score events (1分, 2分, 3分)
            return clip.type === 'score';
        }

    });

    

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

    // Manual correction: 事件类型 / 得分结果 (type + scoreType + label; 得分结果含 命中/未中)
    type EventTypeOption = { id: string | number; labelKey: string; type: string; scoreType: number | string; scored?: boolean };
    const eventTypeOptions: EventTypeOption[] = isSoccer
        ? [
            { id: 'goal', labelKey: 'clips.goal', type: 'soccer_event', scoreType: 'goal' },
            { id: 'corner', labelKey: 'clips.cornerShort', type: 'soccer_event', scoreType: 'corner' },
            { id: 'setpiece', labelKey: 'clips.setpieceShort', type: 'soccer_event', scoreType: 'setpiece' },
            { id: 'penalty', labelKey: 'clips.penaltyShort', type: 'soccer_event', scoreType: 'penalty' },
        ]
        : [
            { id: 3, labelKey: 'clips.3ptShort', type: 'score', scoreType: 3, scored: true },
            { id: 2, labelKey: 'clips.2ptShort', type: 'score', scoreType: 2, scored: true },
            { id: 1, labelKey: 'clips.ftShort', type: 'score', scoreType: 1, scored: true },
            { id: 'rebound', labelKey: 'clips.reboundShort', type: 'basketball_event', scoreType: 'rebound' },
            { id: 'steal', labelKey: 'clips.steal', type: 'basketball_event', scoreType: 'steal' },
            { id: 'assist', labelKey: 'clips.assist', type: 'basketball_event', scoreType: 'assist' },
        ];

    // Label helper for event type correction (type + scoreType → display label)
    const getLabelForEvent = (sport: string, type: string, scoreType: number | string): string => {
        const isSoc = sport === 'soccer';
        if (isSoc) {
            const m: Record<string, string> = { goal: 'clips.goal', corner: 'clips.corner', setpiece: 'clips.setpiece', penalty: 'clips.penalty' };
            return t(m[String(scoreType)] ?? 'clips.goal');
        }
        const m: Record<string, string> = { '3': 'clips.3ptShort', '2': 'clips.2ptShort', '1': 'clips.ftShort', rebound: 'clips.reboundShort', steal: 'clips.steal', assist: 'clips.assist' };
        return t(m[String(scoreType)] ?? 'clips.score');
    };

    const handleCorrectEventType = (clipId: number, opt: EventTypeOption) => {
        const sport = resultSport || 'basketball';
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

    const filters = isSoccer 
      ? [ { id: 'all', labelKey: 'filter.all' }, { id: 'goal', labelKey: 'filter.goal' }, { id: 'penalty', labelKey: 'filter.penalty' } ]
      : [ { id: 'all', labelKey: 'filter.all' }, { id: 'score', labelKey: 'filter.score' }, { id: 1, labelKey: 'filter.ft' }, { id: 3, labelKey: 'filter.threePt' } ];

    const statsData = isSoccer ? SOCCER_MATCH_STATS : TEAM_MATCH_STATS;

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

    return (

      <div className="flex flex-col h-full bg-[#0F172A] text-white relative" onClick={() => { setEditingClipId(null); }}>

         {/* Top Player Section (Unified Structure) */}

         <div className="h-[240px] bg-black relative shrink-0">

             <AssetThumbnail type="video" category={resultSport || 'basketball'} />

             <div className="absolute top-4 left-4 z-20"><button onClick={popToHome} className="p-2 bg-black/40 rounded-full"><ArrowLeft className="w-5 h-5" /></button></div>

             

             {/* No Extra Actions for Basic Highlight View */}

             

             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-4xl font-bold drop-shadow-lg opacity-80">{currentTime}</div>

             {showJumpToast && (<div className="absolute top-[60%] left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 z-30"><RotateCcw className="w-3 h-3" /> {t('ui.jumpTo')} {currentTime}</div>)}

             

             {/* Simple Score Overlay for Context */}

             <div className="absolute bottom-0 left-0 right-0 p-4 pb-4 z-20 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent">

                <div className="flex justify-between items-end mb-2">

                    <div className="flex flex-col items-center"><span className={`text-2xl font-black ${statsData.teamA.color} drop-shadow-lg`}>{statsData.teamA.score}</span></div>

                    <div className="text-xl font-black text-slate-500 pb-1">VS</div>

                    <div className="flex flex-col items-center"><span className={`text-2xl font-black ${statsData.teamB.color} drop-shadow-lg`}>{statsData.teamB.score}</span></div>

                </div>

             </div>

         </div>

         {/* Tab Switcher (Unified Structure) */}

         <div className="flex border-b border-white/10 bg-[#0F172A]">

             <button onClick={() => setActiveTab('clips')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'clips' ? 'text-white' : 'text-slate-500'}`}>

                 {t('ui.smartHighlight')}

                 {activeTab === 'clips' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full"></div>}

             </button>

             <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-slate-500'}`}>

                 {t('ui.basicData')}

                 {activeTab === 'stats' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>}

             </button>

         </div>

         <div className="flex-1 overflow-y-auto bg-[#0F172A]" data-correction-scroll>

             {activeTab === 'clips' ? (

                 <div className="p-4 pb-24">

                     {/* Collections - Horizontal Scroll */}

                     <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">

                         {HIGHLIGHT_COLLECTIONS.map(col => (

                            <button key={col.id} onClick={() => { setSelectedCollection(col.id); setSelectedFilter('all'); }} className={`flex-none px-3 py-2 rounded-lg border flex flex-col items-start min-w-[80px] transition-all ${selectedCollection === col.id ? `bg-${col.theme}-500/20 border-${col.theme}-500` : 'bg-black/40 border-white/10'}`}>

                                <span className={`text-xs font-bold ${selectedCollection === col.id ? 'text-white' : 'text-slate-300'}`}>{t(col.labelKey)}</span>

                            </button>

                         ))}

                     </div>

                    {/* Filter Pills */}

                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">

                        {filters.map(f => (

                            <button key={f.id} onClick={() => setSelectedFilter(f.id as EventFilterType)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedFilter === f.id ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}>{t((f as any).labelKey)}</button>

                        ))}

                    </div>

                    {/* Player Filter */}
                    {availablePlayers.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
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

                                         <AssetThumbnail type="video" category={resultSport || 'basketball'} />

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

                     {/* Personal Player Stats Dashboard (Priority Display) */}
                     {(() => {
                         const playerStats = calculatePlayerStats(resultSport || 'basketball', eventClaims);
                         
                         if (playerStats.length > 0) {
                             return (
                                 <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                                     <div className="px-4 py-3 bg-white/5 text-[10px] font-bold text-slate-400 border-b border-white/5">
                                         <span className="flex items-center gap-2">
                                             <User className="w-3 h-3" />
                                             <span>{t('ui.playerDashboard')}</span>
                                         </span>
                                     </div>
                                     <div className="p-4 space-y-3">
                                         {playerStats.map((player) => (
                                             <div key={player.key} className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                                                 <div className="flex items-center justify-between mb-2">
                                                     <div className="flex items-center gap-2">
                                                         <div className={`w-2 h-2 rounded-full ${player.color}`}></div>
                                                         <span className="text-sm font-bold text-white">{player.label}</span>
                                                         <span className="text-[10px] text-slate-400">{player.team === 'A' ? t('ui.teamA') : t('ui.teamB')}</span>
                                                     </div>
                                                 </div>
                                                 {isSoccer ? (
                                                     <div className="grid grid-cols-4 gap-2">
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">{t('report.goals')}</div>
                                                             <div className="text-lg font-bold text-white">{player.goals || 0}</div>
                                                         </div>
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">{t('report.corners')}</div>
                                                             <div className="text-lg font-bold text-white">{player.corners || 0}</div>
                                                         </div>
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">{t('clips.setpieceShort')}</div>
                                                             <div className="text-lg font-bold text-white">{player.setpieces || 0}</div>
                                                         </div>
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">{t('clips.penaltyShort')}</div>
                                                             <div className="text-lg font-bold text-white">{player.penalties || 0}</div>
                                                         </div>
                                                     </div>
                                                ) : (
                                                   <div className="grid grid-cols-3 gap-3 text-[11px]">
                                                       <div className="space-y-1">
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('report.totalPoints')}</span>
                                                               <span className="font-semibold text-white">{player.pts || 0}</span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('report.rebounds')}</span>
                                                               <span className="font-semibold text-white">{player.reb || 0}</span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('report.assists')}</span>
                                                               <span className="font-semibold text-white">{player.ast || 0}</span>
                                                           </div>
                                                       </div>
                                                       <div className="space-y-1">
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('report.fg')}</span>
                                                               <span className="font-semibold text-white">
                                                                   {(() => {
                                                                       const made = player.fgMade ?? 0;
                                                                       const att = player.fgAtt ?? 0;
                                                                       const pct = att > 0 ? Math.round((made / att) * 100) : 0;
                                                                       return att > 0 ? `${pct}%（${made}-${att}）` : '-';
                                                                   })()}
                                                               </span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('clips.3ptShort')}</span>
                                                               <span className="font-semibold text-white">
                                                                   {(() => {
                                                                       const made = player.tpMade ?? 0;
                                                                       const att = player.tpAtt ?? 0;
                                                                       const pct = att > 0 ? Math.round((made / att) * 100) : 0;
                                                                       return att > 0 ? `${pct}%（${made}-${att}）` : '-';
                                                                   })()}
                                                               </span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('clips.ftShort')}</span>
                                                               <span className="font-semibold text-white">
                                                                   {(() => {
                                                                       const made = player.ftMade ?? 0;
                                                                       const att = player.ftAtt ?? 0;
                                                                       const pct = att > 0 ? Math.round((made / att) * 100) : 0;
                                                                       return att > 0 ? `${pct}%（${made}-${att}）` : '-';
                                                                   })()}
                                                               </span>
                                                           </div>
                                                       </div>
                                                       <div className="space-y-1">
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">eFG%</span>
                                                               <span className="font-semibold text-white">
                                                                   {(() => {
                                                                       const fgMade = player.fgMade ?? 0;
                                                                       const fgAtt = player.fgAtt ?? 0;
                                                                       const tpMade = player.tpMade ?? 0;
                                                                       if (fgAtt === 0) return '-';
                                                                       const efg = (fgMade + 0.5 * tpMade) / fgAtt;
                                                                       return `${Math.round(efg * 100)}%`;
                                                                   })()}
                                                               </span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">TS%</span>
                                                               <span className="font-semibold text-white">
                                                                   {(() => {
                                                                       const pts = player.pts ?? 0;
                                                                       const fgAtt = player.fgAtt ?? 0;
                                                                       const ftAtt = player.ftAtt ?? 0;
                                                                       const denom = 2 * (fgAtt + 0.44 * ftAtt);
                                                                       if (!denom) return '-';
                                                                       const ts = pts / denom;
                                                                       return `${Math.round(ts * 100)}%`;
                                                                   })()}
                                                               </span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('report.steals')} / {t('report.turnovers')}</span>
                                                               <span className="font-semibold text-white">
                                                                   {(player.stl ?? 0)}/{player.tov ?? 0}
                                                               </span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('report.blocks')} / {t('report.fouls')}</span>
                                                               <span className="font-semibold text-white">
                                                                   {(player.blk ?? 0)}/{player.pf ?? 0}
                                                               </span>
                                                           </div>
                                                           <div className="flex justify-between">
                                                               <span className="text-slate-400">{t('report.oreb')} / {t('report.dreb')}</span>
                                                               <span className="font-semibold text-white">
                                                                   {(player.offReb ?? 0)}/{player.defReb ?? 0}
                                                               </span>
                                                           </div>
                                                       </div>
                                                   </div>
                                               )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             );
                         }
                         return null;
                     })()}

                     {/* Team Comparison Stats (Collapsible/Secondary) */}
                     <details className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                         <summary className="flex justify-between items-center px-4 py-3 bg-white/5 text-[10px] font-bold text-slate-400 border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                             <span className="flex items-center gap-2">
                                 <span>{t(statsData.teamA.nameKey)}</span>
                                 <span className={`text-sm font-bold ${statsData.teamA.color}`}>{statsData.teamA.score}</span>
                             </span>
                             <span>{t('ui.teamCompare')}</span>
                             <span className="flex items-center gap-2">
                                 <span className={`text-sm font-bold ${statsData.teamB.color}`}>{statsData.teamB.score}</span>
                                 <span>{t(statsData.teamB.nameKey)}</span>
                             </span>
                         </summary>
                         <div>
                             {basicStatsComparison.map((item, index) => (
                                 <div key={index} className={`flex justify-between items-center px-4 py-3 border-b border-white/5 last:border-0`}>
                                     <span className={`w-12 text-left font-mono font-bold ${item.a > item.b ? statsData.teamA.color : 'text-slate-400'}`}>{item.a}</span>
                                     <span className="flex-1 text-center text-xs text-slate-300">{t(`report.${item.rowKey}`)}</span>
                                     <span className={`w-12 text-right font-mono font-bold ${item.b > item.a ? statsData.teamB.color : 'text-slate-400'}`}>{item.b}</span>
                                 </div>
                             ))}
                            {/* Add rebound and steal to team comparison for basketball */}
                            {!isSoccer && (
                                <>
                                    {statsData.comparison.filter((i: any) => ['rebounds', 'steals'].includes(i.rowKey)).map((item, index) => {
                                        const aValue = typeof item.a === 'number' ? item.a : (item.a as any).pct || 0;
                                        const bValue = typeof item.b === 'number' ? item.b : (item.b as any).pct || 0;
                                        return (
                                            <div key={`extra-${index}`} className={`flex justify-between items-center px-4 py-3 border-b border-white/5 last:border-0`}>
                                                <span className={`w-12 text-left font-mono font-bold ${aValue > bValue ? statsData.teamA.color : 'text-slate-400'}`}>{aValue}</span>
                                                <span className="flex-1 text-center text-xs text-slate-300">{t(`report.${item.rowKey}`)}</span>
                                                <span className={`w-12 text-right font-mono font-bold ${bValue > aValue ? statsData.teamB.color : 'text-slate-400'}`}>{bValue}</span>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                         </div>
                     </details>
                    
                    {/* Heatmap in Basic Version */}
                    {isSoccer ? (
                        /* Soccer Run Heatmap (Movement) */
                        <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-4 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Map className="w-4 h-4 text-emerald-500" /> {t('ui.heatmapRun')}</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setHeatmapMode('both')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'both' 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {t('ui.all')}
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamA')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamA' 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {t('ui.teamA')}
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamB')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamB' 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {t('ui.teamB')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="aspect-[16/9] bg-emerald-900/40 rounded-xl relative border border-white/5 overflow-hidden">
                                <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0">
                                    <defs>
                                        <radialGradient id="goalHeatLow" cx="50%" cy="50%">
                                            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                                            <stop offset="50%" stopColor="rgba(34, 197, 94, 0.15)" />
                                            <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                                        </radialGradient>
                                        <radialGradient id="goalHeatHigh" cx="50%" cy="50%">
                                            <stop offset="0%" stopColor="rgba(20, 83, 45, 0.8)" />
                                            <stop offset="50%" stopColor="rgba(20, 83, 45, 0.5)" />
                                            <stop offset="100%" stopColor="rgba(20, 83, 45, 0)" />
                                        </radialGradient>
                                    </defs>
                                    
                                    <rect x="0" y="0" width="100" height="50" fill="rgba(34, 197, 94, 0.05)" />
                                    <rect x="0" y="0" width="100" height="50" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                                    <line x1="50" y1="0" x2="50" y2="50" stroke="white" strokeWidth="0.3" opacity="0.4" />
                                    <circle cx="50" cy="25" r="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                                    <rect x="0" y="12" width="18" height="26" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                                    <rect x="82" y="12" width="18" height="26" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
                                    
                                    {(heatmapMode === 'both' || heatmapMode === 'teamA') && (
                                        <g opacity={heatmapMode === 'both' ? 0.7 : 1}>
                                            <ellipse cx="12" cy="25" rx="4" ry="3" fill="url(#goalHeatHigh)" />
                                            <ellipse cx="8" cy="20" rx="3" ry="2" fill="url(#goalHeatHigh)" />
                                        </g>
                                    )}
                                    
                                    {(heatmapMode === 'both' || heatmapMode === 'teamB') && (
                                        <g opacity={heatmapMode === 'both' ? 0.7 : 1}>
                                            <ellipse cx="88" cy="25" rx="4" ry="3" fill="url(#goalHeatHigh)" />
                                            <ellipse cx="92" cy="20" rx="3" ry="2" fill="url(#goalHeatHigh)" />
                                        </g>
                                    )}
                                </svg>
                            </div>
                            
                            <div className="flex justify-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                                    <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(to right, rgba(34, 197, 94, 0.2), rgba(20, 83, 45, 0.8))' }}></div>
                                    <span>{t('ui.darkerMeansMore')}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Basketball Shot Heatmap */
                        <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-4 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> {t('ui.heatmapShot')}</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setHeatmapMode('both')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'both' 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {t('ui.all')}
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamA')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamA' 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {t('ui.teamA')}
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamB')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamB' 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {t('ui.teamB')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="aspect-[4/3] bg-orange-600/20 rounded-xl relative border border-white/5 overflow-hidden">
                                <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" className="absolute inset-0">
                                    <defs>
                                        <radialGradient id="shotHeatA" cx="50%" cy="50%">
                                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                                            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.5)" />
                                            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                                        </radialGradient>
                                        <radialGradient id="shotHeatB" cx="50%" cy="50%">
                                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                                            <stop offset="50%" stopColor="rgba(239, 68, 68, 0.5)" />
                                            <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                                        </radialGradient>
                                    </defs>
                                    
                                    <rect x="0" y="0" width="200" height="200" fill="#FF6B35" fillOpacity="0.1" />
                                    <line x1="0" y1="200" x2="200" y2="200" stroke="white" strokeWidth="2" />
                                    <rect x="60" y="120" width="80" height="80" fill="none" stroke="white" strokeWidth="2" />
                                    <line x1="60" y1="120" x2="140" y2="120" stroke="white" strokeWidth="2" />
                                    <circle cx="100" cy="120" r="20" fill="none" stroke="white" strokeWidth="2" />
                                    <path d="M 10 200 Q 100 20 190 200" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4,4" />
                                    <path d="M 80 200 Q 100 170 120 200" fill="none" stroke="white" strokeWidth="2" />
                                    <circle cx="100" cy="190" r="3" fill="white" />
                                    
                                    {(heatmapMode === 'both' || heatmapMode === 'teamA') && (
                                        <g opacity={heatmapMode === 'both' ? 0.8 : 1}>
                                            <ellipse cx="25" cy="185" rx="18" ry="15" fill="url(#shotHeatA)" />
                                            <ellipse cx="175" cy="185" rx="18" ry="15" fill="url(#shotHeatA)" />
                                            <ellipse cx="30" cy="120" rx="20" ry="18" fill="url(#shotHeatA)" />
                                            <ellipse cx="170" cy="120" rx="20" ry="18" fill="url(#shotHeatA)" />
                                        </g>
                                    )}
                                    
                                    {(heatmapMode === 'both' || heatmapMode === 'teamB') && (
                                        <g opacity={heatmapMode === 'both' ? 0.8 : 1}>
                                            <ellipse cx="100" cy="190" rx="25" ry="20" fill="url(#shotHeatB)" />
                                            <ellipse cx="100" cy="175" rx="20" ry="18" fill="url(#shotHeatB)" />
                                            <ellipse cx="85" cy="150" rx="18" ry="16" fill="url(#shotHeatB)" />
                                            <ellipse cx="115" cy="150" rx="18" ry="16" fill="url(#shotHeatB)" />
                                        </g>
                                    )}
                                </svg>
                            </div>
                            
                            <div className="flex justify-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                    <span className="text-[9px] font-bold text-blue-400">{t('ui.teamA')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <span className="text-[9px] font-bold text-red-400">{t('ui.teamB')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                     {/* Upsell Banner in Basic Stats */}

                     <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-4 border border-white/10 flex items-center justify-between">

                         <div>

                             <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1"><Crown className="w-3 h-3 text-amber-300" /> {t('ui.upgradePro')}</h4>

                             <p className="text-[10px] text-slate-400">{t('ui.unlockProDesc')}</p>

                         </div>

                         <button onClick={() => replaceView('ai_result_analysis')} className="bg-white text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full">{t('ui.upgradeNow')}</button>

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
                  <Map className="w-4 h-4 text-emerald-500" />
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
      replaceView,
      resultSport,
      setProgressModal,
      pushView,
      setShowShareModal,
      setShareType,
      setMergedVideoUrl,
      setShareContext,
      setSelectedEventForClaim,
      setShowPlayerSelector,
      eventClaims,
      setEventClaims,
      setToastMessage,
      setAigcPreviewMode,
      t,
    } = useAppContext();

    const [currentTime, setCurrentTime] = useState('00:00');

    const [showJumpToast, setShowJumpToast] = useState(false);

    const [activeEventTab, setActiveEventTab] = useState<EventFilterType>('all');

    // New: Tab State for Analysis Screen - clips / stats / advanced / AIGC

    const [activeTab, setActiveTab] = useState<'clips' | 'stats' | 'advanced' | 'aigc'>('clips');

    const [editingClipId, setEditingClipId] = useState<number | null>(null);
    const [editingDuration, setEditingDuration] = useState<number>(0);
    
    // Manual correction states
    const [editingTimeClipId, setEditingTimeClipId] = useState<number | null>(null);
    const [editingTime, setEditingTime] = useState<string>('');

    // Clips-related states for advanced view
    const [selectedCollection, setSelectedCollection] = useState('full');
    const [selectedFilter, setSelectedFilter] = useState<EventFilterType>('all');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedClipIds, setSelectedClipIds] = useState<number[]>([]);
    
    // Player filter state for Pro personal highlights
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    
    // Player marking dropdown state
    const [openPlayerMenuId, setOpenPlayerMenuId] = useState<number | null>(null);
    // Event type correction dropdown state
    const [openTypeMenuId, setOpenTypeMenuId] = useState<number | null>(null);

    // AIGC & history tabs state
    const [aiStoryTone, setAiStoryTone] = useState<'pro' | 'passion' | 'fun'>('pro');
    const [aiStoryVariant, setAiStoryVariant] = useState<number>(0);
    const [selectedHistoryMatches, setSelectedHistoryMatches] = useState<string[]>([]);

    // AIGC Lab: 换背景换元素 & AI Coach
    const [oneClickSelectedClipId, setOneClickSelectedClipId] = useState<number | null>(null);
    const [oneClickBackgroundType, setOneClickBackgroundType] = useState<string | null>(null);
    const [oneClickElementType, setOneClickElementType] = useState<string | null>(null);
    const [oneClickGenerating, setOneClickGenerating] = useState(false);
    const [oneClickHasPreview, setOneClickHasPreview] = useState(false);

    const [aiCoachSelectedClipId, setAiCoachSelectedClipId] = useState<number | null>(null);
    const [aiCoachComment, setAiCoachComment] = useState('');
    const [aiCoachLoading, setAiCoachLoading] = useState(false);
    const [aiCoachHasVideo, setAiCoachHasVideo] = useState(false);
    
    // 球员汇总看板：相关视频 / 热区图浮层状态
    const [summaryVideoPlayerLabel, setSummaryVideoPlayerLabel] = useState<string | null>(null);
    const [summaryHeatmapPlayerLabel, setSummaryHeatmapPlayerLabel] = useState<string | null>(null);
    // 球员卡片展开状态（篮球/足球）
    const [expandedSummaryPlayerId, setExpandedSummaryPlayerId] = useState<number | null>(null);

    type DropdownRect = { top?: number; bottom?: number; left: number; minWidth: number; placement: 'above' | 'below' };
    const typeTriggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const playerTriggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const [typeDropdownRect, setTypeDropdownRect] = useState<DropdownRect | null>(null);
    const [playerDropdownRect, setPlayerDropdownRect] = useState<DropdownRect | null>(null);

    // Get clips for the current sport
    const clips = AI_CLIPS_ADVANCED.filter(clip => clip.sport === (resultSport || 'basketball'));
    const [clipsState, setClipsState] = useState(clips);

    useEffect(() => {
        setClipsState(AI_CLIPS_ADVANCED.filter(clip => clip.sport === (resultSport || 'basketball')));
    }, [resultSport]);

    // Extract unique players (labels) from eventClaims + clip.player for filter
    const availablePlayers = Array.from(new Set(
        clipsState.flatMap(clip => {
          const L = (eventClaims[clip.id] ?? clip.player) as string | null | undefined;
          return L && L.trim() ? [L.trim()] : [];
        })
    )).sort();
    
    // Reset player filter if selected player is no longer available
    useEffect(() => {
        if (selectedPlayer && selectedPlayer !== 'all' && !availablePlayers.includes(selectedPlayer)) {
            setSelectedPlayer('all');
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
                setTypeDropdownRect(null);
                setPlayerDropdownRect(null);
            }
        };
        if (openPlayerMenuId !== null || openTypeMenuId !== null) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openPlayerMenuId, openTypeMenuId]);

    // Compute Portal dropdown position when type or player menu opens; clear on close
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
        if (openTypeMenuId != null) {
            measure(typeTriggerRefs.current, openTypeMenuId, setTypeDropdownRect, 220, 100);
            setPlayerDropdownRect(null);
        } else {
            setTypeDropdownRect(null);
        }
        if (openPlayerMenuId != null) {
            measure(playerTriggerRefs.current, openPlayerMenuId, setPlayerDropdownRect, 200, 120);
            setTypeDropdownRect(null);
        } else {
            setPlayerDropdownRect(null);
        }
    }, [openTypeMenuId, openPlayerMenuId]);

    // Close correction menus on scroll (Portal dropdowns would otherwise get detached)
    useEffect(() => {
        const onScroll = () => {
            if (openTypeMenuId !== null || openPlayerMenuId !== null) {
                setOpenTypeMenuId(null);
                setOpenPlayerMenuId(null);
                setTypeDropdownRect(null);
                setPlayerDropdownRect(null);
            }
        };
        const scrollEl = document.querySelector('[data-correction-scroll]');
        if (scrollEl && (openTypeMenuId !== null || openPlayerMenuId !== null)) {
            scrollEl.addEventListener('scroll', onScroll, { passive: true });
            return () => scrollEl.removeEventListener('scroll', onScroll);
        }
    }, [openTypeMenuId, openPlayerMenuId]);

    const handleClipClick = (time: string) => { 
        setCurrentTime(time); 
        setShowJumpToast(true); 
        setTimeout(() => setShowJumpToast(false), 2000); 
    };

    const handleEditDuration = (clipId: number, currentDuration: string) => {
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
        
        setClipsState(prevClips => 
            prevClips.map(clip => 
                clip.id === editingClipId 
                    ? { ...clip, duration: `${editingDuration}s` }
                    : clip
            )
        );
        
        // Also update the global clips array
        const globalClipIndex = AI_CLIPS_ADVANCED.findIndex(c => c.id === editingClipId);
        if (globalClipIndex !== -1) {
            (AI_CLIPS_ADVANCED[globalClipIndex] as any).duration = `${editingDuration}s`;
        }
        
        setEditingClipId(null);
        setEditingDuration(0);
    };

    const handleCancelEdit = () => {
        setEditingClipId(null);
        setEditingDuration(0);
    };

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
        setToastMessage(t('ui.marked'));
        setTimeout(() => setToastMessage(null), 2000);
    };

    const isSoccer = resultSport === 'soccer';

    // Manual correction handlers
    const handleStartEditTime = (clipId: number, currentTime: string) => {
        setEditingTime(currentTime);
        setEditingTimeClipId(clipId);
    };

    const handleSaveTime = (clipId: number) => {
        // Validate time format MM:SS
        const timeRegex = /^([0-5]?[0-9]):([0-5][0-9])$/;
        if (!timeRegex.test(editingTime)) {
            // Invalid format, don't save
            setEditingTimeClipId(null);
            setEditingTime('');
            return;
        }
        
        setClipsState(prevClips => 
            prevClips.map(clip => 
                clip.id === clipId 
                    ? { ...clip, time: editingTime }
                    : clip
            )
        );
        
        // Also update global clips array
        const globalClipIndex = AI_CLIPS_ADVANCED.findIndex(c => c.id === clipId);
        if (globalClipIndex !== -1) {
            (AI_CLIPS_ADVANCED[globalClipIndex] as any).time = editingTime;
        }
        
        setEditingTimeClipId(null);
        setEditingTime('');
    };

    const handleCancelTimeEdit = () => {
        setEditingTimeClipId(null);
        setEditingTime('');
    };

    // Label helper for event type correction (type + scoreType → display label)
    const getLabelForEvent = (sport: string, type: string, scoreType: number | string): string => {
        const isSoc = sport === 'soccer';
        if (isSoc) {
            const keyMap: Record<string, string> = {
                goal: 'clips.goal',
                corner: 'clips.corner',
                setpiece: 'clips.setpiece',
                penalty: 'clips.penalty',
            };
            const key = keyMap[String(scoreType)] ?? 'clips.goal';
            return t(key);
        }
        if (type === 'score') {
            const keyMap: Record<number, string> = {
                1: 'clips.1ptFt',
                2: 'clips.2pt',
                3: 'clips.3pt',
            };
            const key = keyMap[Number(scoreType)] ?? 'clips.2pt';
            return t(key);
        }
        const keyMap: Record<string, string> = {
            rebound: 'clips.rebound',
            steal: 'clips.steal',
            assist: 'clips.assist',
        };
        const key = keyMap[String(scoreType)] ?? 'clips.rebound';
        return t(key);
    };

    // Manual correction: 阵营识别
    const handleCorrectTeam = (clipId: number, newTeam: 'A' | 'B') => {
        setClipsState(prev =>
            prev.map(c => (c.id === clipId ? { ...c, team: newTeam } : c))
        );
        const idx = AI_CLIPS_ADVANCED.findIndex(c => c.id === clipId);
        if (idx !== -1) (AI_CLIPS_ADVANCED[idx] as any).team = newTeam;
        setToastMessage(t('ui.sideCorrected'));
        setTimeout(() => setToastMessage(null), 2000);
    };

    // Manual correction: 事件类型 / 得分结果 (type + scoreType + label; 得分结果含 命中/未中)
    type EventTypeOption = { id: string | number; labelKey: string; type: string; scoreType: number | string; scored?: boolean };
    const eventTypeOptions: EventTypeOption[] = isSoccer
        ? [
            { id: 'goal', labelKey: 'clips.goal', type: 'soccer_event', scoreType: 'goal' },
            { id: 'corner', labelKey: 'clips.cornerShort', type: 'soccer_event', scoreType: 'corner' },
            { id: 'setpiece', labelKey: 'clips.setpieceShort', type: 'soccer_event', scoreType: 'setpiece' },
            { id: 'penalty', labelKey: 'clips.penaltyShort', type: 'soccer_event', scoreType: 'penalty' },
        ]
        : [
            { id: 3, labelKey: 'clips.3ptShort', type: 'score', scoreType: 3, scored: true },
            { id: 2, labelKey: 'clips.2ptShort', type: 'score', scoreType: 2, scored: true },
            { id: 1, labelKey: 'clips.ftShort', type: 'score', scoreType: 1, scored: true },
            { id: 'rebound', labelKey: 'clips.reboundShort', type: 'basketball_event', scoreType: 'rebound' },
            { id: 'steal', labelKey: 'clips.steal', type: 'basketball_event', scoreType: 'steal' },
            { id: 'assist', labelKey: 'clips.assist', type: 'basketball_event', scoreType: 'assist' },
        ];

    const handleCorrectEventType = (clipId: number, opt: EventTypeOption) => {
        const sport = resultSport || 'basketball';
        const label = t(opt.labelKey);
        const scored = opt.scored;
        setClipsState(prev =>
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
            clip.label = label;
            if (scored !== undefined) clip.scored = scored;
        }
        setOpenTypeMenuId(null);
        setToastMessage(t('ui.typeCorrected'));
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleMergeClips = () => {
        if (selectedClipIds.length === 0) return;

        setShareContext({ type: 'selected' });
        setProgressModal({ show: true, title: t('ui.mergingSaving'), progress: 0 });

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3 + 2;
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

    const handleSharePlayerClips = (label: string) => {
        const playerClips = clipsState.filter(c => (eventClaims[c.id] ?? c.player) === label);
        if (playerClips.length === 0) {
            setToastMessage(t('ui.noClipsForPlayer'));
            setTimeout(() => setToastMessage(null), 2000);
            return;
        }
        setShareContext({ type: 'player_clips', playerLabel: label });
        setProgressModal({ show: true, title: t('ui.mergingLabel', { label }), progress: 0 });

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3 + 2;
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

    const handleShare = () => {
        setShareType('selected');
        setShowShareModal(true);
    };

    const handleExportAll = () => {
        setProgressModal({ show: true, title: t('ui.exportingAll'), progress: 0 });

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3 + 5;
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

    const handleExportReport = () => {
        setProgressModal({ show: true, title: t('ui.generatingReport'), progress: 0 });

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 3 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setProgressModal({ show: false, title: '', progress: 0 });
                    setShareType('report');
                    setShareContext({ type: 'report' });
                    setShowShareModal(true);
                }, 1000);
            }
            setProgressModal((prev: { show: boolean; title: string; progress: number; message?: string }) => ({ ...prev, progress: Math.min(progress, 100) }));
        }, 200);
    };

    const statsData = isSoccer ? SOCCER_MATCH_STATS : TEAM_MATCH_STATS;

    // Helper function to find first event of a specific type
    const findFirstEventByType = (eventType: string | number) => {
        if (isSoccer) {
            if (eventType === 'goal') {
                return clipsState.find(clip => clip.scoreType === 'goal');
            }
            return clipsState.find(clip => clip.scoreType === eventType);
        } else {
            if (eventType === 'score') {
                // For 'score' (总得分), return first score event
                return clipsState.find(clip => clip.type === 'score');
            }
            if (eventType === 1 || eventType === 2 || eventType === 3) {
                return clipsState.find(clip => clip.type === 'score' && clip.scoreType === eventType);
            }
            if (eventType === 'rebound' || eventType === 'steal' || eventType === 'assist') {
                return clipsState.find(clip => clip.type === 'basketball_event' && clip.scoreType === eventType);
            }
        }
        return undefined;
    };

    // Map data row rowKey to event type for click navigation
    const getEventTypeFromRowKey = (rowKey: string): string | number | null => {
        if (isSoccer) {
            if (rowKey === 'goals' || rowKey === 'xg') return 'goal';
            if (rowKey === 'corners') return 'corner';
            if (rowKey === 'setpiece') return 'setpiece';
            if (rowKey === 'penalty') return 'penalty';
            if (rowKey === 'shotsOnTarget') return 'goal';
            return null;
        } else {
            if (rowKey === 'totalPoints') return 'score';
            if (rowKey === 'threePtPoints') return 3;
            if (rowKey === 'ftPoints') return 1;
            if (rowKey === 'rebounds') return 'rebound';
            if (rowKey === 'steals') return 'steal';
            if (rowKey === 'assists') return 'assist';
            if (rowKey === 'fgPct' || rowKey === 'threePtPct' || rowKey === 'ftPct' || rowKey === 'ftAttempts') return null;
        }
        return null;
    };

    // Process stats comparison for Pro view (basketball order; rows use rowKey)
    const processedStatsComparison = isSoccer 
        ? statsData.comparison 
        : (() => {
            const comparison = [...statsData.comparison] as Array<{ rowKey: string; a: any; b: any; highlight?: boolean }>;
            const findRowByKey = (rowKey: string) => comparison.find(item => item.rowKey === rowKey);

            const rows: Array<{ rowKey: string; a: any; b: any; highlight?: boolean }> = [];

            const pushIf = (row: any) => {
                if (row) rows.push(row);
            };

            pushIf(findRowByKey('totalPoints'));
            pushIf(findRowByKey('rebounds'));
            pushIf(findRowByKey('oreb'));
            pushIf(findRowByKey('dreb'));
            pushIf(findRowByKey('assists'));
            pushIf(findRowByKey('steals'));
            pushIf(findRowByKey('blocks'));
            pushIf(findRowByKey('turnovers'));
            pushIf(findRowByKey('fouls'));

            const ftRate: any = findRowByKey('ftPct');
            if (ftRate && ftRate.a && typeof ftRate.a === 'object') {
                rows.push({ rowKey: 'ftAttempts', a: ftRate.a.att, b: ftRate.b.att });
                rows.push(ftRate);
            }

            pushIf(findRowByKey('fgPct'));
            pushIf(findRowByKey('threePtPct'));

            return rows;
        })();

    // Filters for clips tab
    const filters = isSoccer 
      ? [ { id: 'all', labelKey: 'filter.all' }, { id: 'goal', labelKey: 'filter.goal' }, { id: 'corner', labelKey: 'filter.corner' }, { id: 'setpiece', labelKey: 'filter.setpiece' }, { id: 'penalty', labelKey: 'filter.penalty' } ]
      : [ { id: 'all', labelKey: 'filter.all' }, { id: 3, labelKey: 'clips.3ptShort' }, { id: 2, labelKey: 'clips.2ptShort' }, { id: 1, labelKey: 'filter.ft' }, { id: 'rebound', labelKey: 'filter.rebound' }, { id: 'steal', labelKey: 'filter.steal' }, { id: 'assist', labelKey: 'filter.assist' } ];

    // Display clips for clips tab
    const displayClips = clipsState.filter(clip => { 
        if (selectedCollection === 'team_a' && clip.team !== 'A') return false;
        if (selectedCollection === 'team_b' && clip.team !== 'B') return false;
        
        // Player filter: use eventClaims first, then clip.player
        if (selectedPlayer && selectedPlayer !== 'all') {
            const effective = (eventClaims[clip.id] ?? clip.player) as string | null | undefined;
            if (effective !== selectedPlayer) return false;
        }
        
        if (selectedFilter !== 'all') { 
            if (isSoccer) {
                if (selectedFilter === 'goal') return clip.scoreType === 'goal';
                if (selectedFilter === 'corner') return clip.scoreType === 'corner';
                if (selectedFilter === 'setpiece') return clip.scoreType === 'setpiece';
                if (selectedFilter === 'penalty') return clip.scoreType === 'penalty';
            } else {
                // Basketball: handle score types and basketball_event types
                if (selectedFilter === 3) return clip.type === 'score' && clip.scoreType === 3;
                if (selectedFilter === 2) return clip.type === 'score' && clip.scoreType === 2;
                if (selectedFilter === 1) return clip.type === 'score' && clip.scoreType === 1;
                if (selectedFilter === 'rebound') return clip.type === 'basketball_event' && clip.scoreType === 'rebound';
                if (selectedFilter === 'steal') return clip.type === 'basketball_event' && clip.scoreType === 'steal';
                if (selectedFilter === 'assist') return clip.type === 'basketball_event' && clip.scoreType === 'assist';
            }
            return false;
        } 
        // For 'all' filter, show all events (no confidence filtering for Pro)
        return true; 
    });

    // AIGC Lab helpers
    const handleGenerateOneClickAIGC = () => {
        if (!oneClickSelectedClipId) {
            setToastMessage(t('ui.selectOneClipFirst'));
            setTimeout(() => setToastMessage(null), 2000);
            return;
        }
        if (!oneClickBackgroundType && !oneClickElementType) {
            setToastMessage(t('ui.selectBgOrElement'));
            setTimeout(() => setToastMessage(null), 2000);
            return;
        }
        setOneClickGenerating(true);
        setOneClickHasPreview(false);
        setTimeout(() => {
            setOneClickHasPreview(true);
            setOneClickGenerating(false);
        }, 800);
    };

    const handleGenerateClipCoach = () => {
        if (!aiCoachSelectedClipId) {
            setToastMessage(t('ui.selectOneClipFirst'));
            setTimeout(() => setToastMessage(null), 2000);
            return;
        }
        setAiCoachLoading(true);
        const clip = displayClips.find(c => c.id === aiCoachSelectedClipId);
        setTimeout(() => {
            setAiCoachComment(
                clip
                    ? t('ui.coachFeedbackGood', {
                        time: clip.time,
                        label: clip.labelKey ? t(clip.labelKey) : (clip as any).label,
                      })
                    : t('ui.coachFeedbackDefault')
            );
            setAiCoachHasVideo(true);
            setAiCoachLoading(false);
        }, 800);
    };

    const toggleClipSelection = (id: number) => { 
        if (selectedClipIds.includes(id)) { 
            setSelectedClipIds(selectedClipIds.filter(cid => cid !== id)); 
        } else { 
            setSelectedClipIds([...selectedClipIds, id]); 
        } 
    };

    const filteredEvents = clipsState.filter(clip => { 

        if (clip.sport !== (resultSport || 'basketball')) return false;

        if (activeEventTab === 'all') {
            // For basketball, include both score events and basketball_event types (rebound/steal/assist)
            if (isSoccer) {
                return true; // All soccer events
            } else {
                return clip.type === 'score' || clip.type === 'basketball_event';
            }
        }

        if (isSoccer) {
            return clip.scoreType === activeEventTab;
        } else {
            // Basketball: handle score types (1, 2, 3) and basketball_event types (rebound, steal, assist)
            if (activeEventTab === 1 || activeEventTab === 2 || activeEventTab === 3) {
                return clip.type === 'score' && clip.scoreType === activeEventTab;
            }
            if (activeEventTab === 'rebound' || activeEventTab === 'steal' || activeEventTab === 'assist') {
                return clip.type === 'basketball_event' && clip.scoreType === activeEventTab;
            }
        }

        return false;

    });

    const eventTabs = isSoccer 

      ? [{ id: 'all', labelKey: 'filterShort.all' }, { id: 'goal', labelKey: 'filterShort.goal' }, { id: 'corner', labelKey: 'filterShort.corner' }, { id: 'setpiece', labelKey: 'filterShort.setpiece' }, { id: 'penalty', labelKey: 'filterShort.penalty' }]

      : [{ id: 'all', labelKey: 'filterShort.all' }, { id: 3, labelKey: 'filterShort.3' }, { id: 2, labelKey: 'filterShort.2' }, { id: 1, labelKey: 'filterShort.1' }, { id: 'rebound', labelKey: 'filterShort.rebound' }, { id: 'steal', labelKey: 'filterShort.steal' }, { id: 'assist', labelKey: 'filterShort.assist' }];

    return (

      <div className="flex flex-col h-full bg-[#0F172A] text-white">

         <div className="h-[240px] bg-black relative shrink-0">
             <AssetThumbnail type="video" category={resultSport || 'basketball'} />
             <div className="absolute top-4 left-4 z-20">
                 <button onClick={popToHome} className="p-2 bg-black/40 rounded-full">
                     <ArrowLeft className="w-5 h-5" />
                 </button>
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-4xl font-bold drop-shadow-lg opacity-80">{currentTime}</div>
             {showJumpToast && (
                 <div className="absolute top-[60%] left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 z-30">
                     <RotateCcw className="w-3 h-3" /> {t('ui.jumpTo')} {currentTime}
                 </div>
             )}
             <div className="absolute bottom-0 left-0 right-0 p-4 pb-4 z-20 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent">
                 <div className="flex justify-between items-end mb-2">
                     <div className="flex flex-col items-center">
                         <span className={`text-3xl font-black ${statsData.teamA.color} drop-shadow-lg`}>{statsData.teamA.score}</span>
                         <span className="text-xs font-bold text-white/90">{t(statsData.teamA.nameKey)}</span>
                     </div>
                     <div className="text-2xl font-black text-slate-500 pb-2">VS</div>
                     <div className="flex flex-col items-center">
                         <span className={`text-3xl font-black ${statsData.teamB.color} drop-shadow-lg`}>{statsData.teamB.score}</span>
                         <span className="text-xs font-bold text-white/90">{t(statsData.teamB.nameKey)}</span>
                     </div>
                 </div>
             </div>
         </div>

         

         {/* Tab Switcher */}

         <div className="flex border-b border-white/10 bg-[#0F172A]">

             <button onClick={() => setActiveTab('clips')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'clips' ? 'text-white' : 'text-slate-500'}`}>

                 {t('ui.smartHighlight')}

                 {activeTab === 'clips' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full"></div>}

             </button>

             <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-slate-500'}`}>

                 {t('ui.eventReview')}

                 {activeTab === 'stats' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>}

             </button>

            <button onClick={() => setActiveTab('advanced')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'advanced' ? 'text-white' : 'text-slate-500'}`}>

                <span className="flex items-center justify-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> {t('ui.advancedAnalysis')}</span>

                {activeTab === 'advanced' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-full"></div>}

            </button>

            <button onClick={() => setActiveTab('aigc')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'aigc' ? 'text-white' : 'text-slate-500'}`}>

                <span className="flex items-center justify-center gap-1"><Scissors className="w-3 h-3 text-purple-400" /> {t('ui.aigcLab')}</span>

                {activeTab === 'aigc' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-full"></div>}

            </button>

         </div>

         <div className="flex-1 overflow-y-auto" data-correction-scroll>

             <div className="px-4 py-4 space-y-4">

                 

                 {activeTab === 'clips' ? (

                     // --- Clips Tab for Advanced View ---

                     <div className="pb-24">

                         {/* Collections - Horizontal Scroll */}

                         <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">

                             {HIGHLIGHT_COLLECTIONS.map(col => (

                            <button key={col.id} onClick={() => { setSelectedCollection(col.id); setSelectedFilter('all'); }} className={`flex-none px-3 py-2 rounded-lg border flex flex-col items-start min-w-[80px] transition-all ${selectedCollection === col.id ? `bg-${col.theme}-500/20 border-${col.theme}-500` : 'bg-black/40 border-white/10'}`}>

                                <span className={`text-xs font-bold ${selectedCollection === col.id ? 'text-white' : 'text-slate-300'}`}>{t(col.labelKey)}</span>

                            </button>

                             ))}

                         </div>

                         

                         {/* Filter Pills */}

                         <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">

                             {filters.map(f => (

                                 <button key={f.id} onClick={() => setSelectedFilter(f.id as EventFilterType)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedFilter === f.id ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}>{t((f as any).labelKey)}</button>

                             ))}

                         </div>

                         {/* Player Filter */}
                         {availablePlayers.length > 0 && (
                             <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                                 <button 
                                     onClick={() => setSelectedPlayer('all')} 
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

                         {/* Selection Toggle - 移到列表上方，更接近操作对象 */}
                         <div className="flex justify-end mb-3">
                             <button onClick={(e) => { e.stopPropagation(); setIsSelectionMode(!isSelectionMode); }} className={`text-xs font-bold flex items-center gap-1 transition-colors ${isSelectionMode ? 'text-orange-400' : 'text-slate-500'}`}>
                                 {isSelectionMode ? t('ui.cancelSelect') : t('ui.selectClips')}
                             </button>
                         </div>

                         {/* Clip List */}

                         <div className="space-y-3">

                             {displayClips.length === 0 && <div className="text-center text-slate-500 text-xs py-8">{t('ui.noClipsInCategory')}</div>}

                             {displayClips.map((clip) => { 

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

                                             <AssetThumbnail type="video" category={resultSport || 'basketball'} />

                                             {!isSelectionMode && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle className="w-6 h-6 text-white/80" /></div>}

                                             <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px]">{editingClipId === clip.id ? `${editingDuration}s` : clip.duration}</div>

                                         </div>

                                         <div className="flex-1 p-2.5 flex flex-col justify-between relative">

                                             <div>

                                                 <div className="flex items-center justify-between mb-1.5">

                                                     <h4 className="text-sm font-bold text-slate-200">{clip.labelKey ? t(clip.labelKey) : (clip as any).label}</h4>

                                                     <div className="flex items-center gap-1.5">
                                                         <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {clip.time}</span>
                                                         <button
                                                             onClick={(e) => { e.stopPropagation(); handleCorrectTeam(clip.id, clip.team === 'A' ? 'B' : 'A'); }}
                                                             className={`text-[8px] px-1 rounded transition-opacity hover:opacity-80 ${clip.team === 'A' ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}
                                                             title={t('ui.correctTeamTitle')}
                                                         >
                                                             {clip.team === 'A' ? t('ui.teamA') : t('ui.teamB')}
                                                         </button>
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
                                                             className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[8px] font-bold text-white transition-colors whitespace-nowrap shrink-0"
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

                ) : activeTab === 'stats' ? (

                     // --- Basic Stats View ---

                     <>

                        {/* 关键时间轴 - 放在最上面，最直观的回顾方式 */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <h3 className="text-sm font-bold text-slate-300 whitespace-nowrap">{t('ui.keyTimeline')}</h3>
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
                                    <div className="flex gap-1 flex-nowrap">
                                        {eventTabs.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setActiveEventTab(f.id as EventFilterType)}
                                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors shrink-0 ${
                                                    activeEventTab === f.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                                                }`}
                                            >
                                                {t((f as any).labelKey)}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsSelectionMode(!isSelectionMode)}
                                        className="px-2 py-1 rounded-full border border-white/10 text-[10px] font-bold text-slate-300 bg-slate-900/60 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                                    >
                                        {isSelectionMode ? t('ui.finishSelect') : t('ui.selectExport')}
                                    </button>
                                </div>
                            </div>

                            {isSelectionMode && (
                                <div className="flex justify-between items-center mb-2 px-1 text-[10px] text-slate-400">
                                    <span>{t('ui.selectedCount', { count: selectedClipIds.length })}</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedClipIds(
                                                    selectedClipIds.length === filteredEvents.length
                                                        ? []
                                                        : filteredEvents.map(c => c.id)
                                                )
                                            }
                                            className="text-blue-400 font-bold"
                                        >
                                            {selectedClipIds.length === filteredEvents.length ? t('ui.deselectAll') : t('ui.selectAllPage')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleShare}
                                            className="px-2 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                        >
                                            {t('ui.exportClips')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">

                                {filteredEvents.map(clip => {
                                    const isSelected = selectedClipIds.includes(clip.id);
                                    const teamName = clip.team === 'A' ? t(statsData.teamA.nameKey) : t(statsData.teamB.nameKey);
                                    const playerLabel = (eventClaims[clip.id] ?? clip.player) as string | null | undefined;

                                    const handleRowClick = () => {
                                        if (isSelectionMode) {
                                            toggleClipSelection(clip.id);
                                        } else {
                                            handleClipClick(clip.time);
                                        }
                                    };

                                    return (
                                        <div
                                            key={clip.id}
                                            onClick={handleRowClick}
                                            className={`group bg-[#1E293B] p-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                                                isSelectionMode
                                                    ? isSelected
                                                        ? 'border border-blue-500 bg-blue-900/40'
                                                        : 'border border-white/5 active:bg-blue-900/20'
                                                    : 'active:bg-blue-900/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div
                                                        className={`w-1 h-8 rounded-full ${
                                                            clip.team === 'A' ? 'bg-blue-500' : 'bg-red-500'
                                                        }`}
                                                    />
                                                    <span className="text-[9px] text-slate-400">
                                                        {clip.time}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                                                clip.team === 'A'
                                                                    ? 'bg-blue-500/20 text-blue-300'
                                                                    : 'bg-red-500/20 text-red-300'
                                                            }`}
                                                        >
                                                            {teamName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {clip.type === 'score'
                                                                ? `${clip.scoreType}`
                                                                : (clip.labelKey ? t(clip.labelKey) : (clip as any).label)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-200 truncate">
                                                        {clip.labelKey ? t(clip.labelKey) : (clip as any).label}
                                                    </div>
                                                    {playerLabel && (
                                                        <div className="mt-0.5 text-[10px] text-slate-400 truncate">
                                                            {t('ui.relatedPlayer')}{playerLabel}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isSelectionMode && (
                                                <div className="ml-3">
                                                    <div
                                                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                                                            isSelected
                                                                ? 'border-blue-400 bg-blue-500 text-white'
                                                                : 'border-slate-500 bg-slate-900 text-slate-400'
                                                        }`}
                                                    >
                                                        {isSelected ? '✓' : ''}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 数据概览关键事件轴：主要用于回顾与快速导出 */}

                                        </div>
                                    );
                                })}

                                {filteredEvents.length === 0 && <div className="text-center text-slate-600 text-xs py-4">{t('ui.noEventsInType')}</div>}

                            </div>
                        </div>

                        {/* 团队数据对比 */}
                        <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden mb-4">
                            <div className="flex justify-between items-center px-4 py-3 bg-white/5 text-[10px] font-bold text-slate-400 border-b border-white/5">
                                <span>{t(statsData.teamA.nameKey)}</span>
                                <span>{t('ui.dataItem')}</span>
                                <span>{t(statsData.teamB.nameKey)}</span>
                            </div>
                            {processedStatsComparison.map((item, index) => {
                                const eventType = getEventTypeFromRowKey(item.rowKey);
                                const isClickable = eventType !== null;
                                const handleRowClick = () => {
                                    if (isClickable) {
                                        const firstEvent = findFirstEventByType(eventType);
                                        if (firstEvent) {
                                            handleClipClick(firstEvent.time);
                                        } else {
                                            // Show toast if no event found
                                            setShowJumpToast(true);
                                            setTimeout(() => setShowJumpToast(false), 2000);
                                        }
                                    }
                                };

                                const isRateRow = !isSoccer && item && typeof item.a === 'object' && item.a !== null && 'pct' in item.a;

                                // 显示文本：命中率类行显示 50%（10-20），其他行直接显示数值
                                let aDisplay: any = item.a;
                                let bDisplay: any = item.b;

                                let aValue: number;
                                let bValue: number;

                                if (isRateRow) {
                                    const aStats = item.a as { pct: number; made: number; att: number };
                                    const bStats = item.b as { pct: number; made: number; att: number };

                                    const fmtPct = (v: number) => `${Math.round((v || 0) * 100)}%`;

                                    aDisplay = `${fmtPct(aStats.pct)}（${aStats.made}-${aStats.att}）`;
                                    bDisplay = `${fmtPct(bStats.pct)}（${bStats.made}-${bStats.att}）`;

                                    // 柱状图使用出手次数体现“体量”
                                    aValue = aStats.att || 0;
                                    bValue = bStats.att || 0;
                                } else {
                                    const aNum = typeof item.a === 'number' ? item.a : parseFloat(String(item.a)) || 0;
                                    const bNum = typeof item.b === 'number' ? item.b : parseFloat(String(item.b)) || 0;
                                    aValue = aNum;
                                    bValue = bNum;
                                }
                                const maxValue = Math.max(aValue, bValue, 1);
                                const aIsHigher = aValue > bValue;
                                const bIsHigher = bValue > aValue;
                                const aPercent = (aValue / maxValue) * 100;
                                const bPercent = (bValue / maxValue) * 100;

                                return (
                                    <div 
                                        key={index} 
                                        onClick={isClickable ? handleRowClick : undefined}
                                        className={`px-4 py-3 border-b border-white/5 last:border-0 ${item.highlight ? 'bg-white/5' : ''} ${isClickable ? 'cursor-pointer hover:bg-white/10 active:bg-white/15 transition-colors' : ''}`}
                                    >
                                        {/* 顶部数值 + 指标文案 */}
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`w-16 text-left text-[11px] font-mono font-bold ${aIsHigher ? statsData.teamA.color : 'text-slate-500'}`}>
                                                {aDisplay}
                                            </span>
                                            <span className="flex-1 text-center text-[11px] text-slate-300">
                                                {t(`report.${item.rowKey}`)}
                                            </span>
                                            <span className={`w-16 text-right text-[11px] font-mono font-bold ${bIsHigher ? statsData.teamB.color : 'text-slate-500'}`}>
                                                {bDisplay}
                                            </span>
                                        </div>

                                        {/* 底部柱状图对比：左 A 队 / 右 B 队 */}
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex-1 h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        aIsHigher
                                                            ? statsData.teamA.color.replace('text-', 'bg-')
                                                            : 'bg-slate-600/70'
                                                    }`}
                                                    style={{ width: `${aPercent}%` }}
                                                />
                                            </div>
                                            <div className="flex-1 h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        bIsHigher
                                                            ? statsData.teamB.color.replace('text-', 'bg-')
                                                            : 'bg-slate-600/70'
                                                    }`}
                                                    style={{ width: `${bPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* {t('ui.heatmapPlayer')}选择器（就近控制个人视角） */}
                        {availablePlayers.length > 0 && (
                            <div className="mt-4 mb-2 px-1 flex items-center justify-between gap-3">
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                    {t('ui.heatmapPlayer')}
                                </span>
                                <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlayer('all')}
                                        className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${
                                            selectedPlayer === null || selectedPlayer === 'all'
                                                ? 'bg-white text-slate-900 border-white'
                                                : 'bg-transparent text-slate-400 border-slate-700'
                                        }`}
                                    >
                                        {t('ui.all')}
                                    </button>
                                    {availablePlayers.map((player) => (
                                        <button
                                            key={player}
                                            type="button"
                                            onClick={() => setSelectedPlayer(player)}
                                            className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${
                                                selectedPlayer === player
                                                    ? 'bg-blue-500 text-white border-blue-400'
                                                    : 'bg-transparent text-slate-400 border-slate-700'
                                            }`}
                                        >
                                            {player}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 热力图 - 仅展示当前选择球员的个人数据 */}
                        {isSoccer ? (
                            <SoccerHeatmap playerLabel={selectedPlayer && selectedPlayer !== 'all' ? selectedPlayer : null} />
                        ) : (
                            <BasketballHeatmap playerLabel={selectedPlayer && selectedPlayer !== 'all' ? selectedPlayer : null} />
                        )}

                     </>

                 ) : activeTab === 'advanced' ? (

                     // --- Advanced Analysis View（球员汇总与集锦 + AI 解说 & 文案）---

                     <div className="pb-24 space-y-4">

                        {/* 球员汇总与集锦（仅篮球） */}
                        {!isSoccer && (
                            <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden mb-4">
                                <div className="flex justify-between items-center px-4 py-3 bg-white/5 text-[11px] font-bold text-slate-300 border-b border-white/5">
                                    <span>{t('ui.playerSummaryTitle')}</span>
                                    <span className="text-[10px] text-slate-400">{t('ui.playerSummaryDesc')}</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {PLAYER_STATS_BASKETBALL.map((p) => {
                                        const label = `#${p.number} ${p.name}`;
                                        const clipsForPlayer = clipsState.filter(
                                            c => (eventClaims[c.id] ?? c.player) === label
                                        );
                                        const clipCount = clipsForPlayer.length;

                                        const fgMade = p.fgMade ?? 0;
                                        const fgAtt = p.fgAtt ?? 0;
                                        const tpMade = p.tpMade ?? 0;
                                        const tpAtt = p.tpAtt ?? 0;
                                        const ftMade = p.ftMade ?? 0;
                                        const ftAtt = p.ftAtt ?? 0;
                                        const pts = p.pts ?? 0;

                                        const efg =
                                            fgAtt > 0 ? (fgMade + 0.5 * tpMade) / fgAtt : null;
                                        const tsDenom = 2 * (fgAtt + 0.44 * ftAtt);
                                        const ts = tsDenom > 0 ? pts / tsDenom : null;

                                        const isExpanded = expandedSummaryPlayerId === p.id;
                                        
                                        return (
                                            <div key={p.id} className="px-4 py-3 relative" style={{ pointerEvents: 'auto' }}>
                                                {/* 头部概览（始终可见） */}
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${p.color}`}>
                                                            {p.number}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-white truncate">
                                                                    {p.name}
                                                                </span>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40">
                                                                    {p.pts >= 25
                                                                        ? t('ui.scoringKing')
                                                                        : p.reb >= 8
                                                                        ? t('ui.reboundKing')
                                                                        : p.ast >= 7
                                                                        ? t('ui.assistKing')
                                                                        : t('ui.keyRotation')}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 text-[11px] text-slate-300">
                                                                <span className="mr-2">{p.pts} {t('ui.ptsUnit')}</span>
                                                                <span className="mr-2">{p.reb} {t('ui.rebUnit')}</span>
                                                                <span className="mr-2">{p.ast} {t('ui.astUnit')}</span>
                                                                <span className="mr-2">
                                                                    eFG {efg != null ? `${Math.round(efg * 100)}%` : '-'}
                                                                </span>
                                                                <span>
                                                                    TS {ts != null ? `${Math.round(ts * 100)}%` : '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-[10px] relative z-10">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('点击相关视频按钮:', label);
                                                                setSummaryVideoPlayerLabel(label);
                                                            }}
                                                            className="px-2 py-1 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer relative z-10"
                                                            style={{ pointerEvents: 'auto' }}
                                                        >
                                                            <Play className="w-3 h-3" />
                                                            {t('ui.relatedVideosCount', { count: clipCount })}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('点击热区图按钮:', label);
                                                                setSummaryHeatmapPlayerLabel(label);
                                                            }}
                                                            className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10 flex items-center gap-1 transition-colors cursor-pointer relative z-10"
                                                            style={{ pointerEvents: 'auto' }}
                                                        >
                                                            <AreaChart className="w-3 h-3" />
                                                            {t('ui.heatmapButton')}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* 可折叠详细数据区 */}
                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-in slide-in-from-top-2">
                                                        <div className="text-[10px] text-slate-400">
                                                            {t('ui.fgLabel')} {fgAtt > 0 ? `${Math.round((fgMade / fgAtt) * 100)}%（${fgMade}-${fgAtt}）` : '-'} ·{' '}
                                                            {t('ui.threePtLabel')} {tpAtt > 0 ? `${Math.round((tpMade / tpAtt) * 100)}%（${tpMade}-${tpAtt}）` : '-'} ·{' '}
                                                            {t('ui.ftLabel')} {ftAtt > 0 ? `${Math.round((ftMade / ftAtt) * 100)}%（${ftMade}-${ftAtt}）` : '-'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {t('ui.stlLabel')} {p.stl ?? 0} / {t('ui.tovLabel')} {p.tov ?? 0} / {t('ui.blkLabel')} {p.blk ?? 0} / {t('ui.pfLabel')} {p.pf ?? 0}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {t('ui.offRebLabel')} {p.offReb ?? 0} / {t('ui.defRebLabel')} {p.defReb ?? 0}
                                                        </div>
                                                        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                                                            <span className="font-semibold text-slate-300 mr-1">{t('ui.aiComment')}</span>
                                                            {generatePlayerComment(p)}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* 展开/折叠按钮 */}
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedSummaryPlayerId(isExpanded ? null : p.id)}
                                                    className="mt-2 w-full text-center text-[10px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    {isExpanded ? t('ui.collapseDetail') : t('ui.expandDetail')}
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 球员汇总与集锦（足球） */}
                        {isSoccer && (
                            <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden mb-4">
                                <div className="flex justify-between items-center px-4 py-3 bg-white/5 text-[11px] font-bold text-slate-300 border-b border-white/5">
                                    <span>{t('ui.playerSummaryTitle')}</span>
                                    <span className="text-[10px] text-slate-400">{t('ui.playerSummaryDesc')}</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {PLAYER_STATS_SOCCER.map((p) => {
                                        const label = `#${p.number} ${p.name}`;
                                        const clipsForPlayer = clipsState.filter(
                                            c => (eventClaims[c.id] ?? c.player) === label
                                        );
                                        const clipCount = clipsForPlayer.length;

                                        const shots = p.shots ?? 0;
                                        const shotsOnTarget = p.shotsOnTarget ?? 0;
                                        const conversionRate = shots > 0 ? (p.goals ?? 0) / shots : 0;
                                        const shotAccuracy = shots > 0 ? shotsOnTarget / shots : 0;

                                        const isExpanded = expandedSummaryPlayerId === p.id;

                                        return (
                                            <div key={p.id} className="px-4 py-3 relative" style={{ pointerEvents: 'auto' }}>
                                                {/* 头部概览（始终可见） */}
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${p.color}`}>
                                                            {p.number}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-white truncate">
                                                                    {p.name}
                                                                </span>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                                                                    {p.goals >= 2
                                                                        ? t('ui.topScorer')
                                                                        : p.goals >= 1
                                                                        ? t('ui.keyPlayer')
                                                                        : p.keyPasses >= 5
                                                                        ? t('ui.playmaker')
                                                                        : p.tackles + p.interceptions >= 6
                                                                        ? t('ui.workhorse')
                                                                        : t('ui.keyRotation')}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 text-[11px] text-slate-300">
                                                                <span className="mr-2">{p.goals} {t('ui.goalsUnit')}</span>
                                                                {p.assists > 0 && <span className="mr-2">{p.assists} {t('ui.assistsUnit')}</span>}
                                                                <span className="mr-2">xG {p.xG?.toFixed(1) ?? '-'}</span>
                                                                {p.keyPasses > 0 && <span className="mr-2">{t('ui.keyPassesLabel')} {p.keyPasses} {t('ui.keyPassesTimes')}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-[10px] relative z-10">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('点击相关视频按钮:', label);
                                                                setSummaryVideoPlayerLabel(label);
                                                            }}
                                                            className="px-2 py-1 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer relative z-10"
                                                            style={{ pointerEvents: 'auto' }}
                                                        >
                                                            <Play className="w-3 h-3" />
                                                            {t('ui.relatedVideosCount', { count: clipCount })}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                console.log('点击跑动图按钮:', label);
                                                                setSummaryHeatmapPlayerLabel(label);
                                                            }}
                                                            className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10 flex items-center gap-1 transition-colors cursor-pointer relative z-10"
                                                            style={{ pointerEvents: 'auto' }}
                                                        >
                                                            <AreaChart className="w-3 h-3" />
                                                            {t('ui.movementMap')}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 可折叠详细数据区 */}
                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-in slide-in-from-top-2">
                                                        <div className="text-[10px] text-slate-400">
                                                            {t('ui.shotsLabel')} {shots}（{t('ui.onTarget')} {shotsOnTarget}）· {t('ui.conversionRate')} {shots > 0 ? `${Math.round(conversionRate * 100)}%` : '-'} · {t('ui.shotAccuracy')} {shots > 0 ? `${Math.round(shotAccuracy * 100)}%` : '-'}
                                                        </div>
                                                        {p.keyPasses > 0 && (
                                                            <div className="text-[10px] text-slate-400">
                                                                {t('ui.keyPassesLabel')} {p.keyPasses} · {t('ui.finalThirdPasses')} {Math.floor((p.keyPasses ?? 0) * 4)}
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] text-slate-400">
                                                            {t('ui.running')} {p.dist ?? '-'} · {t('ui.sprintsLabel')} {p.sprints ?? 0} {t('ui.keyPassesTimes')}
                                                        </div>
                                                        {(p.tackles > 0 || p.interceptions > 0) && (
                                                            <div className="text-[10px] text-slate-400">
                                                                {t('ui.tacklesLabel')} {p.tackles ?? 0} · {t('ui.interceptionsLabel')} {p.interceptions ?? 0} · {t('ui.recoveriesLabel')} {(p.tackles ?? 0) + (p.interceptions ?? 0)}
                                                            </div>
                                                        )}
                                                        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                                                            <span className="font-semibold text-slate-300 mr-1">{t('ui.aiComment')}</span>
                                                            {generateSoccerPlayerComment(p)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 展开/折叠按钮 */}
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedSummaryPlayerId(isExpanded ? null : p.id)}
                                                    className="mt-2 w-full text-center text-[10px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    {isExpanded ? t('ui.collapseDetail') : t('ui.expandDetail')}
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* AI 解说 & 文案 */}
                        <div className="mt-4 bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-200">{t('ui.aiCommentaryTitle')}</h3>
                                <div className="flex gap-1">
                                    {[
                                        { id: 'pro', labelKey: 'ui.storyPro' },
                                        { id: 'passion', labelKey: 'ui.storyPassion' },
                                        { id: 'fun', labelKey: 'ui.storyFun' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setAiStoryTone(opt.id as 'pro' | 'passion' | 'fun')}
                                            className={`px-2 py-1 rounded-full text-[9px] font-bold border transition-colors ${
                                                aiStoryTone === opt.id
                                                    ? 'bg-blue-500 text-white border-blue-400'
                                                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/30'
                                            }`}
                                        >
                                            {t(opt.labelKey)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 space-y-2 text-[11px] text-slate-200">
                                <div className="font-bold text-slate-100">{t('ui.commentaryOutline')}</div>
                                <p className="leading-relaxed">
                                    {aiStoryTone === 'pro'
                                        ? t('ui.commentaryOutlinePro')
                                        : aiStoryTone === 'passion'
                                        ? t('ui.commentaryOutlinePassion')
                                        : t('ui.commentaryOutlineFun')}
                                </p>
                                <div className="pt-2 border-t border-white/10">
                                    <div className="font-bold text-slate-100 mb-1">{t('ui.socialCopyExample')}</div>
                                    <ul className="space-y-1 text-[10px] text-slate-300 list-disc list-inside">
                                        <li>
                                            {aiStoryTone === 'pro'
                                                ? t('ui.socialCopyPro1')
                                                : aiStoryTone === 'passion'
                                                ? t('ui.socialCopyPassion1')
                                                : t('ui.socialCopyFun1')}
                                        </li>
                                        <li>
                                            {aiStoryTone === 'pro'
                                                ? t('ui.socialCopyPro2')
                                                : aiStoryTone === 'passion'
                                                ? t('ui.socialCopyPassion2')
                                                : t('ui.socialCopyFun2')}
                                        </li>
                                    </ul>
                                    <button
                                        onClick={() => setAiStoryVariant(v => v + 1)}
                                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/15 text-slate-200 hover:bg-white/10 transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" /> {t('ui.anotherVariant')}
                                    </button>
                                </div>
                            </div>
                        </div>

                     </div>

                ) : activeTab === 'aigc' ? (

                    // --- AIGC 实验室 Tab：一键成片 & AI Coach（前端演示） ---

                    <div className="pb-24 space-y-4">

                        {/* 换背景换元素（AIGC） */}
                        <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-200">{t('ui.aigcChangeBgTitle')}</h3>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {t('ui.aigcChangeBgDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* 片段选择 - 单选 */}
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">{t('ui.selectOneHighlightPrompt')}</p>
                                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                        {displayClips.slice(0, 10).map(clip => {
                                            const active = oneClickSelectedClipId === clip.id;
                                            return (
                                                <button
                                                    key={clip.id}
                                                    type="button"
                                                    onClick={() => setOneClickSelectedClipId(clip.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-[11px] ${
                                                        active
                                                            ? 'border-purple-400 bg-purple-500/15 text-slate-50'
                                                            : 'border-white/10 bg-black/30 text-slate-200 hover:border-white/30'
                                                    }`}
                                                >
                                                    <span className="truncate flex-1 min-w-0">{clip.labelKey ? t(clip.labelKey) : (clip as any).label}</span>
                                                    <span className="ml-2 text-[10px] text-slate-400">{clip.duration}</span>
                                                </button>
                                            );
                                        })}
                                        {displayClips.length === 0 && (
                                            <div className="text-[11px] text-slate-500 text-center py-4">
                                                {t('ui.noClipsHint')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 背景选择 */}
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">{t('ui.selectBgType')}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { id: 'court', labelKey: 'ui.courtBg' },
                                            { id: 'effect', labelKey: 'ui.effectBg' },
                                            { id: 'solid', labelKey: 'ui.solidBg' },
                                            { id: 'gradient', labelKey: 'ui.gradientBg' },
                                        ].map(bg => (
                                            <button
                                                key={bg.id}
                                                type="button"
                                                onClick={() => setOneClickBackgroundType(oneClickBackgroundType === bg.id ? null : bg.id)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                                    oneClickBackgroundType === bg.id
                                                        ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                                                        : 'border-white/10 bg-black/30 text-slate-300 hover:border-white/30'
                                                }`}
                                            >
                                                {t(bg.labelKey)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 元素选择 */}
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">{t('ui.selectElementType')}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { id: 'effect', labelKey: 'ui.elementEffect' },
                                            { id: 'text', labelKey: 'ui.elementText' },
                                            { id: 'sticker', labelKey: 'ui.elementSticker' },
                                            { id: 'filter', labelKey: 'ui.elementFilter' },
                                        ].map(elem => (
                                            <button
                                                key={elem.id}
                                                type="button"
                                                onClick={() => setOneClickElementType(oneClickElementType === elem.id ? null : elem.id)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                                    oneClickElementType === elem.id
                                                        ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                                                        : 'border-white/10 bg-black/30 text-slate-300 hover:border-white/30'
                                                }`}
                                            >
                                                {t(elem.labelKey)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 生成按钮 */}
                                <button
                                    type="button"
                                    onClick={handleGenerateOneClickAIGC}
                                    disabled={oneClickGenerating}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                                        oneClickGenerating
                                            ? 'bg-slate-700 text-slate-400 cursor-wait'
                                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition-colors'
                                    }`}
                                >
                                    {oneClickGenerating ? t('ui.generating') : t('ui.generateAigcEffect')}
                                </button>

                                {/* 预览显示 */}
                                {oneClickHasPreview && oneClickSelectedClipId && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-200">
                                                {t('ui.aigcEffectPreview')}
                                            </span>
                                        </div>
                                        <div className="h-24 rounded-xl border border-dashed border-white/15 bg-gradient-to-br from-purple-500/30 via-slate-900 to-black p-2 flex items-stretch gap-2">
                                            {/* 左侧缩略图区域：模拟成片封面 */}
                                            <div className="relative flex-1 rounded-lg bg-black/60 overflow-hidden flex items-center justify-center">
                                                <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_#a855f7_0,_transparent_45%),radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)]" />
                                                <div className="relative z-10 w-full h-full flex flex-col justify-between p-2">
                                                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-100">
                                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500/40">
                                                            {t(statsData.teamA.nameKey)}
                                                        </span>
                                                        <span className="text-[11px] font-black">VS</span>
                                                        <span className="px-1.5 py-0.5 rounded-full bg-red-500/40">
                                                            {t(statsData.teamB.nameKey)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <div className="h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
                                                            <div className="w-3/4 h-full bg-emerald-400/80" />
                                                        </div>
                                                        <div className="h-1 rounded-full bg-slate-700/60 overflow-hidden">
                                                            <div className="w-1/2 h-full bg-purple-400/80" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[9px] text-slate-200 mt-1">
                                                        <span className="truncate max-w-[70%]">
                                                            {t('ui.aiHighlightAutoEdit')}
                                                        </span>
                                                        <span className="px-1 py-0.5 rounded bg-black/60 border border-white/20">
                                                            0:30
                                                        </span>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/40 flex items-center justify-center">
                                                            <Play className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 右侧文字说明：解释成片效果 */}
                                            <div className="w-28 flex flex-col justify-between text-[10px] text-slate-200">
                                                <div>
                                                    <div className="font-bold text-slate-100 mb-0.5">
                                                        {t('ui.resultEffectSample')}
                                                    </div>
                                                    <p className="text-[10px] leading-snug text-slate-300">
                                                        {t('ui.resultEffectDesc')}
                                                    </p>
                                                </div>
                                                <div className="mt-1 text-[9px] text-slate-400">
                                                    {t('ui.exportResultNote')}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShareContext({
                                                    type: 'aigc_one_click_video',
                                                    selectedClipIds: oneClickSelectedClipId ? [oneClickSelectedClipId] : [],
                                                });
                                                setAigcPreviewMode('one_click');
                                                pushView('aigc_preview');
                                            }}
                                            className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-colors"
                                        >
                                            {t('ui.previewResult')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Coach 点评（AIGC） */}
                        <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-200">{t('ui.aiCoachAigc')}</h3>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {t('ui.aiCoachAigcDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">{t('ui.selectClipForCoach')}</p>
                                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                        {displayClips.slice(0, 10).map(clip => {
                                            const active = aiCoachSelectedClipId === clip.id;
                                            return (
                                                <button
                                                    key={clip.id}
                                                    type="button"
                                                    onClick={() => setAiCoachSelectedClipId(clip.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-[11px] ${
                                                        active
                                                            ? 'border-emerald-400 bg-emerald-500/15 text-slate-50'
                                                            : 'border-white/10 bg-black/30 text-slate-200 hover:border-white/30'
                                                    }`}
                                                >
                                                    <span className="truncate flex-1 min-w-0">{clip.labelKey ? t(clip.labelKey) : (clip as any).label}</span>
                                                    <span className="ml-2 text-[10px] text-slate-400">{clip.duration}</span>
                                                </button>
                                            );
                                        })}
                                        {displayClips.length === 0 && (
                                            <div className="text-[11px] text-slate-500 text-center py-4">
                                                {t('ui.noCommentHint')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleGenerateClipCoach}
                                        disabled={aiCoachLoading}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                                            aiCoachLoading
                                                ? 'bg-slate-700 text-slate-400 cursor-wait'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-colors'
                                        }`}
                                    >
                                        {aiCoachLoading ? t('ui.coachGenerating') : t('ui.generateCoachComment')}
                                    </button>
                                </div>

                                {aiCoachComment && (
                                    <div className="mt-2 space-y-2">
                                        <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-[11px] text-slate-100 leading-relaxed whitespace-pre-wrap">
                                            {aiCoachComment}
                                        </div>
                                        {aiCoachHasVideo && aiCoachSelectedClipId && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-slate-200">
                                                        {t('ui.tacticShortVideo')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {t('ui.targetClipId')}{aiCoachSelectedClipId}
                                                    </span>
                                                </div>
                                                <div className="h-20 rounded-lg border border-dashed border-white/15 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-black flex items-center justify-center text-[11px] text-slate-100">
                                                    {t('ui.aigcComposedWithCommentary')}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!aiCoachSelectedClipId) return;
                                                        setShareContext({
                                                            type: 'aigc_coach_clip',
                                                            clipId: aiCoachSelectedClipId,
                                                            aiCoachComment,
                                                        });
                                                        setAigcPreviewMode('coach_clip');
                                                        pushView('aigc_preview');
                                                    }}
                                                    className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-colors"
                                                >
                                                    {t('ui.previewCommentaryVideo')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

               ) : null}

             </div>

         </div>

         

         {/* Bottom Action Bar for Clips Tab */}
         {activeTab === 'clips' && isSelectionMode && (
             <div className="absolute bottom-0 left-0 right-0 bg-[#1E293B] border-t border-white/10 p-4 pb-8 z-30 animate-in slide-in-from-bottom">
                 <div className="flex justify-between items-center mb-3">
                     <span className="text-xs text-slate-400">{t('ui.selectedCount', { count: selectedClipIds.length })}</span>
                     <button onClick={() => setSelectedClipIds(selectedClipIds.length === displayClips.length ? [] : displayClips.map(c => c.id))} className="text-xs text-blue-400 font-bold">{selectedClipIds.length === displayClips.length ? t('ui.deselectAll') : t('ui.selectAll')}</button>
                 </div>
                 <div className="flex gap-3">
                     <button onClick={handleMergeClips} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Layers className="w-4 h-4" /> {t('ui.mergeAndSave')}</button>
                     <button onClick={handleShare} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"><Share2 className="w-4 h-4" /> {t('ui.exportShare')}</button>
                 </div>
             </div>
         )}

         {/* Default Footer for Clips Tab (When not selecting) */}
         {activeTab === 'clips' && !isSelectionMode && (
             <div className="p-4 bg-[#0F172A] border-t border-white/10 space-y-2">
                 {selectedPlayer && selectedPlayer !== 'all' && (
                    <button onClick={() => handleSharePlayerClips(selectedPlayer)} className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" /> {t('ui.shareHighlights')}
                    </button>
                 )}
                 <button onClick={handleExportAll} className="w-full bg-blue-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                     <Share2 className="w-4 h-4" /> {t('ui.exportAllHighlights')}
                 </button>
             </div>
         )}

         {/* Footer for Stats Tab */}
         {activeTab === 'stats' && (
             <div className="p-4 bg-[#0F172A] border-t border-white/10"><button onClick={handleExportReport} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors"><Download className="w-4 h-4" /> {t('ui.exportReport')}</button></div>
         )}

         {/* Portal dropdowns for type / player correction (avoid clip card overflow clipping) */}
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

         {/* 全局抽屉：相关视频和热区图（不受 activeTab 限制） */}
         {/* 相关视频浮层 */}
         {summaryVideoPlayerLabel && (
             <div 
                 className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-in fade-in"
                 onClick={(e) => {
                     if (e.target === e.currentTarget) {
                         setSummaryVideoPlayerLabel(null);
                     }
                 }}
             >
                 <div 
className="w-full max-w-[375px] mx-auto bg-[#1E293B] rounded-t-2xl border-t border-white/10 flex flex-col animate-in slide-in-from-bottom-4"
                    style={{ maxHeight: '85vh' }}
                     onClick={(e) => e.stopPropagation()}
                 >
                     {/* 顶部拖拽指示器 */}
                     <div className="flex flex-col items-center pt-2 pb-1">
                         <div className="w-12 h-1 bg-slate-500/50 rounded-full" />
                     </div>
                     
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <h3 className="text-sm font-bold text-white">
                            {t('ui.relatedVideosTitle', { player: summaryVideoPlayerLabel })}
                        </h3>
                         <button
                             type="button"
                             onClick={(e) => {
                                 e.stopPropagation();
                                 setSummaryVideoPlayerLabel(null);
                             }}
                             className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                         >
                             <X className="w-5 h-5" />
                         </button>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-4 space-y-2">
                         {(() => {
                             const playerClips = clipsState.filter(c => (eventClaims[c.id] ?? c.player) === summaryVideoPlayerLabel);
                             return playerClips.map((clip, index) => {
                                 const eventLabel = getEventTypeLabel(clip, isSoccer);
                                 return (
                                     <div
                                         key={clip.id}
                                         onClick={() => {
                                             handleClipClick(clip.time);
                                             setSummaryVideoPlayerLabel(null);
                                         }}
                                         className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800 active:scale-[0.98] transition-all border border-white/5"
                                         style={{ animationDelay: `${index * 50}ms` }}
                                     >
                                         {/* 缩略图占位 */}
                                         <div className={`w-16 h-16 rounded-lg ${isSoccer ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-orange-600 to-orange-800'} flex items-center justify-center shrink-0 relative overflow-hidden`}>
                                             <PlayCircle className="w-6 h-6 text-white/90" />
                                             <div className="absolute bottom-1 right-1 text-[8px] font-bold text-white/90 bg-black/40 px-1 rounded">
                                                 {clip.duration}
                                             </div>
                                         </div>
                                         
                                         {/* 内容区域 */}
                                         <div className="flex-1 min-w-0">
                                             {/* 事件类型标签 */}
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${eventLabel.bgColor} ${eventLabel.color} border ${eventLabel.color.replace('text-', 'border-')}/30`}>
                                                     {eventLabel.label}
                                                 </span>
                                                 <span className={`text-[9px] px-1.5 py-0.5 rounded ${clip.team === 'A' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                                                     {clip.team === 'A' ? t(statsData.teamA.nameKey) : t(statsData.teamB.nameKey)}
                                                 </span>
                                             </div>
                                             {/* 标题 */}
                                             <div className="text-xs font-bold text-white truncate mb-0.5">
                                                 {clip.labelKey ? t(clip.labelKey) : (clip as any).label}
                                             </div>
                                             {/* 时间信息 */}
                                             <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                 <span className="font-mono">{clip.time}</span>
                                                 <span>·</span>
                                                 <span>{clip.duration}</span>
                                             </div>
                                         </div>
                                         
                                         {/* 播放按钮 */}
                                         <div className="shrink-0">
                                             <PlayCircle className="w-6 h-6 text-blue-400" />
                                         </div>
                                     </div>
                                 );
                             });
                         })()}
                        {clipsState.filter(c => (eventClaims[c.id] ?? c.player) === summaryVideoPlayerLabel).length === 0 && (
                            <div className="text-center text-slate-400 text-xs py-12">
                                <PlayCircle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                                <div>{t('ui.noRelatedVideos')}</div>
                            </div>
                        )}
                     </div>
                     
                     {clipsState.filter(c => (eventClaims[c.id] ?? c.player) === summaryVideoPlayerLabel).length > 0 && (
                         <div className="p-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPlayer(summaryVideoPlayerLabel);
                                    setSummaryVideoPlayerLabel(null);
                                    setActiveTab('clips');
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" />
                                {t('ui.viewAllInClips')}
                            </button>
                         </div>
                     )}
                 </div>
             </div>
         )}

         {/* 热区图抽屉 */}
         {summaryHeatmapPlayerLabel && (() => {
             // 查找球员数据
             const playerData = isSoccer 
                 ? PLAYER_STATS_SOCCER.find(p => `#${p.number} ${p.name}` === summaryHeatmapPlayerLabel)
                 : PLAYER_STATS_BASKETBALL.find(p => `#${p.number} ${p.name}` === summaryHeatmapPlayerLabel);
             
             return (
                 <div 
                     className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-in fade-in"
                     onClick={(e) => {
                         if (e.target === e.currentTarget) {
                             setSummaryHeatmapPlayerLabel(null);
                         }
                     }}
                 >
                     <div 
                         className="w-full max-w-[375px] mx-auto bg-[#1E293B] rounded-t-2xl border-t border-white/10 flex flex-col animate-in slide-in-from-bottom-4"
                         style={{ maxHeight: '90vh' }}
                         onClick={(e) => e.stopPropagation()}
                     >
                         {/* 顶部拖拽指示器 */}
                         <div className="flex flex-col items-center pt-2 pb-1">
                             <div className="w-12 h-1 bg-slate-500/50 rounded-full" />
                         </div>
                         
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <h3 className="text-sm font-bold text-white">
                                {t('ui.heatmapTitle', { player: summaryHeatmapPlayerLabel })}
                            </h3>
                             <button
                                 type="button"
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     setSummaryHeatmapPlayerLabel(null);
                                 }}
                                 className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                             >
                                 <X className="w-5 h-5" />
                             </button>
                         </div>
                         
                         {/* 球员数据摘要 */}
                         {playerData && (
                             <div className="px-4 py-3 border-b border-white/5 bg-slate-800/30">
                                 <div className="flex items-center gap-3 mb-2">
                                     <div className={`w-8 h-8 rounded-full ${playerData.color} flex items-center justify-center text-white text-xs font-bold`}>
                                         {playerData.number}
                                     </div>
                                     <div className="flex-1">
                                         <div className="text-xs font-bold text-white">{playerData.name}</div>
                                        {isSoccer ? (
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                {t('report.goals')} {(playerData as typeof PLAYER_STATS_SOCCER[0]).goals} · {t('report.assists')} {(playerData as typeof PLAYER_STATS_SOCCER[0]).assists} · {t('ui.shotsLabel')} {(playerData as typeof PLAYER_STATS_SOCCER[0]).shots}/{(playerData as typeof PLAYER_STATS_SOCCER[0]).shotsOnTarget}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                {t('report.totalPoints')} {(playerData as typeof PLAYER_STATS_BASKETBALL[0]).pts} · {t('report.rebounds')} {(playerData as typeof PLAYER_STATS_BASKETBALL[0]).reb} · {t('report.assists')} {(playerData as typeof PLAYER_STATS_BASKETBALL[0]).ast}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isSoccer ? (
                                    <div className="text-[10px] text-slate-400 mt-2">
                                        {t('ui.heatmapDescSoccer')}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-slate-400 mt-2">
                                        {t('ui.heatmapDescBasketball')}
                                    </div>
                                )}
                             </div>
                         )}
                         
                         <div className="flex-1 overflow-y-auto p-4">
                             {isSoccer ? (
                                 <SoccerHeatmap playerLabel={summaryHeatmapPlayerLabel} />
                             ) : (
                                 <BasketballHeatmap playerLabel={summaryHeatmapPlayerLabel} />
                             )}
                         </div>
                     </div>
                 </div>
             );
         })()}

      </div>

    );

  };

  // --- AIGC Preview Screen Component ---

  const AigcPreviewScreen = () => {

    const { t, popView, shareContext, setShowShareModal, setShareType, resultSport, aigcPreviewMode } = useAppContext();

    const clipsForSport = AI_CLIPS_ADVANCED.filter(
      (clip) => clip.sport === (resultSport || 'basketball')
    );

    let title = t('ui.aigcPreview');
    if (aigcPreviewMode === 'one_click') {
      title = t('ui.previewAigcBg');
    } else if (aigcPreviewMode === 'coach_clip') {
      title = t('ui.previewAiCommentary');
    }

    const handleShare = () => {
      setShareType('all');
      setShowShareModal(true);
    };

    const parseDurationSeconds = (duration: string | undefined) => {
      if (!duration) return 0;
      const num = parseInt(duration.replace(/\D/g, ''), 10);
      return Number.isFinite(num) ? num : 0;
    };

    const selectedClips =
      shareContext.type === 'aigc_one_click_video'
        ? clipsForSport.filter((c) =>
            shareContext.selectedClipIds.includes(c.id)
          )
        : [];

    const totalSeconds =
      aigcPreviewMode === 'one_click'
        ? selectedClips.reduce(
            (sum, c) => sum + parseDurationSeconds((c as any).duration),
            0
          )
        : 0;

    const targetClip =
      shareContext.type === 'aigc_coach_clip'
        ? clipsForSport.find((c) => c.id === shareContext.clipId)
        : undefined;

    return (
      <div className="h-full bg-[#020617] flex flex-col">
        {/* Top Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur">
          <button
            onClick={popView}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <div className="w-9" />
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-700/40 via-slate-900 to-black relative">
            <div className="text-center px-8">
              <Film className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-slate-100 text-sm mb-1">
                {aigcPreviewMode === 'one_click'
                  ? t('ui.aigcAppliedBg')
                  : t('ui.aigcCommentaryOverlay')}
              </p>
              {aigcPreviewMode === 'one_click' && selectedClips.length > 0 && (
                <p className="text-slate-300 text-xs mt-3">
                  {t('ui.clipLabel')}{(selectedClips[0] as any).labelKey ? t((selectedClips[0] as any).labelKey) : (selectedClips[0] as any).label} · {(selectedClips[0] as any).time}
                </p>
              )}
              {aigcPreviewMode === 'coach_clip' && targetClip && (
                <p className="text-slate-300 text-xs mt-3">
                  {t('ui.clipTimeLabel')}{(targetClip as any).time} · {t('ui.titleLabel')}
                  {(targetClip as any).labelKey ? t((targetClip as any).labelKey) : (targetClip as any).label}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Info & Actions */}
        <div className="p-4 bg-[#020617] border-t border-white/10 space-y-3">
          {aigcPreviewMode === 'one_click' && selectedClips.length > 0 && (
            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-100">
                  {t('ui.clipInfo')}
                </span>
              </div>
              <div className="space-y-1">
                {selectedClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="flex items-center justify-between text-[11px] text-slate-200"
                  >
                    <span className="text-slate-400 mr-2">
                      {t('ui.clipLabel')}
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      {(clip as any).labelKey ? t((clip as any).labelKey) : (clip as any).label}
                    </span>
                    <span className="ml-2 text-slate-500 text-[10px]">
                      {(clip as any).time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aigcPreviewMode === 'coach_clip' && targetClip && (
            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-3 space-y-2 max-h-36 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-100">
                  {t('ui.tacticSummary')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t('ui.clipTimeLabel')}{(targetClip as any).time}
                </span>
              </div>
              {shareContext.type === 'aigc_coach_clip' &&
              shareContext.aiCoachComment ? (
                <p className="text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {shareContext.aiCoachComment}
                </p>
              ) : (
                <p className="text-[11px] text-slate-300">
                  {t('ui.aigcCommentarySocial')}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <Share2 className="w-4 h-4" /> {t('ui.shareShortVideo')}
          </button>
        </div>
      </div>
    );
  };

  // --- Merge Preview Screen Component ---

  const MergePreviewScreen = () => {

    const { popView, mergedVideoUrl, setShowShareModal, pushView, shareContext } = useAppContext();

    const [isPlaying, setIsPlaying] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);

    const [duration] = useState(120); // Mock duration in seconds

    const handlePlayPause = () => {

      setIsPlaying(!isPlaying);

    };

    const handleShare = () => {

      setShowShareModal(true);

    };

    const handleRemerge = () => {

      popView();

    };

    return (

      <div className="h-full bg-[#0F172A] flex flex-col">

          {/* Top Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">

              <button onClick={popView} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <h2 className="text-lg font-bold text-white">
                {shareContext.type === 'player_clips' && shareContext.playerLabel ? `${shareContext.playerLabel} 集锦` : '合并预览'}
              </h2>

              <div className="w-9"></div>

          </div>

          {/* Video Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">

              {/* Mock Video Player */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 relative">

                  {/* Play Button Overlay */}
                  {!isPlaying && (
                      <button 
                          onClick={handlePlayPause}
                          className="absolute z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                          <Play className="w-8 h-8 text-white" />
                      </button>
                  )}

                  {/* Video Placeholder */}
                  <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                          <Film className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 text-sm">合并后的视频预览</p>
                          <p className="text-slate-500 text-xs mt-2">时长: {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</p>
                      </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                      <div 
                          className="h-full bg-blue-500 transition-all duration-300" 
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                  </div>

              </div>

          </div>

          {/* Bottom Controls */}
          <div className="p-4 bg-[#0F172A] border-t border-white/10">

              <div className="flex gap-3 mb-3">

                  <button 
                      onClick={handlePlayPause}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                      {isPlaying ? (
                          <>
                              <Minimize2 className="w-4 h-4" /> 暂停
                          </>
                      ) : (
                          <>
                              <Play className="w-4 h-4" /> 播放
                          </>
                      )}
                  </button>

              </div>

              <div className="flex gap-3">

                  <button 
                      onClick={handleRemerge}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                      <RotateCcw className="w-4 h-4" /> 重新合并
                  </button>

                  <button 
                      onClick={handleShare}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-colors"
                  >
                      <Share2 className="w-4 h-4" /> 分享
                  </button>

              </div>

          </div>

      </div>

    );

  };

  const HomeScreen = () => {

    const { 

        t, setTutorialStep, setShowTutorial, pushView, transferStep, transferProgress, handleEntryClick, handleExport, setTargetAnalysisType, setAiMode, setIsTaskCompleted, homeTab, setHomeTab, networkState, falconState, setNetworkState, setFalconState, setToastMessage, setResultSport,

        isVip // Added isVip to destructuring

    } = useAppContext();

    

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

      <TutorialOverlay />

      <TransferOverlay />

      <FloatingProgress />

      <div className="pt-12 pb-2 px-5 bg-white flex justify-between items-center sticky top-0 z-10 border-b border-slate-100">

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('nav.toolbox')}</h1>

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

          <button onClick={() => pushView('task_center')} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors relative">

            {transferStep !== 'idle' && transferStep !== 'completed' ? (<div className="absolute inset-0"><svg className="w-full h-full -rotate-90 p-0.5" viewBox="0 0 36 36"><path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" /><path className={`${transferStep === 'failed' ? 'text-red-500' : (transferStep === 'paused' ? 'text-yellow-500' : 'text-blue-500')} transition-all duration-300`} strokeDasharray={`${transferProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" /></svg></div>) : (<Clock className="w-5 h-5" />)}

          </button>

          <button onClick={() => { setTutorialStep(0); setShowTutorial(true); }} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"><HelpCircle className="w-5 h-5" /></button>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">

        <section>

          <div className="flex items-center justify-between mb-3 px-1"><h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('ui.createTools')}</h2></div>

          <div className="grid grid-cols-2 gap-3 mb-3">

              {/* --- Left Card: Basic Highlights --- */}

              <button onClick={() => { handleEntryClick('highlight'); setResultSport('basketball'); }} className="col-span-1 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[24px] p-4 flex flex-col justify-between h-48 shadow-lg shadow-orange-500/20 border border-orange-400/30 active:scale-95 transition-transform relative overflow-hidden group">

                 <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />

                 <div className="relative z-10 flex flex-col h-full">

                    <div className="flex justify-between items-start mb-2">

                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-orange-600 shadow-sm"><Film className="w-5 h-5" /></div>

                        <span className="text-[8px] font-black text-orange-900 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">{t('ui.paid')}</span>

                    </div>

                    <div className="mt-auto text-left">

                        <h3 className="text-lg font-black text-white leading-tight mb-1">{t('ui.aiHighlight')}</h3>

                        <div className="flex flex-wrap gap-1 mt-2">

                            <span className="text-[9px] font-bold text-white bg-white/30 px-1.5 py-0.5 rounded-md">{t('ui.autoEdit')}</span>

                            <span className="text-[9px] font-bold text-white bg-white/30 px-1.5 py-0.5 rounded-md">{t('ui.oneTapShare')}</span>

                        </div>

                    </div>

                 </div>

              </button>

              

              {/* --- Right Card: Advanced Analysis (Refined for "Pro" look) --- */}

              <button onClick={() => { handleEntryClick('analysis'); setResultSport('basketball'); }} className="col-span-1 bg-[#0F172A] rounded-[24px] p-0 flex flex-col justify-between h-48 shadow-xl shadow-indigo-500/20 border border-indigo-500/30 active:scale-95 transition-transform relative overflow-hidden group">

                 {/* Background Pattern */}

                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                 

                 <div className="p-4 relative z-10 flex flex-col h-full justify-between">

                     <div className="flex justify-between items-start">

                         <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50"><Activity className="w-5 h-5 text-indigo-300" /></div>

                         {/* Lock / Unlock State Simulation */}

                         <div className={`px-2 py-1 rounded-full flex items-center gap-1 border ${isVip ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-amber-500/20 border-amber-500/50 text-amber-300'}`}>

                             {isVip ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}

                             <span className="text-[9px] font-bold tracking-wider">{isVip ? 'PRO（包含基础版）' : 'PRO'}</span>

                         </div>

                     </div>

                     

                     <div className="text-left">

                         <h3 className="text-lg font-black text-white leading-tight mb-2">{t('ui.aiAdvancedAnalysis')}</h3>

                        <div className="space-y-1.5">

                            <div className="flex items-center gap-1.5">

                                <Film className="w-3 h-3 text-indigo-400" />

                                <span className="text-[10px] text-indigo-100/80">🎬 {t('ui.smartHighlight')}</span>

                            </div>

                            <div className="flex items-center gap-1.5">

                                <Download className="w-3 h-3 text-indigo-400" />

                                <span className="text-[10px] text-indigo-100/80">📊 {t('ui.playerDashboard')}</span>

                            </div>

                            <div className="flex items-center gap-1.5">

                                <TrendingUp className="w-3 h-3 text-indigo-400" />

                                <span className="text-[10px] text-indigo-100/80">🎧 {t('ui.aiFinishedFilm')}</span>

                            </div>

                        </div>

                     </div>

                 </div>

              </button>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <button className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">{t('ui.startEdit')}</span><span className="text-[10px] text-slate-400">{t('ui.manualEdit')}</span></div><div className="bg-slate-100 p-2 rounded-full text-slate-700 group-hover:bg-slate-200 transition-colors"><Scissors className="w-4 h-4" /></div></button>

            <button className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">{t('ui.markEdit')}</span><span className="text-[10px] text-slate-400">{t('ui.markKeyPoints')}</span></div><div className="bg-purple-50 p-2 rounded-full text-purple-500 group-hover:bg-purple-100 transition-colors"><Filter className="w-4 h-4" /></div></button>

            <button onClick={() => { setHomeTab('templates'); }} className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">{t('ui.templateFilm')}</span><span className="text-[10px] text-slate-400">{t('ui.effectsExport')}</span></div><div className="bg-orange-50 p-2 rounded-full text-orange-500 group-hover:bg-orange-100 transition-colors"><LayoutTemplate className="w-4 h-4" /></div></button>

            <button onClick={handleExport} className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">{t('ui.compositeExport')}</span><span className="text-[10px] text-slate-400">{t('ui.projectShare')}</span></div><div className="bg-blue-50 p-2 rounded-full text-blue-500 group-hover:bg-blue-100 transition-colors"><FileText className="w-4 h-4" /></div></button>

          </div>

        </section>

        {/* Tabbed Section */}

        <section className="min-h-[300px]">

             <div className="sticky top-0 bg-[#F5F5F5] z-20 pb-2 pt-2">

                 <div className="flex items-center gap-4 border-b border-slate-200/60 pb-1">

                     <button onClick={() => setHomeTab('recent')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${homeTab === 'recent' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>{t('ui.recentProjects')}</button>

                     <button onClick={() => setHomeTab('templates')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${homeTab === 'templates' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>{t('ui.myTemplates')}</button>

                     <button onClick={() => setHomeTab('drafts')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${homeTab === 'drafts' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>{t('ui.draftBox')}</button>

                 </div>

             </div>

             <div className="mt-4 space-y-3">

                 {homeTab === 'recent' && (

                     <>

                        {HISTORY_TASKS.filter(task => task.status === 'completed').slice(0, 4).map(task => (

                           <div key={task.id} onClick={() => { setTargetAnalysisType(task.type as any); setAiMode('cloud'); setIsTaskCompleted(true); setResultSport(task.cover); pushView(task.type === 'highlight' ? 'ai_result_highlight' : 'ai_result_analysis'); }} className="bg-white rounded-[20px] p-3 shadow-sm flex gap-3 active:bg-gray-50 relative overflow-hidden border border-slate-100">

                             {task.type === 'analysis' && <div className="absolute top-0 right-0 bg-slate-800 text-amber-300 text-[9px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm"><Crown className="w-2.5 h-2.5 fill-current" /> PRO</div>}

                             <div className="w-24 h-16 bg-slate-100 rounded-lg overflow-hidden relative shrink-0"><AssetThumbnail type="video" category={task.cover} /><div className="absolute inset-0 flex items-center justify-center"><PlayCircle className="w-8 h-8 text-white/80" /></div></div>

                             <div className="flex-1 py-1 min-w-0"><h4 className="font-bold text-sm text-slate-800 truncate">{t((task as any).titleKey)}</h4><div className="flex items-center gap-2 mt-1.5"><p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t((task as any).dateKey)}</p><span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${task.type === 'highlight' ? 'text-orange-600 bg-orange-50' : 'text-purple-600 bg-purple-50'}`}>{task.type === 'highlight' ? t('ui.basicHighlight') : t('ui.advancedAnalysis')}</span></div></div>

                           </div>

                        ))}

                     </>

                 )}

                 {homeTab === 'templates' && (

                     <div className="grid grid-cols-2 gap-3">

                         {TEMPLATE_DATA.map(tmpl => (

                             <div key={tmpl.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">

                                 <div className="aspect-[3/4] bg-slate-200 relative">

                                    <AssetThumbnail type="image" category="basketball" />

                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">{tmpl.type === 'vertical' ? '9:16' : '16:9'}</div>

                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded">{t((tmpl as any).tagKey)}</div>

                                 </div>

                                 <div className="p-3">

                                     <h4 className="text-xs font-bold text-slate-800">{t((tmpl as any).titleKey)}</h4>

                                     <p className="text-[10px] text-slate-400 mt-1">{tmpl.usage} 人使用</p>

                                 </div>

                             </div>

                         ))}

                     </div>

                 )}

                 {homeTab === 'drafts' && (

                     <>

                        {DRAFT_TASKS.map(draft => (

                           <div key={draft.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-slate-100 active:scale-95 transition-transform opacity-90">

                             <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0"><FileEdit className="w-6 h-6" /></div>

                             <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-slate-700 truncate mb-1">{t((draft as any).titleKey)}</h4><div className="flex items-center gap-2 text-xs text-slate-400"><span>{t((draft as any).dateKey)}</span><span className="w-1 h-1 rounded-full bg-slate-300" /><span>{t('ui.progress')}: {draft.progress}</span></div></div>

                             <div className="flex flex-col items-end gap-1"><span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">{t('ui.editing')}</span><Edit3 className="w-4 h-4 text-slate-300" /></div>

                           </div>

                        ))}

                     </>

                 )}

             </div>

        </section>

      </div>

      <div className="h-[83px] bg-white border-t border-slate-100 flex justify-around items-end pb-6 pt-2 absolute bottom-0 w-full z-10 px-1">

         <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><Home className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.home')}</span></div>

         <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><ImageIcon className="w-6 h-6" /><span className="text-[10px] font-bold">{t('nav.gallery')}</span></div>

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

  const { t } = useTranslation();

  const [viewStack, setViewStack] = useState<ViewState[]>(['home']);

  const currentView = viewStack[viewStack.length - 1];

  const [showUpsellModal, setShowUpsellModal] = useState(false);

  const [showExportToast, setShowExportToast] = useState(false); 

  const [aiMode, setAiMode] = useState<AIMode>('cloud'); 

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');

  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);

  const [isTaskCompleted, setIsTaskCompleted] = useState(false); 

  const [sportType, setSportType] = useState<SportType>('basketball');

  // Version subscription state: isVip = true means user has Pro subscription (which includes basic version features)
  // Pro users have access to both basic (highlight) and advanced (analysis) features
  // Basic version features are available to all users (including Pro users)
  const [isVip, setIsVip] = useState(false);

  const [targetAnalysisType, setTargetAnalysisType] = useState<AnalysisType>('highlight');

  

  // New: Result Context

  const [resultSport, setResultSport] = useState<string>('basketball'); // To toggle result view type

  

  const [videoSourceTab, setVideoSourceTab] = useState<VideoSource>('all');

  const [videoSportFilter, setVideoSportFilter] = useState<SportType>('all');

  const [videoSortOrder, setVideoSortOrder] = useState<SortOrder>('newest');

  // --- Exception States ---

  const [transferStep, setTransferStep] = useState<TransferStep>('idle');

  const [transferProgress, setTransferProgress] = useState(0);

  const [isTransferMinimized, setIsTransferMinimized] = useState(false); 

  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'video' | 'image'>('all');

  const [homeTab, setHomeTab] = useState<HomeTabType>('recent');

  const [networkState, setNetworkState] = useState<NetworkState>('wifi');

  const [falconState, setFalconState] = useState<FalconState>('connected');

  const [storageState, setStorageState] = useState<'ok' | 'full'>('ok');

  const [failureReason, setFailureReason] = useState<string | null>(null);

  const [showCellularAlert, setShowCellularAlert] = useState(false);

  const [showStorageAlert, setShowStorageAlert] = useState(false);

  const [showCrashRecovery, setShowCrashRecovery] = useState(false);

  const [showTutorial, setShowTutorial] = useState(true); 

  const [tutorialStep, setTutorialStep] = useState(0);

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

  const [aigcPreviewMode, setAigcPreviewMode] = useState<'one_click' | 'coach_clip'>('one_click');

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

  const popToHome = () => setViewStack(['home']);

  const replaceView = (view: ViewState) => setViewStack(prev => [...prev.slice(0, -1), view]);

  const handleExport = () => { setShowExportToast(true); setTimeout(() => setShowExportToast(false), 2500); };

  const handleEntryClick = (type: AnalysisType) => { 

      // Storage check logic

      if (storageState === 'full') {

          setShowStorageAlert(true);

          return;

      }

      setTargetAnalysisType(type); 

      // Version access logic:
      // - Basic version (highlight): All users can access (including Pro users)
      // - Advanced version (analysis): Only Pro users can access
      // - Pro subscription includes both basic and advanced features

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

  const handleNext = () => {

      // Storage check again

      if (storageState === 'full') {

          setShowStorageAlert(true);

          return;

      }

      if (selectionMode === 'single' && selectedMedia.length > 0) {

        const selectedVideo = ALL_VIDEOS.find(v => v.id === selectedMedia[0]);

        if (selectedVideo) {

          if (selectedVideo.source === 'falcon') {

              setTransferStep('downloading');

              setTransferProgress(0);

              pushView('home'); 

          } else if (selectedVideo.source === 'local') {

              // Create cloud task
              const taskId = addCloudTask(selectedVideo.id, t((selectedVideo as any).labelKey), targetAnalysisType || 'highlight');
              const analyzingCount = getAnalyzingTasksCount();
              const queuedTasks = getQueuedTasks();
              const isQueued = analyzingCount >= maxConcurrentTasks;

              // 4G check

              if (networkState === '4g') {

                  setShowCellularAlert(true);

                  pushView('home');

              } else if (networkState === 'offline') {

                  setTransferStep('paused'); // Start paused if offline

                  pushView('home');

              } else {

                  setTransferStep('uploading');

                  setTransferProgress(0);

                  pushView('home');

                  // Show queue status if queued
                  if (isQueued) {
                    setToastMessage('分析任务繁忙，等待排队分析');
                    setTimeout(() => setToastMessage(null), 8000);
                  }

              }

          } else {

              // Show toast with action button instead of auto-navigation
              const toastMsg = targetAnalysisType === 'highlight' ? t('ui.highlightCompleteToast') : t('ui.analysisCompleteToast');
              setAnalysisCompleteToast({
                show: true,
                message: toastMsg,
                targetAnalysisType: targetAnalysisType,
                resultSport: 'basketball' // Default, can be set based on selected video
              });

          }

        }

      } else {

        pushView('editor_manual');

      }

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

    if (transferStep === 'uploading' && networkState === '4g' && !showCellularAlert) {

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
                       resultSport: 'basketball' // Default, can be set based on selected video
                     });

                     clearInterval(interval);

                     return 100;

                }

                return 100;

            }

            // FIX: Ensure progress increments during analyzing step
            const newProgress = prev + 1;
            
            // Update cloud task progress
            if (currentTaskId && transferStep === 'analyzing') {
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

  }, [transferStep, pushView, networkState, falconState, showCellularAlert, targetAnalysisType, setAnalysisCompleteToast, setIsTaskCompleted, setResultSport, currentTaskId, startTaskAnalysis, updateTaskProgress, completeTask]);

  return (

    <AppContext.Provider value={{

      viewStack, currentView, pushView, popView, popToHome, replaceView,

      showUpsellModal, setShowUpsellModal, showExportToast, handleExport,

      aiMode, setAiMode, selectionMode, setSelectionMode, selectedMedia, setSelectedMedia,

      isTaskCompleted, setIsTaskCompleted, sportType, setSportType,

      isVip, setIsVip, targetAnalysisType, setTargetAnalysisType, handleEntryClick, handleUnlockVip,

      videoSourceTab, setVideoSourceTab, videoSportFilter, setVideoSportFilter, videoSortOrder, setVideoSortOrder,

      transferStep, setTransferStep, transferProgress, setTransferProgress, isTransferMinimized, setIsTransferMinimized,

      showTutorial, setShowTutorial, tutorialStep, setTutorialStep,

      mediaTypeFilter, setMediaTypeFilter, handleSelect, handleNext, 

      homeTab, setHomeTab, 

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

      aigcPreviewMode, setAigcPreviewMode,

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

      t,

    }}>

      <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans text-slate-800">

        <div className="w-full max-w-[375px] h-[812px] bg-black overflow-hidden relative shadow-2xl flex flex-col rounded-[40px] border-[8px] border-slate-900 ring-4 ring-slate-300/50">

          <div className="absolute inset-0 bg-white">

             {currentView === 'home' && <HomeScreen />}

             {currentView === 'media_picker' && <MediaPickerScreen />}

             {currentView === 'task_submitted' && <TaskSubmittedScreen />}

             {currentView === 'ai_result_highlight' && <HighlightResultScreen />}

             {currentView === 'ai_result_analysis' && <AnalysisResultScreen />}

            {currentView === 'merge_preview' && <MergePreviewScreen />}
            {currentView === 'aigc_preview' && <AigcPreviewScreen />}

             {currentView === 'task_center' && <TaskCenterScreen />}

             {currentView === 'editor_manual' && <div className="h-full flex items-center justify-center text-slate-400 bg-[#121212]"><button onClick={popView}>Back</button> Manual Editor</div>}

             {currentView === 'templates_list' && <div className="h-full flex items-center justify-center text-slate-400 bg-gray-50"><button onClick={popView}>Back</button> Templates</div>}

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