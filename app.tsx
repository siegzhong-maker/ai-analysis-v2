import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createPortal } from 'react-dom';

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

  { id: 'full', label: '全场集锦', duration: '03:45', count: 24, theme: 'orange' },

  { id: 'team_a', label: 'A队集锦', duration: '01:50', count: 12, theme: 'blue' },

  { id: 'team_b', label: 'B队集锦', duration: '01:55', count: 12, theme: 'red' },

];

const AI_CLIPS_ADVANCED = [

  // Basketball Clips

  { id: 1, label: "3分命中", time: "02:14", duration: "5s", type: "score", scoreType: 3, team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },

  { id: 2, label: "2分命中", time: "05:32", duration: "8s", type: "score", scoreType: 2, team: 'A', sport: 'basketball', confidence: 'low', player: null },

  { id: 3, label: "1分罚球", time: "11:20", duration: "4s", type: "score", scoreType: 1, team: 'B', sport: 'basketball', confidence: 'high', player: '#11 KL' },

  { id: 4, label: "3分命中", time: "14:05", duration: "6s", type: "score", scoreType: 3, team: 'B', sport: 'basketball', confidence: 'low', player: null },

  { id: 6, label: "2分命中", time: "22:15", duration: "7s", type: "score", scoreType: 2, team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },

  { id: 7, label: "1分罚球", time: "24:30", duration: "5s", type: "score", scoreType: 1, team: 'A', sport: 'basketball', confidence: 'low', player: null },

  { id: 8, label: "3分命中", time: "28:10", duration: "6s", type: "score", scoreType: 3, team: 'A', sport: 'basketball', confidence: 'high', player: '#0 Tatum' },
  
  // Basketball Events
  { id: 9, label: "篮板球", time: "06:45", duration: "3s", type: "basketball_event", scoreType: 'rebound', team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },
  { id: 10, label: "抢断", time: "09:20", duration: "4s", type: "basketball_event", scoreType: 'steal', team: 'A', sport: 'basketball', confidence: 'high', player: '#0 Tatum' },
  { id: 11, label: "助攻", time: "15:30", duration: "5s", type: "basketball_event", scoreType: 'assist', team: 'A', sport: 'basketball', confidence: 'high', player: '#23 LJ' },
  { id: 12, label: "篮板球", time: "18:15", duration: "3s", type: "basketball_event", scoreType: 'rebound', team: 'B', sport: 'basketball', confidence: 'low', player: null },
  { id: 13, label: "抢断", time: "26:40", duration: "4s", type: "basketball_event", scoreType: 'steal', team: 'B', sport: 'basketball', confidence: 'high', player: '#11 KL' },
  { id: 14, label: "助攻", time: "32:50", duration: "5s", type: "basketball_event", scoreType: 'assist', team: 'B', sport: 'basketball', confidence: 'low', player: null },

  // Soccer Clips

  { id: 20, label: "精彩进球", time: "12:30", duration: "10s", type: "soccer_event", scoreType: 'goal', team: 'A', sport: 'soccer', confidence: 'high', player: '#7 Son' },

  { id: 21, label: "角球进攻", time: "25:15", duration: "15s", type: "soccer_event", scoreType: 'corner', team: 'A', sport: 'soccer', confidence: 'low', player: null },

  { id: 22, label: "任意球破门", time: "38:00", duration: "12s", type: "soccer_event", scoreType: 'setpiece', team: 'B', sport: 'soccer', confidence: 'high', player: '#10 Messi' },

  { id: 23, label: "点球命中", time: "55:20", duration: "20s", type: "soccer_event", scoreType: 'penalty', team: 'A', sport: 'soccer', confidence: 'low', player: null },

  { id: 25, label: "进球", time: "88:45", duration: "15s", type: "soccer_event", scoreType: 'goal', team: 'B', sport: 'soccer', confidence: 'high', player: '#9 Lewy' },

];

const HISTORY_TASKS = [

  { id: 's1', title: '周日联赛：进球集锦', date: '4小时前', type: 'highlight', status: 'completed', cover: 'soccer' },

  { id: 's2', title: '半决赛：战术分析', date: '昨天', type: 'analysis', status: 'completed', cover: 'soccer' },

  { id: 'b1', title: '决赛：数据统计报告', date: '2小时前', type: 'analysis', status: 'completed', cover: 'basketball' },

  { id: 'b2', title: '周末友谊赛集锦', date: '昨天', type: 'highlight', status: 'completed', cover: 'basketball' },

  // Additional tasks for task center (failed and paused)
  { id: 'f1', title: '周三训练赛集锦', date: '3天前', type: 'highlight', status: 'failed', cover: 'soccer', failureReason: '网络连接超时' },

  { id: 'f2', title: '季前赛数据分析', date: '5天前', type: 'analysis', status: 'failed', cover: 'basketball', failureReason: '文件格式不支持' },

  { id: 'p1', title: '友谊赛精彩瞬间', date: '1周前', type: 'highlight', status: 'paused', cover: 'basketball' },

];

const DRAFT_TASKS = [

  { id: 'd1', title: '未命名项目 20240520', date: '10分钟前', progress: '30%', cover: 'basketball' },

  { id: 'd2', title: '周五夜赛剪辑 (未完成)', date: '昨天 23:00', progress: '80%', cover: 'soccer' },

  { id: 'd3', title: '投篮训练 Day 1', date: '3天前', progress: '15%', cover: 'basketball' },

];

const TEMPLATE_DATA = [

    { id: 't1', title: 'NBA 风格战报', type: 'vertical', usage: '1.2k', tag: '热门' },

    { id: 't2', title: '高燃卡点混剪', type: 'horizontal', usage: '856', tag: '推荐' },

    { id: 't3', title: '慢动作技术分析', type: 'vertical', usage: '430', tag: '教学' },

];

const ALL_VIDEOS = [

  { id: 101, type: 'video', source: 'falcon', date: '今天 14:30', duration: '45:00', label: '周五下午球局', device: 'Falcon X1', battery: 85, synced: true, category: 'basketball' },

  { id: 102, type: 'video', source: 'falcon', date: '昨天 09:00', duration: '62:15', label: '晨练投篮记录', device: 'Falcon X1', battery: 42, synced: true, category: 'basketball' },

  { id: 201, type: 'video', source: 'cloud', date: '周一 18:00', duration: '58:00', label: '全场回放 (已分析)', category: 'basketball' }, 

  { id: 202, type: 'video', source: 'cloud', date: '周一 16:30', duration: '45:00', label: '上半场录像', category: 'soccer' },

  { id: 301, type: 'video', source: 'local', date: '昨天 12:00', duration: '03:20', label: '手机实拍片段', category: 'basketball' },

  { id: 302, type: 'video', source: 'local', date: '前天 10:15', duration: '00:15', label: '三分投篮练习', category: 'basketball' },

  { id: 103, type: 'video', source: 'falcon', date: '周日 15:20', duration: '15:20', label: '半场对抗', device: 'Falcon Mini', battery: 100, synced: false, category: 'soccer' },

  { id: 303, type: 'video', source: 'local', date: '上周五', duration: '20:00', label: '棒球击球练习', category: 'baseball' },

] as const;

const TEAM_MATCH_STATS = {

  sport: 'basketball',

  teamA: { name: '猛龙队', score: 86, color: 'text-blue-400' },

  teamB: { name: '野狼队', score: 82, color: 'text-red-400' },

  comparison: [

    { label: '总得分', a: 86, b: 82, highlight: true },

    { label: '罚球得分', a: 15, b: 12 },

    { label: '三分得分', a: 21, b: 18 },

    { label: '罚球命中', a: 15, b: 12 },

    { label: '三分命中', a: 7, b: 6 },

    { label: '总出手', a: 68, b: 72 },

    { label: '罚球出手', a: 18, b: 16 },

    { label: '三分出手', a: 22, b: 25 },

    { label: '投篮命中率', a: '45.6%', b: '41.7%', highlight: true },

    { label: '两分命中率', a: '52.1%', b: '48.9%' },

    { label: '三分命中率', a: '31.8%', b: '24.0%' },

    { label: '篮板', a: 42, b: 38 },

    { label: '抢断', a: 8, b: 6 },

  ]

};

const SOCCER_MATCH_STATS = {

  sport: 'soccer',

  teamA: { name: '雷霆FC', score: 2, color: 'text-blue-500' },

  teamB: { name: '火焰联队', score: 1, color: 'text-red-500' },

  comparison: [

    { label: '进球', a: 2, b: 1, highlight: true },

    { label: 'xG (期望进球)', a: 1.85, b: 0.92, highlight: true },

    { label: '控球率', a: '55%', b: '45%' },

    { label: '射门 (射正)', a: '12 (5)', b: '8 (3)' },

    { label: '进攻三区传球', a: 145, b: 98 },

    { label: '关键传球', a: 8, b: 3 },

    { label: '角球', a: 6, b: 4 },

    { label: '对抗成功率', a: '52%', b: '48%' },

  ]

};

const PLAYER_STATS_BASKETBALL = [

    { id: 1, name: 'LJ', number: 23, pts: 28, reb: 8, ast: 7, eff: '+25', color: 'bg-blue-500', team: 'A', unclaimedCount: 0, events: [] },

    { id: 2, name: 'KL', number: 11, pts: 22, reb: 5, ast: 3, eff: '+18', color: 'bg-red-500', team: 'B', unclaimedCount: 0, events: [] },

    { id: 3, name: 'Tatum', number: 0, pts: 18, reb: 9, ast: 4, eff: '+15', color: 'bg-blue-500', team: 'A', unclaimedCount: 0, events: [] },

];

const PLAYER_STATS_SOCCER = [

    { id: 1, name: 'Son', number: 7, goals: 1, dist: '11.2km', sprints: 24, rating: 8.5, color: 'bg-blue-500', team: 'A', unclaimedCount: 0, events: [] },

    { id: 2, name: 'Kane', number: 10, goals: 1, dist: '10.5km', sprints: 18, rating: 8.2, color: 'bg-blue-500', team: 'A', unclaimedCount: 0, events: [] },

    { id: 3, name: 'Salah', number: 11, goals: 1, dist: '10.8km', sprints: 32, rating: 8.4, color: 'bg-red-500', team: 'B', unclaimedCount: 0, events: [] },

];

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

  const { showTutorial, setShowTutorial, tutorialStep, setTutorialStep } = useAppContext();

  if (!showTutorial) return null;

  const steps = [

    { 

        title: "双模式创作", 

        desc: "左侧生成精彩集锦，右侧提供专业分析（需 Pro）", 

        style: { top: '65px', left: '12px', height: '280px', width: 'calc(100% - 24px)' }, 

        position: 'bottom', 

        arrow: 'top' 

    },

    { 

        title: "项目管理", 

        desc: "查看最近项目、使用模板或继续编辑", 

        style: { top: '460px', left: '12px', height: '250px', width: 'calc(100% - 24px)' }, 

        position: 'top', 

        arrow: 'bottom' 

    },

    { 

        title: "任务中心", 

        desc: "查看任务进度和历史记录", 

        style: { top: '10px', right: '50px', height: '44px', width: '44px', borderRadius: '50%' }, 

        position: 'bottom', 

        arrow: 'top' 

    }

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

          <div className="flex justify-between items-start mb-2"><h3 className="text-lg font-black text-slate-900">{current.title}</h3><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tutorialStep + 1} / {steps.length}</span></div>

          <p className="text-sm text-slate-600 mb-5 leading-relaxed text-left">{current.desc}</p>

          <div className="flex gap-3 justify-end"><button onClick={() => setShowTutorial(false)} className="text-slate-400 text-xs font-bold px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors">跳过</button><button onClick={() => { if (tutorialStep < steps.length - 1) setTutorialStep((s: number) => s + 1); else setShowTutorial(false); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-lg shadow-slate-900/20 active:scale-95 transition-transform flex items-center gap-1">{tutorialStep < steps.length - 1 ? (<>下一步 <ChevronRight className="w-3 h-3" /></>) : (<>开始体验 <Check className="w-3 h-3" /></>)}</button></div>

        </div>

      </div>

    </div>

  );

};

const TransferOverlay = () => {

  const { 

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

       statusText = failureReason || '任务失败';

       subText = '请检查环境后重试';

   } else if (isPaused) {

       if (networkState === 'offline') {

           statusText = '网络连接中断';

           subText = '正在等待网络恢复...';

       } else if (networkState === '4g') {

           statusText = '已暂停上传 (移动网络)';

           subText = '等待 Wi-Fi 或用户手动确认';

       } else if (falconState === 'disconnected') {

           statusText = 'Falcon 设备连接断开';

           subText = '请靠近设备并确保开机';

       } else {

           statusText = '任务已暂停';

       }

   } else if (transferStep === 'downloading') {

       statusText = '正在从设备下载素材...';

   } else if (transferStep === 'uploading') {

       statusText = '正在上传至云端服务器...';

   } else if (transferStep === 'analyzing') {

       statusText = 'AI 分析中...';

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

                {isFailed ? '任务执行失败' : (isPaused ? '任务已暂停' : (isAnalyzing ? '云端 AI 分析中' : '视频上传处理中'))}

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

                    <button onClick={() => { setTransferStep('idle'); setTransferProgress(0); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-300">取消任务</button>

                    <button onClick={handleRetry} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-blue-500/20">

                        {isFailed ? '重试' : '继续'}

                    </button>

                </div>

            )}

            

            {!isFailed && !isPaused && <p className="text-[10px] text-slate-500 mt-2">您可以最小化此窗口，任务将在后台继续</p>}

         </div>

      </div>

   );

};

const FloatingProgress = () => {

  const { transferStep, transferProgress, isTransferMinimized, setIsTransferMinimized, networkState, falconState } = useAppContext();

  if (!isTransferMinimized || transferStep === 'idle' || transferStep === 'completed') return null;

  

  const isAnalyzing = transferStep === 'analyzing';

  const isFailed = transferStep === 'failed';

  const isPaused = transferStep === 'paused';

  

  let icon = <Sparkles className="w-4 h-4 text-orange-400" />;

  let text = `${transferProgress}%`;

  

  if (isFailed) {

      icon = <AlertTriangle className="w-4 h-4 text-red-500" />;

      text = "失败";

  } else if (isPaused) {

      icon = <AlertTriangle className="w-4 h-4 text-yellow-500" />;

      text = "暂停";

  } else if (transferStep === 'downloading') {

      icon = <DownloadCloud className="w-4 h-4 text-blue-400" />;

  } else if (transferStep === 'uploading') {

      icon = <UploadCloud className="w-4 h-4 text-purple-400" />;

  } else if (isAnalyzing) {

      text = "分析中";

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

    const { showCellularAlert, setShowCellularAlert, setTransferStep, setNetworkState } = useAppContext();

    if (!showCellularAlert) return null;

    return (

        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">

            <div className="bg-white w-full max-w-xs rounded-2xl p-5 text-center shadow-xl">

                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600"><Signal className="w-6 h-6" /></div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">正在使用移动网络</h3>

                <p className="text-sm text-slate-500 mb-6">当前 Wi-Fi 已断开，继续上传将消耗约 1.2GB 流量。是否继续？</p>

                <div className="flex gap-3">

                    <button onClick={() => { setShowCellularAlert(false); setTransferStep('paused'); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">暂停上传</button>

                    <button onClick={() => { setShowCellularAlert(false); setTransferStep('uploading'); }} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">继续上传</button>

                </div>

            </div>

        </div>

    );

};

const CrashRecoveryModal = () => {

    const { showCrashRecovery, setShowCrashRecovery, setTransferStep, setTransferProgress } = useAppContext();

    if (!showCrashRecovery) return null;

    return (

        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">

            <div className="bg-white w-full max-w-xs rounded-2xl p-5 text-center shadow-xl">

                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><RefreshCw className="w-6 h-6" /></div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">恢复未完成的任务</h3>

                <p className="text-sm text-slate-500 mb-6">检测到上次应用异常退出，有一个“周五下午球局”的分析任务未完成（进度 45%）。</p>

                <div className="flex gap-3">

                    <button onClick={() => { setShowCrashRecovery(false); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">放弃</button>

                    <button onClick={() => { setShowCrashRecovery(false); setTransferStep('uploading'); setTransferProgress(45); }} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">恢复任务</button>

                </div>

            </div>

        </div>

    );

};

const StorageFullModal = () => {

    const { showStorageAlert, setShowStorageAlert } = useAppContext();

    if (!showStorageAlert) return null;

    return (

        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">

            <div className="bg-white w-full max-w-xs rounded-2xl p-5 text-center shadow-xl">

                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><HardDrive className="w-6 h-6" /></div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">存储空间不足</h3>

                <p className="text-sm text-slate-500 mb-6">剩余空间不足 500MB，无法开始新任务。请清理手机存储空间后重试。</p>

                <button onClick={() => { setShowStorageAlert(false); }} className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm">我知道了</button>

            </div>

        </div>

    );

};

const UpsellModal = () => {

  const { setShowUpsellModal, handleUnlockVip, targetAnalysisType } = useAppContext();

  return (

    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">

        <div className="bg-[#1E293B] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative p-6 text-center">

            <button onClick={() => setShowUpsellModal(false)} className="absolute top-4 right-4 text-white/50"><X className="w-5 h-5"/></button>

            <Crown className="w-16 h-16 text-white mx-auto mb-4" />

            <h3 className="text-xl font-black text-white mb-2">升级 Falcon AI Pro</h3>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">

               升级到 Pro 后，您将解锁高级视频编辑、数据导出、历史对比、无限存储等专业功能，并自动拥有基础版的所有功能。

             </p>

            <button onClick={handleUnlockVip} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-6">立即订阅</button>

        </div>

    </div>

  );

};

// --- Progress Modal Component ---

const ProgressModal = () => {

  const { progressModal, setProgressModal } = useAppContext();

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
                <span className="text-xs text-slate-400">进度</span>
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
                取消
            </button>

        </div>

    </div>

  );

};

// --- Share Modal Component ---

const ShareModal = () => {

  const { showShareModal, setShowShareModal, setProgressModal, setToastMessage, currentView, shareContext } = useAppContext();
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const isPro = currentView === 'ai_result_analysis';

  const handleShare = (type: 'album' | 'facebook' | 'youtube', watermark: boolean = true) => {
    setShowShareModal(false);
    
    let title = '';
    let toastMessage = '';
    
    if (type === 'album') {
      title = watermark ? '正在保存到相册（带水印）' : '正在保存到相册（无水印）';
      toastMessage = watermark ? '已保存到相册（带水印）' : '已保存到相册（无水印）';
    } else if (type === 'facebook') {
      title = watermark ? '正在分享到Facebook（带水印）' : '正在分享到Facebook（无水印）';
      toastMessage = watermark ? '已分享到Facebook（带水印）' : '已分享到Facebook（无水印）';
    } else if (type === 'youtube') {
      title = watermark ? '正在分享到YouTube（带水印）' : '正在分享到YouTube（无水印）';
      toastMessage = watermark ? '已分享到YouTube（带水印）' : '已分享到YouTube（无水印）';
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

            <h3 className="text-xl font-black text-white mb-6 text-center">选择分享方式</h3>

            {/* Pro Watermark Toggle */}
            {isPro && shareContext.type !== 'player_dashboard' && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-white">Pro 专属</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!watermarkEnabled}
                                onChange={(e) => setWatermarkEnabled(!e.target.checked)}
                                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <span className="text-xs text-slate-300">无水印导出</span>
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
                    <span>保存到相册</span>
                </button>

                <button 
                    onClick={() => handleShare('facebook', watermarkEnabled)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    <span>分享到 Facebook</span>
                </button>

                <button 
                    onClick={() => handleShare('youtube', watermarkEnabled)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    <span>分享到 YouTube</span>
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

                        一键异常演练

                    </h3>

                    <p className="text-[10px] text-slate-400 mb-2">选择剧本，App 将自动执行流程</p>

                    

                    <button onClick={() => { runScenario('device_disconnect'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><AlertTriangle className="w-4 h-4" /></div>

                        <div><div className="text-xs font-bold text-slate-800">设备断连</div><div className="text-[9px] text-slate-400">下载中途 Falcon 断电</div></div>

                    </button>

                    <button onClick={() => { runScenario('concurrent_task'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><Layers className="w-4 h-4" /></div>

                        <div><div className="text-xs font-bold text-slate-800">多任务并发</div><div className="text-[9px] text-slate-400">当前仅支持一个任务在分析</div></div>

                    </button>

                    <button onClick={() => { runScenario('network_4g'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><Signal className="w-4 h-4" /></div>

                        <div><div className="text-xs font-bold text-slate-800">4G 流量警告</div><div className="text-[9px] text-slate-400">上传中途切换网络</div></div>

                    </button>

                    <button onClick={() => { runScenario('network_offline'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><WifiOff className="w-4 h-4" /></div>

                        <div><div className="text-xs font-bold text-slate-800">网络完全断开</div><div className="text-[9px] text-slate-400">模拟无网环境暂停</div></div>

                    </button>

                    <button onClick={() => { runScenario('crash_recovery'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><RefreshCw className="w-4 h-4" /></div>

                        <div><div className="text-xs font-bold text-slate-800">崩溃恢复</div><div className="text-[9px] text-slate-400">模拟 App 意外重启</div></div>

                    </button>

                    <button onClick={() => { runScenario('storage_full'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><HardDrive className="w-4 h-4" /></div>

                        <div><div className="text-xs font-bold text-slate-800">存储不足</div><div className="text-[9px] text-slate-400">开始任务前检测空间</div></div>

                    </button>

                    <button onClick={() => { runScenario('cloud_queue_full'); setIsOpen(false); }} className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 group text-left transition-colors">

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-600"><Layers className="w-4 h-4" /></div>

                        <div><div className="text-xs font-bold text-slate-800">云端队列已满</div><div className="text-[9px] text-slate-400">模拟云端已有5个任务在分析</div></div>

                    </button>

                </div>

            )}

        </div>

    );

};

// --- Player Selector Modal Component ---
const PlayerSelectorModal = () => {
  const {
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
  const teamName = team === 'A' ? statsData.teamA.name : statsData.teamB.name;

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
    setToastMessage(isAlreadyClaimed ? '已更新' : '已标记');
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
    setToastMessage('已清除');
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
          <h3 className="text-lg font-black text-white mb-2">标记球员</h3>
          {isAlreadyClaimed && currentLabel && (
            <p className="text-xs text-amber-400 mt-2">当前：{currentLabel}</p>
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
              placeholder="如 7号、小明、左路"
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddNew}
              disabled={!newLabel.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold transition-colors"
            >
              确定
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-2">
          {isAlreadyClaimed && (
            <button
              onClick={handleUnclaim}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 py-2.5 rounded-xl font-bold text-sm transition-colors"
            >
              清除
            </button>
          )}
          <button
            onClick={handleCancel}
            className={isAlreadyClaimed ? 'flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors' : 'w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors'}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Updated Screens ---

const TaskCenterScreen = () => {

  const { transferStep, transferProgress, popView, setTargetAnalysisType, setAiMode, setIsTaskCompleted, pushView, failureReason, setResultSport, setTransferStep, setTransferProgress, cloudTasks, getAnalyzingTasksCount, getQueuedTasks, maxConcurrentTasks } = useAppContext();

  // Get paused tasks from history
  const pausedTasks = HISTORY_TASKS.filter(task => task.status === 'paused');
  
  // Get cloud tasks
  const analyzingTasks = cloudTasks.filter(task => task.status === 'analyzing');
  const queuedTasks = getQueuedTasks();
  const analyzingCount = getAnalyzingTasksCount();

  // Task title editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>(() => {
    const titles: Record<string, string> = {};
    HISTORY_TASKS.forEach(task => {
      titles[task.id] = task.title;
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

         <div className="flex items-center gap-3"><button onClick={popView}><ArrowLeft className="w-6 h-6 text-slate-800" /></button><h1 className="text-xl font-black text-slate-900 tracking-tight">任务中心</h1></div>

         {/* Settings Removed per request */}

         <div className="w-5" />

      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

         {/* Active Progress Card - Current Task and Paused Tasks */}

         {(transferStep !== 'idle' && transferStep !== 'completed') || pausedTasks.length > 0 ? (

           <section className="mb-4">

              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">正在进行</h3>

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

                               {transferStep === 'failed' ? '任务失败' : (transferStep === 'paused' ? '任务已暂停' : (transferStep === 'downloading' ? '正在从 Falcon 下载' : '正在上传至云端'))}

                           </h4>

                           <p className={`text-xs ${transferStep === 'failed' ? 'text-red-500' : 'text-slate-400'}`}>

                               {transferStep === 'failed' ? (failureReason || '未知错误') : '周五下午球局 · 剩余 2 分钟'}

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

                             <button className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1"><MessageSquare className="w-3 h-3"/> 反馈问题</button>

                             <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold">重试</button>

                         </>

                     ) : (

                         <>

                             <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">{transferStep === 'paused' ? '继续' : '暂停'}</button>

                             <button className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-bold">取消</button>

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
                                                  defaultValue={taskTitles[task.id] || task.title}
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
                                                  保存
                                              </button>
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleCancelEdit();
                                                  }}
                                                  className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 transition-colors shrink-0"
                                              >
                                                  取消
                                              </button>
                                          </div>
                                          <p className="text-xs text-slate-400">
                                              {task.date} · {task.type === 'highlight' ? '基础集锦' : '高阶分析'}
                                          </p>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="flex items-center gap-2 mb-1">
                                              <h4 className="text-sm font-bold text-slate-800 truncate flex-1">
                                                  {taskTitles[task.id] || task.title}
                                              </h4>
                                              <button
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleStartEdit(task.id, e);
                                                  }}
                                                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                                  title="编辑名称"
                                              >
                                                  <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                          </div>
                                          <p className="text-xs text-slate-400">
                                              {task.date} · {task.type === 'highlight' ? '基础集锦' : '高阶分析'}
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
                                  重新发起
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
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">云端分析队列</h3>
               <div className="flex items-center gap-3 text-xs">
                 <span className="text-blue-600 font-bold">正在分析：{analyzingCount}/{maxConcurrentTasks}</span>
                 {queuedTasks.length > 0 && <span className="text-yellow-600 font-bold">排队中：{queuedTasks.length}</span>}
               </div>
             </div>

             {/* Analyzing Tasks */}
             {analyzingTasks.length > 0 && (
               <div className="space-y-2 mb-3">
                 {analyzingTasks.map(task => (
                   <div key={task.id} className="rounded-xl p-3 bg-white border border-blue-100 shadow-sm">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2 flex-1 min-w-0">
                         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                           {task.type === 'highlight' ? <Film className="w-4 h-4 text-blue-600" /> : <BarChart3 className="w-4 h-4 text-blue-600" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="text-sm font-bold text-slate-800 truncate">{task.videoName}</div>
                           <div className="text-xs text-slate-400">{task.type === 'highlight' ? '精彩集锦' : '高阶分析'}</div>
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
                 {queuedTasks.map(task => (
                   <div key={task.id} className="rounded-xl p-3 bg-white border border-yellow-100 shadow-sm">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 flex-1 min-w-0">
                         <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                           {task.type === 'highlight' ? <Film className="w-4 h-4 text-yellow-600" /> : <BarChart3 className="w-4 h-4 text-yellow-600" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="text-sm font-bold text-slate-800 truncate">{task.videoName}</div>
                           <div className="text-xs text-slate-400">{task.type === 'highlight' ? '精彩集锦' : '高阶分析'}</div>
                         </div>
                       </div>
                       <div className="text-xs font-bold text-yellow-600">
                         队列第{task.queuePosition}位
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

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">分析记录</h3>

            <div className="space-y-3">

                {HISTORY_TASKS.filter(task => task.status !== 'paused').map(task => {

                    const statusConfig = {
                        completed: { label: '完成', bg: 'bg-green-100', text: 'text-green-700' },
                        failed: { label: '失败', bg: 'bg-red-100', text: 'text-red-700' },
                        paused: { label: '已暂停', bg: 'bg-yellow-100', text: 'text-yellow-700' }
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
                                                defaultValue={taskTitles[task.id] || task.title}
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
                                                保存
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelEdit();
                                                }}
                                                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 transition-colors shrink-0"
                                            >
                                                取消
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{task.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{task.type === 'highlight' ? '基础集锦' : '高阶分析'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`text-sm font-bold truncate flex-1 ${task.status === 'failed' ? 'text-red-800' : task.status === 'paused' ? 'text-yellow-800' : 'text-slate-800'}`}>
                                                {taskTitles[task.id] || task.title}
                                            </h4>
                                            <button
                                                onClick={(e) => handleStartEdit(task.id, e)}
                                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                                title="编辑名称"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{task.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{task.type === 'highlight' ? '基础集锦' : '高阶分析'}</span>
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

                {HISTORY_TASKS.length === 0 && <div className="text-center text-slate-400 py-8 text-xs">暂无历史记录</div>}

            </div>

         </section>

      </div>

    </div>

  );

};

const MediaPickerScreen = () => {

  const { popView, targetAnalysisType, setSportType, setMediaTypeFilter, handleSelect, handleNext, selectionMode, selectedMedia, sportType, mediaTypeFilter, pushView } = useAppContext();

  

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

        <div className="h-12 flex items-center justify-between px-2 bg-[#1E1E1E] shrink-0"><button onClick={popView} className="p-3"><X className="w-6 h-6" /></button><span className="text-sm font-bold">{targetAnalysisType === 'highlight' ? '选择视频制作集锦' : '选择视频进行数据统计'}</span><div className="w-12" /></div>

        

        <div className="bg-[#121212] pt-3 pb-2"><div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x">{SPORTS_CONFIG.map((sport) => { const isSelected = sportType === sport.id; const Icon = sport.icon; let activeClass = ''; if (sport.color === 'orange') activeClass = 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/50'; else if (sport.color === 'emerald') activeClass = 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50'; else if (sport.color === 'blue') activeClass = 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50'; else if (sport.color === 'cyan') activeClass = 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/50'; return (<button key={sport.id} onClick={() => { setSportType(sport.id as SportType); }} className={`flex-none w-28 py-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all snap-start ${isSelected ? activeClass : 'bg-[#1E1E1E] border-white/5 text-slate-500'}`}><Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-600'}`} /><div className="flex flex-col items-center"><span className="text-xs font-bold leading-none mb-1">{sport.label}</span><span className={`text-[9px] font-mono ${isSelected ? 'opacity-80' : 'opacity-40'}`}>{sport.desc}</span></div></button>); })}<div className="w-1" /></div></div>

        

        <div className="px-4 py-2 bg-[#121212] border-b border-white/5"><div className="flex bg-[#1E1E1E] rounded-lg p-0.5">{([['all', '全部'], ['video', '视频'], ['image', '图片']] as const).map(([key, label]) => (<button key={key} onClick={() => setMediaTypeFilter(key as any)} className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${mediaTypeFilter === key ? 'bg-[#333] text-white' : 'text-gray-500'}`}>{label}</button>))}</div></div>

        

        <div className="flex-1 overflow-y-auto p-[1px]"><div className="grid grid-cols-4 gap-[1px] pb-32">{filteredAssets.map((item) => { const isSelected = selectedMedia.includes(item.id); let highlightColor = 'border-white'; if (sportType === 'basketball') highlightColor = 'border-orange-500 bg-orange-500'; return (<div key={item.id} onClick={() => handleSelect(item.id)} className={`aspect-square relative overflow-hidden`}><AssetThumbnail type="video" category={item.category as any} /><div className={`absolute inset-0 transition-colors ${isSelected ? `bg-black/40 border-2 ${highlightColor.split(' ')[0]}` : ''}`} /><div className="absolute top-1 right-1">{isSelected ? (<div className={`w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm ${highlightColor.split(' ')[1]}`}>{selectionMode === 'single' ? <Check className="w-3 h-3 text-white" /> : <span className="text-[10px] font-bold">{selectedMedia.indexOf(item.id) + 1}</span>}</div>) : (<div className="w-5 h-5 rounded-full border border-white/30 bg-black/20" />)}</div><div className="absolute bottom-1 right-1 text-[9px] font-medium text-white drop-shadow-md">{item.duration}</div></div>); })}</div></div>

        

        <div className="absolute bottom-0 w-full bg-[#1E1E1E] border-t border-white/10 pb-8 pt-3 px-4 flex flex-col justify-between min-h-[100px]"><div className="flex items-center justify-between mt-auto"><div className="text-xs text-gray-500">{selectionMode === 'single' ? (targetAnalysisType === 'highlight' ? 'AI 识别高光片段' : 'AI 挖掘战术数据') : `已选 ${selectedMedia.length} 个片段`}</div><button onClick={handleNext} disabled={selectedMedia.length === 0} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedMedia.length > 0 ? (targetAnalysisType === 'highlight' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white') : 'bg-[#333] text-gray-500'}`}>{selectionMode === 'single' ? (targetAnalysisType === 'highlight' ? '生成精彩集锦' : '开始数据统计') : '导入'}</button></div></div>

    </div>

  );

}

const TaskSubmittedScreen = () => {

    const { targetAnalysisType, popToHome, setIsTaskCompleted } = useAppContext();

    return <div className="flex flex-col h-full bg-slate-900 text-white items-center justify-center p-8 animate-in zoom-in-95"><div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-pulse ${targetAnalysisType === 'highlight' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>{targetAnalysisType === 'highlight' ? <Film className="w-12 h-12" /> : <ScanLine className="w-12 h-12" />}</div><h2 className="text-2xl font-bold mb-2">{targetAnalysisType === 'highlight' ? 'AI 智能剪辑中...' : 'AI 数据统计中...'}</h2><p className="text-slate-400 text-sm text-center mb-8">{targetAnalysisType === 'highlight' ? <>正在识别进球/高光瞬间<br/>并进行智能卡点配乐</> : <>正在追踪球员跑动轨迹<br/>并生成投篮热点分布</>}</p><button onClick={() => { setIsTaskCompleted(true); popToHome(); }} className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-full active:scale-95 transition-transform">返回首页</button></div>;

};

// --- Updated Highlight Result Screen (Unified Structure) ---

const HighlightResultScreen = () => {

    const { popToHome, replaceView, resultSport, setProgressModal, pushView, setShowShareModal, setShareType, setMergedVideoUrl, setSelectedEventForClaim, setShowPlayerSelector, eventClaims, setEventClaims, setToastMessage } = useAppContext();

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
            setToastMessage('高光片段最多15秒');
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
        setProgressModal({ show: true, title: '正在合并片段', progress: 0 });

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
    type EventTypeOption = { id: string | number; label: string; type: string; scoreType: number | string; scored?: boolean };
    const eventTypeOptions: EventTypeOption[] = isSoccer
        ? [
            { id: 'goal', label: '进球', type: 'soccer_event', scoreType: 'goal' },
            { id: 'corner', label: '角球', type: 'soccer_event', scoreType: 'corner' },
            { id: 'setpiece', label: '定位球', type: 'soccer_event', scoreType: 'setpiece' },
            { id: 'penalty', label: '点球', type: 'soccer_event', scoreType: 'penalty' },
        ]
        : [
            { id: 3, label: '3分', type: 'score', scoreType: 3, scored: true },
            { id: 2, label: '2分', type: 'score', scoreType: 2, scored: true },
            { id: 1, label: '1分', type: 'score', scoreType: 1, scored: true },
            { id: 'rebound', label: '篮板', type: 'basketball_event', scoreType: 'rebound' },
            { id: 'steal', label: '抢断', type: 'basketball_event', scoreType: 'steal' },
            { id: 'assist', label: '助攻', type: 'basketball_event', scoreType: 'assist' },
        ];

    // Label helper for event type correction (type + scoreType → display label)
    const getLabelForEvent = (sport: string, type: string, scoreType: number | string): string => {
        const isSoc = sport === 'soccer';
        if (isSoc) {
            const m: Record<string, string> = { goal: '进球', corner: '角球进攻', setpiece: '任意球破门', penalty: '点球命中' };
            return m[String(scoreType)] ?? '进球';
        }
        const m: Record<string, string> = { 3: '3分', 2: '2分', 1: '1分', rebound: '篮板', steal: '抢断', assist: '助攻' };
        return m[String(scoreType)] ?? '得分';
    };

    const handleCorrectEventType = (clipId: number, opt: EventTypeOption) => {
        const sport = resultSport || 'basketball';
        const label = opt.label ?? getLabelForEvent(sport, opt.type, opt.scoreType);
        const scored = opt.scored;
        setClips(prev =>
            prev.map(c => {
                if (c.id !== clipId) return c;
                const next = { ...c, type: opt.type, scoreType: opt.scoreType, label } as (typeof prev)[number];
                if (scored !== undefined) (next as any).scored = scored;
                return next;
            })
        );
        const idx = AI_CLIPS_ADVANCED.findIndex(c => c.id === clipId);
        if (idx !== -1) {
            const clip = AI_CLIPS_ADVANCED[idx] as any;
            clip.type = opt.type;
            clip.scoreType = opt.scoreType;
            clip.label = label;
            if (scored !== undefined) clip.scored = scored;
        }
        setOpenTypeMenuId(null);
        setToastMessage('已修正类型');
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleShare = () => {
        setShareType('selected');
        setShowShareModal(true);
    };

    const handleExportAll = () => {
        // Show progress modal for export
        setProgressModal({ show: true, title: '正在导出全部集锦', progress: 0 });

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
        setToastMessage('已标记');
        setTimeout(() => setToastMessage(null), 2000);
    };

    const filters = isSoccer 

      ? [ { id: 'all', label: '全部' }, { id: 'goal', label: '进球' }, { id: 'penalty', label: '点球' } ]

      : [ { id: 'all', label: '全部' }, { id: 'score', label: '得分' }, { id: 1, label: '罚球' }, { id: 3, label: '三分' } ];

    const statsData = isSoccer ? SOCCER_MATCH_STATS : TEAM_MATCH_STATS;

    // --- Logic for Simplified Basic Stats ---

    // Simplified Stats Table Rows

    // Basketball: Show only Total Score

    // Soccer: Show Goals and Penalties

    let basicStatsComparison: Array<{ label: string; a: number | string; b: number | string; highlight?: boolean }> = [];

    if (isSoccer) {

        // Soccer: Only show goals (score)
        basicStatsComparison = statsData.comparison.filter(i => ['进球'].includes(i.label));

    } else {

        // Basketball: Only show total score
        const totalScoreRow = statsData.comparison.find(i => i.label === '总得分');
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

             {showJumpToast && (<div className="absolute top-[60%] left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 z-30"><RotateCcw className="w-3 h-3" /> 跳转至 {currentTime}</div>)}

             

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

                 智能集锦

                 {activeTab === 'clips' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full"></div>}

             </button>

             <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-slate-500'}`}>

                 基础数据

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

                                <span className={`text-xs font-bold ${selectedCollection === col.id ? 'text-white' : 'text-slate-300'}`}>{col.label}</span>

                            </button>

                         ))}

                     </div>

                    {/* Filter Pills */}

                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">

                        {filters.map(f => (

                            <button key={f.id} onClick={() => setSelectedFilter(f.id as EventFilterType)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedFilter === f.id ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}>{f.label}</button>

                        ))}

                    </div>

                    {/* Player Filter */}
                    {availablePlayers.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                            <button 
                                onClick={() => setSelectedPlayer(null)} 
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedPlayer === null || selectedPlayer === 'all' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}
                            >
                                全部球员
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

                             {isSelectionMode ? '取消选择' : '选择片段'}

                         </button>

                     </div>

                     {/* Clip List */}

                     <div className="space-y-3">

                         {displayClips.length === 0 && <div className="text-center text-slate-500 text-xs py-8">该分类下暂无片段</div>}

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

                                                <h4 className="text-sm font-bold text-slate-200">{clip.label}</h4>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {clip.time}</span>
                                                    <span className={`text-[8px] px-1 rounded ${clip.team === 'A' ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}>{clip.team}队</span>
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
                                                         取消
                                                     </button>
                                                     <button 
                                                         onClick={handleSaveDuration}
                                                         className="px-2 py-1 bg-orange-500 hover:bg-orange-600 rounded text-[8px] font-bold text-white transition-colors whitespace-nowrap shrink-0"
                                                     >
                                                         确定
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
                                                             title="编辑时长"
                                                         >
                                                             <Edit3 className="w-2.5 h-2.5" /> <span className="hidden sm:inline">编辑时长</span>
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
                                                                 title="修正事件类型"
                                                             >
                                                                 <Edit3 className="w-2.5 h-2.5" /> <span className="hidden sm:inline">类型</span> <ChevronDown className={`w-2.5 h-2.5 transition-transform ${openTypeMenuId === clip.id ? 'rotate-180' : ''}`} />
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
                                                                 title="标记球员"
                                                             >
                                                                 {(eventClaims[clip.id] ?? clip.player) ? (
                                                                     <><User className="w-2.5 h-2.5" /><span className="max-w-[40px] truncate">{eventClaims[clip.id] ?? clip.player}</span><ChevronDown className={`w-2.5 h-2.5 transition-transform ${openPlayerMenuId === clip.id ? 'rotate-180' : ''}`} /></>
                                                                 ) : (
                                                                     <><User className="w-2.5 h-2.5" /><span className="hidden sm:inline">未标记</span><ChevronDown className={`w-2.5 h-2.5 transition-transform ${openPlayerMenuId === clip.id ? 'rotate-180' : ''}`} /></>
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
                                             <span>个人数据看板</span>
                                         </span>
                                     </div>
                                     <div className="p-4 space-y-3">
                                         {playerStats.map((player) => (
                                             <div key={player.key} className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                                                 <div className="flex items-center justify-between mb-2">
                                                     <div className="flex items-center gap-2">
                                                         <div className={`w-2 h-2 rounded-full ${player.color}`}></div>
                                                         <span className="text-sm font-bold text-white">{player.label}</span>
                                                         <span className="text-[10px] text-slate-400">{player.team}队</span>
                                                     </div>
                                                 </div>
                                                 {isSoccer ? (
                                                     <div className="grid grid-cols-4 gap-2">
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">进球</div>
                                                             <div className="text-lg font-bold text-white">{player.goals || 0}</div>
                                                         </div>
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">角球</div>
                                                             <div className="text-lg font-bold text-white">{player.corners || 0}</div>
                                                         </div>
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">定位球</div>
                                                             <div className="text-lg font-bold text-white">{player.setpieces || 0}</div>
                                                         </div>
                                                         <div className="text-center">
                                                             <div className="text-xs text-slate-400">点球</div>
                                                             <div className="text-lg font-bold text-white">{player.penalties || 0}</div>
                                                         </div>
                                                     </div>
                                                ) : (
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <div className="text-center">
                                                            <div className="text-xs text-slate-400">得分</div>
                                                            <div className="text-lg font-bold text-white">{player.pts || 0}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs text-slate-400">篮板</div>
                                                            <div className="text-lg font-bold text-white">{player.reb || 0}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs text-slate-400">助攻</div>
                                                            <div className="text-lg font-bold text-white">{player.ast || 0}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs text-slate-400">抢断</div>
                                                            <div className="text-lg font-bold text-white">{player.stl || 0}</div>
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
                                 <span>{statsData.teamA.name}</span>
                                 <span className={`text-sm font-bold ${statsData.teamA.color}`}>{statsData.teamA.score}</span>
                             </span>
                             <span>团队对比</span>
                             <span className="flex items-center gap-2">
                                 <span className={`text-sm font-bold ${statsData.teamB.color}`}>{statsData.teamB.score}</span>
                                 <span>{statsData.teamB.name}</span>
                             </span>
                         </summary>
                         <div>
                             {basicStatsComparison.map((item, index) => (
                                 <div key={index} className={`flex justify-between items-center px-4 py-3 border-b border-white/5 last:border-0`}>
                                     <span className={`w-12 text-left font-mono font-bold ${item.a > item.b ? statsData.teamA.color : 'text-slate-400'}`}>{item.a}</span>
                                     <span className="flex-1 text-center text-xs text-slate-300">{item.label}</span>
                                     <span className={`w-12 text-right font-mono font-bold ${item.b > item.a ? statsData.teamB.color : 'text-slate-400'}`}>{item.b}</span>
                                 </div>
                             ))}
                             {/* Add rebound and steal to team comparison for basketball */}
                             {!isSoccer && (
                                 <>
                                     {statsData.comparison.filter(i => ['篮板', '抢断'].includes(i.label)).map((item, index) => (
                                         <div key={`extra-${index}`} className={`flex justify-between items-center px-4 py-3 border-b border-white/5 last:border-0`}>
                                             <span className={`w-12 text-left font-mono font-bold ${item.a > item.b ? statsData.teamA.color : 'text-slate-400'}`}>{item.a}</span>
                                             <span className="flex-1 text-center text-xs text-slate-300">{item.label}</span>
                                             <span className={`w-12 text-right font-mono font-bold ${item.b > item.a ? statsData.teamB.color : 'text-slate-400'}`}>{item.b}</span>
                                         </div>
                                     ))}
                                 </>
                             )}
                         </div>
                     </details>
                    
                    {/* Heatmap in Basic Version */}
                    {isSoccer ? (
                        /* Soccer Run Heatmap (Movement) */
                        <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-4 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Map className="w-4 h-4 text-emerald-500" /> 跑动热力图</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setHeatmapMode('both')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'both' 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        全部
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamA')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamA' 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        A队
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamB')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamB' 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        B队
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
                                    <span>颜色越深表示跑动频率越高</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Basketball Shot Heatmap */
                        <div className="bg-[#1E293B] rounded-2xl border border-white/10 p-4 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> 出手热力图</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setHeatmapMode('both')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'both' 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        全部
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamA')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamA' 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        A队
                                    </button>
                                    <button
                                        onClick={() => setHeatmapMode('teamB')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                            heatmapMode === 'teamB' 
                                                ? 'bg-orange-500 text-white' 
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        B队
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
                                    <span className="text-[9px] font-bold text-blue-400">A队</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <span className="text-[9px] font-bold text-red-400">B队</span>
                                </div>
                            </div>
                        </div>
                    )}

                     {/* Upsell Banner in Basic Stats */}

                     <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-4 border border-white/10 flex items-center justify-between">

                         <div>

                             <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1"><Crown className="w-3 h-3 text-amber-300" /> 升级 Pro 版</h4>

                             <p className="text-[10px] text-slate-400">解锁高级视频编辑、数据导出、历史对比等专业功能</p>

                         </div>

                         <button onClick={() => replaceView('ai_result_analysis')} className="bg-white text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full">立即升级</button>

                     </div>

                 </div>

             )}

         </div>

         {/* Bottom Action Bar (Only visible in Clips tab if Selection Mode is active, or default) */}

         {activeTab === 'clips' && isSelectionMode && (

             <div className="absolute bottom-0 left-0 right-0 bg-[#1E293B] border-t border-white/10 p-4 pb-8 z-30 animate-in slide-in-from-bottom">

                 <div className="flex justify-between items-center mb-3">

                     <span className="text-xs text-slate-400">已选择 {selectedClipIds.length} 个片段</span>

                     <button onClick={() => setSelectedClipIds(selectedClipIds.length === displayClips.length ? [] : displayClips.map(c => c.id))} className="text-xs text-blue-400 font-bold">{selectedClipIds.length === displayClips.length ? '取消全选' : '全选'}</button>

                 </div>

                 <div className="flex gap-3">

                     <button onClick={handleMergeClips} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Layers className="w-4 h-4" /> 合并片段</button>

                     <button onClick={handleShare} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"><Share2 className="w-4 h-4" /> 导出分享</button>

                 </div>

             </div>

         )}

         

         {/* Default Footer for Highlights (When not selecting) */}

         {activeTab === 'clips' && !isSelectionMode && (

             <div className="p-4 bg-[#0F172A] border-t border-white/10">

                 <button onClick={handleExportAll} className="w-full bg-orange-500 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">

                     <Share2 className="w-4 h-4" /> 导出全部集锦

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
                                {opt.label}
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
                         自定义...
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
        events: playerEvents.map(e => ({ id: e.id, type: e.scoreType, time: e.time, label: e.label, claimed: true }))
      };
    } else {
      const scored = (e: { scoreType: number | string; scored?: boolean }) => (e as any).scored !== false;
      const pts1 = playerEvents.filter(e => e.scoreType === 1 && scored(e)).length;
      const pts2 = playerEvents.filter(e => e.scoreType === 2 && scored(e)).length * 2;
      const pts3 = playerEvents.filter(e => e.scoreType === 3 && scored(e)).length * 3;
      const pts = pts1 + pts2 + pts3;
      const reb = playerEvents.filter(e => e.scoreType === 'rebound').length;
      const ast = playerEvents.filter(e => e.scoreType === 'assist').length;
      const stl = playerEvents.filter(e => e.scoreType === 'steal').length;
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
        eff: `+${Math.round(eff)}`,
        events: playerEvents.map(e => ({ id: e.id, type: e.scoreType, time: e.time, label: e.label, claimed: true }))
      };
    }
  });
};

// --- Player Detail View Component ---
const PlayerDetailView = ({ player, sport, onClose }: { player: any, sport: string, onClose: () => void }) => {
  const { setShowShareModal, setShareType, setShareContext } = useAppContext();
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
          <User className="w-4 h-4 text-blue-400" /> {player.label} 详情
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
                <div className="text-xs text-slate-400">进球</div>
                <div className="text-lg font-bold text-white">{player.goals || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">角球</div>
                <div className="text-lg font-bold text-white">{player.corners || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">点球</div>
                <div className="text-lg font-bold text-white">{player.penalties || 0}</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">得分</div>
                <div className="text-lg font-bold text-white">{player.pts || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">篮板</div>
                <div className="text-lg font-bold text-white">{player.reb || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">助攻</div>
                <div className="text-lg font-bold text-white">{player.ast || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-xs text-slate-400">抢断</div>
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
            <Share2 className="w-3.5 h-3.5" /> 分享数据看板
          </button>
        </div>
      </div>

    </div>
  );
};

// --- New Internal Components for Advanced Analysis Views ---

  // Basketball Heatmap Component (personal view only, used in stats tab)
  const BasketballHeatmap = ({ playerLabel }: { playerLabel: string | null }) => {
    const { eventClaims, resultSport } = useAppContext();

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
                  <span>{hasPlayer ? '个人出手热力图' : '出手热力图'}</span>
              </h3>
              {hasPlayer ? (
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 max-w-[120px] truncate">
                      {playerLabel}
                  </span>
              ) : (
                  <span className="text-[10px] text-slate-400">
                      从上方选择一名球员
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
                  <span>深色区域表示该球员高频出手/停留位置</span>
              </div>
          </div>
      </div>
    );
  };

  // Soccer Heatmap Component (personal view only, used in stats tab)
  const SoccerHeatmap = ({ playerLabel }: { playerLabel: string | null }) => {
    const { eventClaims, resultSport } = useAppContext();

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
                  <span>{hasPlayer ? '个人跑动热力图' : '跑动热力图'}</span>
              </h3>
              {hasPlayer ? (
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 max-w-[120px] truncate">
                      {playerLabel}
                  </span>
              ) : (
                  <span className="text-[10px] text-slate-400">
                      从上方选择一名球员
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
                  <span>颜色越深表示该球员在该区域触球 / 跑动更频繁</span>
              </div>
          </div>
      </div>
    );
  };

 const BasketballAdvancedView = () => {

    const { eventClaims, expandedPlayerKey, setExpandedPlayerKey } = useAppContext();
    const playerStats = calculatePlayerStats('basketball', eventClaims);

    const [sortField, setSortField] = useState<'pts' | 'reb' | 'ast' | 'stl'>('pts');
    const [sortAsc, setSortAsc] = useState(false);

    const handleSort = (field: 'pts' | 'reb' | 'ast' | 'stl') => {
      setSortField(prev => {
        if (prev === field) {
          setSortAsc(a => !a);
          return prev;
        }
        setSortAsc(false);
        return field;
      });
    };

    const sortedPlayerStats = [...playerStats].sort((a, b) => {
      const av = (a as any)[sortField] ?? 0;
      const bv = (b as any)[sortField] ?? 0;
      return sortAsc ? av - bv : bv - av;
    });

    return (

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* 球员效率榜 - 表格形式 */}

          <div className="bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden">

              <div className="px-4 py-3 border-b border-white/5">

                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> 球员效率榜</h3>

              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-white/5 text-[10px] text-slate-300">
                      <th className="px-3 py-2 text-left font-semibold">球员</th>
                      <th className="px-2 py-2 text-center font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('pts')}
                          className="inline-flex items-center gap-0.5"
                        >
                          得分
                          <span className="text-[8px]">
                            {sortField === 'pts' ? (sortAsc ? '↑' : '↓') : ''}
                          </span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('reb')}
                          className="inline-flex items-center gap-0.5"
                        >
                          篮板
                          <span className="text-[8px]">
                            {sortField === 'reb' ? (sortAsc ? '↑' : '↓') : ''}
                          </span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('ast')}
                          className="inline-flex items-center gap-0.5"
                        >
                          助攻
                          <span className="text-[8px]">
                            {sortField === 'ast' ? (sortAsc ? '↑' : '↓') : ''}
                          </span>
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('stl')}
                          className="inline-flex items-center gap-0.5"
                        >
                          抢断
                          <span className="text-[8px]">
                            {sortField === 'stl' ? (sortAsc ? '↑' : '↓') : ''}
                          </span>
                        </button>
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">效率值</th>
                      <th className="px-3 py-2 text-center font-semibold">详情</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedPlayerStats.map((p) => (
                      <tr key={p.key} className="hover:bg-white/5">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${p.color}`}>
                              {p.label.slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white truncate max-w-[90px]">
                                {p.label}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {(p as any).team === 'A' ? 'A 队' : 'B 队'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center font-mono text-xs text-white">
                          {(p as any).pts ?? 0}
                        </td>
                        <td className="px-2 py-2 text-center font-mono text-xs text-white">
                          {(p as any).reb ?? 0}
                        </td>
                        <td className="px-2 py-2 text-center font-mono text-xs text-white">
                          {(p as any).ast ?? 0}
                        </td>
                        <td className="px-2 py-2 text-center font-mono text-xs text-white">
                          {(p as any).stl ?? 0}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-xs text-emerald-400">
                          {(p as any).eff ?? '+0'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPlayerKey(
                                expandedPlayerKey === p.key ? null : p.key
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 text-slate-200 hover:bg-white/10 whitespace-nowrap"
                          >
                            查看详情
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${
                                expandedPlayerKey === p.key ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {expandedPlayerKey && (
                <div className="border-t border-white/10 bg-black/20">
                  {sortedPlayerStats
                    .filter((p) => p.key === expandedPlayerKey)
                    .map((p) => (
                      <PlayerDetailView
                        key={p.key}
                        player={p}
                        sport="basketball"
                        onClose={() => setExpandedPlayerKey(null)}
                      />
                    ))}
                </div>
              )}

          </div>

      </div>

  );

  };

  const SoccerAdvancedView = () => {

    const { eventClaims, expandedPlayerKey, setExpandedPlayerKey } = useAppContext();
    const playerStats = calculatePlayerStats('soccer', eventClaims);

    return (

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* 球员数据 */}

          <div className="bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden">

              <div className="px-4 py-3 border-b border-white/5">

                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> 球员数据</h3>

              </div>

              <div className="divide-y divide-white/5">

                  {playerStats.map((p) => (

                      <div key={p.key}>
                          <div 
                              onClick={() => setExpandedPlayerKey(expandedPlayerKey === p.key ? null : p.key)}
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
                          >
                              <div className="flex items-center gap-3 flex-1">

                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${p.color}`}>{p.label.slice(0, 2)}</div>

                                  <div className="flex-1">

                                      <div className="flex items-center gap-2">
                                          <div className="text-xs font-bold text-white">{p.label}</div>
                                      </div>

                                      <div className="text-[9px] text-slate-400">评分 {(p as any).rating || 8.0}</div>

                                  </div>

                              </div>

                              <div className="flex gap-3 text-right">

                                  <div className="flex flex-col items-end"><span className="text-[10px] text-slate-400">进球</span><span className="text-xs font-bold text-white font-mono">{(p as any).goals || 0}</span></div>

                                  {(p as any).corners !== undefined && (
                                      <div className="flex flex-col items-end"><span className="text-[10px] text-slate-400">角球</span><span className="text-xs font-bold text-white font-mono">{(p as any).corners || 0}</span></div>
                                  )}

                                  {(p as any).penalties !== undefined && (
                                      <div className="flex flex-col items-end"><span className="text-[10px] text-slate-400">点球</span><span className="text-xs font-bold text-white font-mono">{(p as any).penalties || 0}</span></div>
                                  )}

                              </div>

                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedPlayerKey === p.key ? 'rotate-180' : ''}`} />

                          </div>

                          {expandedPlayerKey === p.key && (
                              <PlayerDetailView 
                                  player={p} 
                                  sport="soccer" 
                                  onClose={() => setExpandedPlayerKey(null)}
                              />
                          )}
                      </div>

                  ))}

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
    
    // 高阶分析：仅支持分享个人球员数据看板，需先选择球员
    const [advancedSelectedPlayer, setAdvancedSelectedPlayer] = useState<string | null>(null);
    
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

    // 高阶分析：个人球员列表（用于选择后分享其数据看板）
    const advancedPlayerList = React.useMemo(
        () => calculatePlayerStats(resultSport || 'basketball', eventClaims),
        [resultSport, eventClaims]
    );

    useEffect(() => {
        if (advancedSelectedPlayer && !advancedPlayerList.some(p => p.key === advancedSelectedPlayer)) {
            setAdvancedSelectedPlayer(null);
        }
    }, [advancedPlayerList, advancedSelectedPlayer]);

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
            setToastMessage('高光片段最多15秒');
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
        setToastMessage('已标记');
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
            const m: Record<string, string> = { goal: '进球', corner: '角球进攻', setpiece: '任意球破门', penalty: '点球命中' };
            return m[String(scoreType)] ?? '进球';
        }
        if (type === 'score') {
            const m: Record<number, string> = { 1: '1分罚球', 2: '2分命中', 3: '3分命中' };
            return m[Number(scoreType)] ?? '2分命中';
        }
        const m: Record<string, string> = { rebound: '篮板球', steal: '抢断', assist: '助攻' };
        return m[String(scoreType)] ?? '篮板球';
    };

    // Manual correction: 阵营识别
    const handleCorrectTeam = (clipId: number, newTeam: 'A' | 'B') => {
        setClipsState(prev =>
            prev.map(c => (c.id === clipId ? { ...c, team: newTeam } : c))
        );
        const idx = AI_CLIPS_ADVANCED.findIndex(c => c.id === clipId);
        if (idx !== -1) (AI_CLIPS_ADVANCED[idx] as any).team = newTeam;
        setToastMessage('已修正阵营');
        setTimeout(() => setToastMessage(null), 2000);
    };

    // Manual correction: 事件类型 / 得分结果 (type + scoreType + label; 得分结果含 命中/未中)
    type EventTypeOption = { id: string | number; label: string; type: string; scoreType: number | string; scored?: boolean };
    const eventTypeOptions: EventTypeOption[] = isSoccer
        ? [
            { id: 'goal', label: '进球', type: 'soccer_event', scoreType: 'goal' },
            { id: 'corner', label: '角球', type: 'soccer_event', scoreType: 'corner' },
            { id: 'setpiece', label: '定位球', type: 'soccer_event', scoreType: 'setpiece' },
            { id: 'penalty', label: '点球', type: 'soccer_event', scoreType: 'penalty' },
        ]
        : [
            { id: 3, label: '3分', type: 'score', scoreType: 3, scored: true },
            { id: 2, label: '2分', type: 'score', scoreType: 2, scored: true },
            { id: 1, label: '1分', type: 'score', scoreType: 1, scored: true },
            { id: 'rebound', label: '篮板', type: 'basketball_event', scoreType: 'rebound' },
            { id: 'steal', label: '抢断', type: 'basketball_event', scoreType: 'steal' },
            { id: 'assist', label: '助攻', type: 'basketball_event', scoreType: 'assist' },
        ];

    const handleCorrectEventType = (clipId: number, opt: EventTypeOption) => {
        const sport = resultSport || 'basketball';
        const label = opt.label ?? getLabelForEvent(sport, opt.type, opt.scoreType);
        const scored = opt.scored;
        setClipsState(prev =>
            prev.map(c => {
                if (c.id !== clipId) return c;
                const next = { ...c, type: opt.type, scoreType: opt.scoreType, label } as (typeof prev)[number];
                if (scored !== undefined) (next as any).scored = scored;
                return next;
            })
        );
        const idx = AI_CLIPS_ADVANCED.findIndex(c => c.id === clipId);
        if (idx !== -1) {
            const clip = AI_CLIPS_ADVANCED[idx] as any;
            clip.type = opt.type;
            clip.scoreType = opt.scoreType;
            clip.label = label;
            if (scored !== undefined) clip.scored = scored;
        }
        setOpenTypeMenuId(null);
        setToastMessage('已修正类型');
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleMergeClips = () => {
        if (selectedClipIds.length === 0) return;

        setShareContext({ type: 'selected' });
        setProgressModal({ show: true, title: '正在合并并保存', progress: 0 });

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
            setToastMessage('该球员暂无集锦');
            setTimeout(() => setToastMessage(null), 2000);
            return;
        }
        setShareContext({ type: 'player_clips', playerLabel: label });
        setProgressModal({ show: true, title: `正在合并 ${label} 集锦`, progress: 0 });

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
        setProgressModal({ show: true, title: '正在导出全部集锦', progress: 0 });

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
        setProgressModal({ show: true, title: '正在生成专业分析报告...', progress: 0 });

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

    // Helper function to map data row label to event type for click navigation
    const getEventTypeFromLabel = (label: string): string | number | null => {
        if (isSoccer) {
            if (label === '进球' || label === 'xG (期望进球)') return 'goal';
            if (label === '角球') return 'corner';
            if (label === '定位球') return 'setpiece';
            if (label === '点球') return 'penalty';
            if (label === '射门 (射正)') return 'goal'; // Map to first goal event
            // '控球率' and others have no direct mapping
            return null;
        } else {
            if (label === '总得分') return 'score'; // Any score event
            if (label === '三分得分' || label === '三分命中') return 3;
            if (label === '两分得分' || label === '两分命中') return 2;
            if (label === '罚球得分' || label === '罚球命中') return 1;
            if (label === '投篮命中率' || label === '两分命中率' || label === '三分命中率') return null; // No direct event mapping
            if (label === '篮板') return 'rebound';
            if (label === '抢断') return 'steal';
            if (label === '助攻') return 'assist';
        }
        return null;
    };

    // Process stats comparison for Pro view - reorder and add two-point row for basketball
    const processedStatsComparison = isSoccer 
        ? statsData.comparison 
        : (() => {
            const comparison = [...statsData.comparison];
            // Calculate two-point score: total - free throw - three point
            const totalScore = comparison.find(item => item.label === '总得分');
            const freeThrowScore = comparison.find(item => item.label === '罚球得分');
            const threePointScore = comparison.find(item => item.label === '三分得分');
            
            if (totalScore && freeThrowScore && threePointScore) {
                const twoPointScoreA = (totalScore.a as number) - (freeThrowScore.a as number) - (threePointScore.a as number);
                const twoPointScoreB = (totalScore.b as number) - (freeThrowScore.b as number) - (threePointScore.b as number);
                
                // Find if two-point row already exists
                const existingTwoPoint = comparison.find(item => item.label === '两分得分' || item.label === '两分命中');
                if (!existingTwoPoint) {
                    // Insert after total score
                    const totalIndex = comparison.findIndex(item => item.label === '总得分');
                    comparison.splice(totalIndex + 1, 0, {
                        label: '两分得分',
                        a: twoPointScoreA,
                        b: twoPointScoreB
                    });
                }
            }
            
            // Reorder: 总得分, 两分得分, 三分得分, 罚球得分, 投篮命中率 (highlight core metrics)
            const priorityOrder = ['总得分', '两分得分', '三分得分', '罚球得分', '投篮命中率'];
            const ordered: typeof comparison = [];
            const remaining: typeof comparison = [];
            
            priorityOrder.forEach(label => {
                const item = comparison.find(i => i.label === label);
                if (item) ordered.push(item);
            });
            
            comparison.forEach(item => {
                if (!priorityOrder.includes(item.label)) {
                    remaining.push(item);
                }
            });
            
            return [...ordered, ...remaining];
        })();

    // Filters for clips tab
    const filters = isSoccer 
      ? [ { id: 'all', label: '全部' }, { id: 'goal', label: '进球' }, { id: 'corner', label: '角球' }, { id: 'setpiece', label: '定位球' }, { id: 'penalty', label: '点球' } ]
      : [ { id: 'all', label: '全部' }, { id: 3, label: '3分' }, { id: 2, label: '2分' }, { id: 1, label: '罚球' }, { id: 'rebound', label: '篮板' }, { id: 'steal', label: '抢断' }, { id: 'assist', label: '助攻' } ];

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
            setToastMessage('请先选择一个片段');
            setTimeout(() => setToastMessage(null), 2000);
            return;
        }
        if (!oneClickBackgroundType && !oneClickElementType) {
            setToastMessage('请至少选择背景或元素中的一项');
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
            setToastMessage('请先选择一个片段');
            setTimeout(() => setToastMessage(null), 2000);
            return;
        }
        setAiCoachLoading(true);
        const clip = displayClips.find(c => c.id === aiCoachSelectedClipId);
        setTimeout(() => {
            setAiCoachComment(
                clip
                    ? `片段 ${clip.time}「${clip.label}」中，你的决策选择整体不错。\n` +
                      `建议注意提前观察队友站位，在完成这次进攻的同时，为下一回合创造更好的空间。`
                    : '未找到对应片段，但可以围绕投篮选择、防守位置和配合默契三个维度做针对性复盘。'
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

      ? [{ id: 'all', label: '全' }, { id: 'goal', label: '进' }, { id: 'corner', label: '角' }, { id: 'setpiece', label: '定' }, { id: 'penalty', label: '点' }]

      : [{ id: 'all', label: '全' }, { id: 3, label: '3' }, { id: 2, label: '2' }, { id: 1, label: '1' }, { id: 'rebound', label: '篮板' }, { id: 'steal', label: '抢断' }, { id: 'assist', label: '助攻' }];

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
                     <RotateCcw className="w-3 h-3" /> 跳转至 {currentTime}
                 </div>
             )}
             <div className="absolute bottom-0 left-0 right-0 p-4 pb-4 z-20 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent">
                 <div className="flex justify-between items-end mb-2">
                     <div className="flex flex-col items-center">
                         <span className={`text-3xl font-black ${statsData.teamA.color} drop-shadow-lg`}>{statsData.teamA.score}</span>
                         <span className="text-xs font-bold text-white/90">{statsData.teamA.name}</span>
                     </div>
                     <div className="text-2xl font-black text-slate-500 pb-2">VS</div>
                     <div className="flex flex-col items-center">
                         <span className={`text-3xl font-black ${statsData.teamB.color} drop-shadow-lg`}>{statsData.teamB.score}</span>
                         <span className="text-xs font-bold text-white/90">{statsData.teamB.name}</span>
                     </div>
                 </div>
             </div>
         </div>

         

         {/* Tab Switcher */}

         <div className="flex border-b border-white/10 bg-[#0F172A]">

             <button onClick={() => setActiveTab('clips')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'clips' ? 'text-white' : 'text-slate-500'}`}>

                 智能集锦

                 {activeTab === 'clips' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full"></div>}

             </button>

             <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-slate-500'}`}>

                 赛事回顾

                 {activeTab === 'stats' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>}

             </button>

            <button onClick={() => setActiveTab('advanced')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'advanced' ? 'text-white' : 'text-slate-500'}`}>

                <span className="flex items-center justify-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> 高阶分析</span>

                {activeTab === 'advanced' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-full"></div>}

            </button>

            <button onClick={() => setActiveTab('aigc')} className={`flex-1 py-3 text-xs font-bold relative transition-colors ${activeTab === 'aigc' ? 'text-white' : 'text-slate-500'}`}>

                <span className="flex items-center justify-center gap-1"><Scissors className="w-3 h-3 text-purple-400" /> AIGC 实验室</span>

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

                                <span className={`text-xs font-bold ${selectedCollection === col.id ? 'text-white' : 'text-slate-300'}`}>{col.label}</span>

                            </button>

                             ))}

                         </div>

                         

                         {/* Filter Pills */}

                         <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">

                             {filters.map(f => (

                                 <button key={f.id} onClick={() => setSelectedFilter(f.id as EventFilterType)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedFilter === f.id ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}>{f.label}</button>

                             ))}

                         </div>

                         {/* Player Filter */}
                         {availablePlayers.length > 0 && (
                             <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                                 <button 
                                     onClick={() => setSelectedPlayer('all')} 
                                     className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${selectedPlayer === null || selectedPlayer === 'all' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700'}`}
                                 >
                                     全部球员
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
                                 {isSelectionMode ? '取消选择' : '选择片段'}
                             </button>
                         </div>

                         {/* Clip List */}

                         <div className="space-y-3">

                             {displayClips.length === 0 && <div className="text-center text-slate-500 text-xs py-8">该分类下暂无片段</div>}

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

                                                     <h4 className="text-sm font-bold text-slate-200">{clip.label}</h4>

                                                     <div className="flex items-center gap-1.5">
                                                         <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {clip.time}</span>
                                                         <button
                                                             onClick={(e) => { e.stopPropagation(); handleCorrectTeam(clip.id, clip.team === 'A' ? 'B' : 'A'); }}
                                                             className={`text-[8px] px-1 rounded transition-opacity hover:opacity-80 ${clip.team === 'A' ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}
                                                             title="修正阵营（点击切换 A/B）"
                                                         >
                                                             {clip.team}队
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
                                                             取消
                                                         </button>
                                                         <button 
                                                             onClick={handleSaveDuration}
                                                             className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[8px] font-bold text-white transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             确定
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
                                                                 title="编辑时长"
                                                             >
                                                                 <Edit3 className="w-2.5 h-2.5" /> <span className="hidden sm:inline">编辑时长</span>
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
                                                                     title="修正事件类型"
                                                                 >
                                                                     <Edit3 className="w-2.5 h-2.5" /> <span className="hidden sm:inline">类型</span> <ChevronDown className={`w-2.5 h-2.5 transition-transform ${openTypeMenuId === clip.id ? 'rotate-180' : ''}`} />
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
                                                                     title="标记球员"
                                                                 >
                                                                     {(eventClaims[clip.id] ?? clip.player) ? (
                                                                         <><User className="w-2.5 h-2.5" /><span className="max-w-[40px] truncate">{eventClaims[clip.id] ?? clip.player}</span><ChevronDown className={`w-2.5 h-2.5 transition-transform ${openPlayerMenuId === clip.id ? 'rotate-180' : ''}`} /></>
                                                                     ) : (
                                                                         <><User className="w-2.5 h-2.5" /><span className="hidden sm:inline">未标记</span><ChevronDown className={`w-2.5 h-2.5 transition-transform ${openPlayerMenuId === clip.id ? 'rotate-180' : ''}`} /></>
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
                                <h3 className="text-sm font-bold text-slate-300 whitespace-nowrap">关键时间轴</h3>
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
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsSelectionMode(!isSelectionMode)}
                                        className="px-2 py-1 rounded-full border border-white/10 text-[10px] font-bold text-slate-300 bg-slate-900/60 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                                    >
                                        {isSelectionMode ? '完成选择' : '选择导出'}
                                    </button>
                                </div>
                            </div>

                            {isSelectionMode && (
                                <div className="flex justify-between items-center mb-2 px-1 text-[10px] text-slate-400">
                                    <span>已选择 {selectedClipIds.length} 个片段</span>
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
                                            {selectedClipIds.length === filteredEvents.length ? '取消全选' : '全选本页'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleShare}
                                            className="px-2 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                        >
                                            导出片段
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">

                                {filteredEvents.map(clip => {
                                    const isSelected = selectedClipIds.includes(clip.id);
                                    const teamName = clip.team === 'A' ? statsData.teamA.name : statsData.teamB.name;
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
                                                                ? `${clip.scoreType}分`
                                                                : clip.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-200 truncate">
                                                        {clip.label}
                                                    </div>
                                                    {playerLabel && (
                                                        <div className="mt-0.5 text-[10px] text-slate-400 truncate">
                                                            相关球员：{playerLabel}
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

                                {filteredEvents.length === 0 && <div className="text-center text-slate-600 text-xs py-4">无此类型事件</div>}

                            </div>
                        </div>

                        {/* 团队数据对比 */}
                        <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden mb-4">
                            <div className="flex justify-between items-center px-4 py-3 bg-white/5 text-[10px] font-bold text-slate-400 border-b border-white/5">
                                <span>{statsData.teamA.name}</span>
                                <span>数据项</span>
                                <span>{statsData.teamB.name}</span>
                            </div>
                            {processedStatsComparison.map((item, index) => {
                                const eventType = getEventTypeFromLabel(item.label);
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

                                const aValue = typeof item.a === 'number' ? item.a : parseFloat(String(item.a)) || 0;
                                const bValue = typeof item.b === 'number' ? item.b : parseFloat(String(item.b)) || 0;
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
                                            <span className={`w-12 text-left text-[11px] font-mono font-bold ${aIsHigher ? statsData.teamA.color : 'text-slate-500'}`}>
                                                {item.a}
                                            </span>
                                            <span className="flex-1 text-center text-xs text-slate-300">
                                                {item.label}
                                            </span>
                                            <span className={`w-12 text-right text-[11px] font-mono font-bold ${bIsHigher ? statsData.teamB.color : 'text-slate-500'}`}>
                                                {item.b}
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

                        {/* 热力图球员选择器（就近控制个人视角） */}
                        {availablePlayers.length > 0 && (
                            <div className="mt-4 mb-2 px-1 flex items-center justify-between gap-3">
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                    热力图球员
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
                                        全部
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

                     // --- Advanced Analysis View（仅个人球员；分享仅支持所选球员数据看板）---

                     <div className="pb-24 space-y-4">

                        {/* 球员数据/效率榜 - 先看数据 */}
                        {isSoccer ? <SoccerAdvancedView /> : <BasketballAdvancedView />}

                        {/* 球员选择器（用于分享）- 看完数据后选择分享 */}
                        <div>
                            <p className="text-[10px] text-slate-400 mb-2">选择球员以分享其数据看板</p>
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {advancedPlayerList.length === 0 ? (
                                    <span className="text-xs text-slate-500">暂无球员数据</span>
                                ) : (
                                    advancedPlayerList.map((p) => (
                                        <button
                                            key={p.key}
                                            onClick={() => setAdvancedSelectedPlayer(advancedSelectedPlayer === p.key ? null : p.key)}
                                            className={`flex-none px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${
                                                advancedSelectedPlayer === p.key ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* AI 解说 & 文案 */}
                        <div className="mt-4 bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-200">AI 解说 & 文案</h3>
                                <div className="flex gap-1">
                                    {[
                                        { id: 'pro', label: '专业解说' },
                                        { id: 'passion', label: '热血现场' },
                                        { id: 'fun', label: '轻松搞笑' },
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
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 space-y-2 text-[11px] text-slate-200">
                                <div className="font-bold text-slate-100">解说大纲</div>
                                <p className="leading-relaxed">
                                    {aiStoryTone === 'pro'
                                        ? '开场先交代双方战绩与关键对位，重点突出本场的节奏转换与攻防效率变化。'
                                        : aiStoryTone === 'passion'
                                        ? '今天这场比赛火花四溅，进攻一波接一波，关键回合完全是意志力的对决！'
                                        : '这场球就像周末球局升级版，一边是“永不防守队”，一边是“快乐投篮队”。'}
                                </p>
                                <div className="pt-2 border-t border-white/10">
                                    <div className="font-bold text-slate-100 mb-1">社交平台文案示例</div>
                                    <ul className="space-y-1 text-[10px] text-slate-300 list-disc list-inside">
                                        <li>
                                            {aiStoryTone === 'pro'
                                                ? '【技术拆解】用一场球看懂节奏、空间与决策，关键回合逐帧复盘。'
                                                : aiStoryTone === 'passion'
                                                ? '【燃爆高光】这一场，我只看进球和大帽！每一回合都值得循环播放🔥'
                                                : '【周末必看】一群人假装打职业，其实是在给朋友圈贡献表情包。'}
                                        </li>
                                        <li>
                                            {aiStoryTone === 'pro'
                                                ? '数据支撑 + 画面演示，适合分享给队友一起复盘。'
                                                : aiStoryTone === 'passion'
                                                ? '适合发到朋友圈 / 小红书，配上 30 秒 AI 精彩集锦效果更佳。'
                                                : '文案一键复制，配合表情包与短视频使用效果更好。'}
                                        </li>
                                    </ul>
                                    <button
                                        onClick={() => setAiStoryVariant(v => v + 1)}
                                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/15 text-slate-200 hover:bg-white/10 transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" /> 换一版
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
                                    <h3 className="text-sm font-bold text-slate-200">换背景换元素（AIGC）</h3>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        选择一个高光片段，AI 自动更换背景和添加元素。
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* 片段选择 - 单选 */}
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">选择一个高光片段：</p>
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
                                                    <span className="truncate flex-1 min-w-0">{clip.label}</span>
                                                    <span className="ml-2 text-[10px] text-slate-400">{clip.duration}</span>
                                                </button>
                                            );
                                        })}
                                        {displayClips.length === 0 && (
                                            <div className="text-[11px] text-slate-500 text-center py-4">
                                                暂无可用高光片段，请先完成智能集锦分析。
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 背景选择 */}
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">选择背景类型：</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { id: 'court', label: '球场背景' },
                                            { id: 'effect', label: '特效背景' },
                                            { id: 'solid', label: '纯色背景' },
                                            { id: 'gradient', label: '渐变背景' },
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
                                                {bg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 元素选择 */}
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">选择元素类型：</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { id: 'effect', label: '特效' },
                                            { id: 'text', label: '文字叠加' },
                                            { id: 'sticker', label: '贴纸' },
                                            { id: 'filter', label: '滤镜' },
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
                                                {elem.label}
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
                                    {oneClickGenerating ? '生成中…' : '生成 AIGC 效果'}
                                </button>

                                {/* 预览显示 */}
                                {oneClickHasPreview && oneClickSelectedClipId && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-200">
                                                AIGC 效果预览
                                            </span>
                                        </div>
                                        <div className="h-24 rounded-xl border border-dashed border-white/15 bg-gradient-to-br from-purple-500/30 via-slate-900 to-black p-2 flex items-stretch gap-2">
                                            {/* 左侧缩略图区域：模拟成片封面 */}
                                            <div className="relative flex-1 rounded-lg bg-black/60 overflow-hidden flex items-center justify-center">
                                                <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_#a855f7_0,_transparent_45%),radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)]" />
                                                <div className="relative z-10 w-full h-full flex flex-col justify-between p-2">
                                                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-100">
                                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500/40">
                                                            {statsData.teamA.name}
                                                        </span>
                                                        <span className="text-[11px] font-black">VS</span>
                                                        <span className="px-1.5 py-0.5 rounded-full bg-red-500/40">
                                                            {statsData.teamB.name}
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
                                                            AI 精彩集锦 · 自动剪辑示例
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
                                                        成品效果示意
                                                    </div>
                                                    <p className="text-[10px] leading-snug text-slate-300">
                                                        参考社交平台封面样式，自动叠加比分、队伍与视觉特效。
                                                    </p>
                                                </div>
                                                <div className="mt-1 text-[9px] text-slate-400">
                                                    最终导出视频会基于所选片段与参数生成类似效果。
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
                                            预览成片
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Coach 点评（AIGC） */}
                        <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-200">AI Coach 点评（AIGC）</h3>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        针对单个高光片段给出战术与表现点评。
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="space-y-2">
                                    <p className="text-[11px] text-slate-400">选择一个需要详细点评的高光片段：</p>
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
                                                    <span className="truncate flex-1 min-w-0">{clip.label}</span>
                                                    <span className="ml-2 text-[10px] text-slate-400">{clip.duration}</span>
                                                </button>
                                            );
                                        })}
                                        {displayClips.length === 0 && (
                                            <div className="text-[11px] text-slate-500 text-center py-4">
                                                暂无可点评片段，请先完成智能集锦分析。
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
                                        {aiCoachLoading ? '点评生成中…' : '生成 AI Coach 点评'}
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
                                                        战术点评短视频
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        目标片段 ID：{aiCoachSelectedClipId}
                                                    </span>
                                                </div>
                                                <div className="h-20 rounded-lg border border-dashed border-white/15 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-black flex items-center justify-center text-[11px] text-slate-100">
                                                    已为该高光片段合成画面 + AI 解说音轨预览。
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
                                                    预览解说视频
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
                     <span className="text-xs text-slate-400">已选择 {selectedClipIds.length} 个片段</span>
                     <button onClick={() => setSelectedClipIds(selectedClipIds.length === displayClips.length ? [] : displayClips.map(c => c.id))} className="text-xs text-blue-400 font-bold">{selectedClipIds.length === displayClips.length ? '取消全选' : '全选'}</button>
                 </div>
                 <div className="flex gap-3">
                     <button onClick={handleMergeClips} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Layers className="w-4 h-4" /> 合并并保存</button>
                     <button onClick={handleShare} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"><Share2 className="w-4 h-4" /> 导出分享</button>
                 </div>
             </div>
         )}

         {/* Default Footer for Clips Tab (When not selecting) */}
         {activeTab === 'clips' && !isSelectionMode && (
             <div className="p-4 bg-[#0F172A] border-t border-white/10 space-y-2">
                 {selectedPlayer && selectedPlayer !== 'all' && (
                    <button onClick={() => handleSharePlayerClips(selectedPlayer)} className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" /> 分享集锦
                    </button>
                 )}
                 <button onClick={handleExportAll} className="w-full bg-blue-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                     <Share2 className="w-4 h-4" /> 导出全部集锦
                 </button>
             </div>
         )}

         {/* Footer for Stats Tab */}
         {activeTab === 'stats' && (
             <div className="p-4 bg-[#0F172A] border-t border-white/10"><button onClick={handleExportReport} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors"><Download className="w-4 h-4" /> 导出专业分析报告</button></div>
         )}
         {/* Footer for Advanced Tab - 仅支持分享所选个人球员数据看板 */}
         {activeTab === 'advanced' && (() => {
             const sel = advancedSelectedPlayer ? advancedPlayerList.find(x => x.key === advancedSelectedPlayer) : null;
             return (
                 <div className="p-4 bg-[#0F172A] border-t border-white/10">
                     {sel ? (
                         <button
                             onClick={() => {
                                 setShareContext({ type: 'player_dashboard', playerLabel: sel.label });
                                 setShareType('all');
                                 setShowShareModal(true);
                             }}
                             className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                         >
                             <Share2 className="w-4 h-4" /> 分享 {sel.label} 数据看板
                         </button>
                     ) : (
                         <button disabled className="w-full bg-slate-700 text-slate-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                             <Share2 className="w-4 h-4" /> 请先选择球员
                         </button>
                     )}
                 </div>
             );
         })()}

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
                                 {opt.label}
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
                         自定义...
                     </button>
                 </div>,
                 document.body
             );
         })()}

      </div>

    );

  };

  // --- AIGC Preview Screen Component ---

  const AigcPreviewScreen = () => {

    const { popView, shareContext, setShowShareModal, setShareType, resultSport, aigcPreviewMode } = useAppContext();

    const clipsForSport = AI_CLIPS_ADVANCED.filter(
      (clip) => clip.sport === (resultSport || 'basketball')
    );

    let title = 'AIGC 预览';
    if (aigcPreviewMode === 'one_click') {
      title = '换背景换元素预览';
    } else if (aigcPreviewMode === 'coach_clip') {
      title = 'AI 解说短视频预览';
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
                  ? 'AI 已为所选片段应用背景和元素效果。'
                  : 'AI 已为该片段合成画面 + 解说音轨预览。'}
              </p>
              {aigcPreviewMode === 'one_click' && selectedClips.length > 0 && (
                <p className="text-slate-300 text-xs mt-3">
                  片段：{(selectedClips[0] as any).label} · {(selectedClips[0] as any).time}
                </p>
              )}
              {aigcPreviewMode === 'coach_clip' && targetClip && (
                <p className="text-slate-300 text-xs mt-3">
                  片段时间：{(targetClip as any).time} · 标题：
                  {(targetClip as any).label}
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
                  片段信息
                </span>
              </div>
              <div className="space-y-1">
                {selectedClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="flex items-center justify-between text-[11px] text-slate-200"
                  >
                    <span className="text-slate-400 mr-2">
                      片段：
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      {(clip as any).label}
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
                  战术点评摘要
                </span>
                <span className="text-[10px] text-slate-400">
                  片段时间：{(targetClip as any).time}
                </span>
              </div>
              {shareContext.type === 'aigc_coach_clip' &&
              shareContext.aiCoachComment ? (
                <p className="text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {shareContext.aiCoachComment}
                </p>
              ) : (
                <p className="text-[11px] text-slate-300">
                  AI 已叠加解说音轨和画面剪辑，适合用于社交平台战术点评短视频。
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <Share2 className="w-4 h-4" /> 分享短视频
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

        setTutorialStep, setShowTutorial, pushView, transferStep, transferProgress, handleEntryClick, handleExport, setTargetAnalysisType, setAiMode, setIsTaskCompleted, homeTab, setHomeTab, networkState, falconState, setNetworkState, setFalconState, setToastMessage, setResultSport,

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

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">工具箱</h1>

        <div className="flex gap-2">

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

          <div className="flex items-center justify-between mb-3 px-1"><h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">创作工具</h2></div>

          <div className="grid grid-cols-2 gap-3 mb-3">

              {/* --- Left Card: Basic Highlights --- */}

              <button onClick={() => { handleEntryClick('highlight'); setResultSport('basketball'); }} className="col-span-1 bg-gradient-to-br from-orange-500 to-amber-500 rounded-[24px] p-4 flex flex-col justify-between h-48 shadow-lg shadow-orange-500/20 border border-orange-400/30 active:scale-95 transition-transform relative overflow-hidden group">

                 <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />

                 <div className="relative z-10 flex flex-col h-full">

                    <div className="flex justify-between items-start mb-2">

                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-orange-600 shadow-sm"><Film className="w-5 h-5" /></div>

                        <span className="text-[8px] font-black text-orange-900 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">付费</span>

                    </div>

                    <div className="mt-auto text-left">

                        <h3 className="text-lg font-black text-white leading-tight mb-1">AI 精彩集锦</h3>

                        <div className="flex flex-wrap gap-1 mt-2">

                            <span className="text-[9px] font-bold text-white bg-white/30 px-1.5 py-0.5 rounded-md">自动成片</span>

                            <span className="text-[9px] font-bold text-white bg-white/30 px-1.5 py-0.5 rounded-md">一键分享</span>

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

                         <h3 className="text-lg font-black text-white leading-tight mb-2">AI 高阶分析</h3>

                        <div className="space-y-1.5">

                            <div className="flex items-center gap-1.5">

                                <Film className="w-3 h-3 text-indigo-400" />

                                <span className="text-[10px] text-indigo-100/80">🎬 智能集锦</span>

                            </div>

                            <div className="flex items-center gap-1.5">

                                <Download className="w-3 h-3 text-indigo-400" />

                                <span className="text-[10px] text-indigo-100/80">📊 球员看板</span>

                            </div>

                            <div className="flex items-center gap-1.5">

                                <TrendingUp className="w-3 h-3 text-indigo-400" />

                                <span className="text-[10px] text-indigo-100/80">🎧 AI 成片</span>

                            </div>

                        </div>

                     </div>

                 </div>

              </button>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <button className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">开始剪辑</span><span className="text-[10px] text-slate-400">手动剪辑</span></div><div className="bg-slate-100 p-2 rounded-full text-slate-700 group-hover:bg-slate-200 transition-colors"><Scissors className="w-4 h-4" /></div></button>

            <button className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">打点剪辑</span><span className="text-[10px] text-slate-400">标记关键点</span></div><div className="bg-purple-50 p-2 rounded-full text-purple-500 group-hover:bg-purple-100 transition-colors"><Filter className="w-4 h-4" /></div></button>

            <button onClick={() => { setHomeTab('templates'); }} className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">模板成片</span><span className="text-[10px] text-slate-400">特效 / 导出</span></div><div className="bg-orange-50 p-2 rounded-full text-orange-500 group-hover:bg-orange-100 transition-colors"><LayoutTemplate className="w-4 h-4" /></div></button>

            <button onClick={handleExport} className="bg-white rounded-[20px] h-16 flex items-center justify-between px-4 text-slate-800 shadow-sm border border-slate-100 active:scale-95 transition-transform group"><div className="flex flex-col items-start"><span className="font-bold text-sm">合成导出</span><span className="text-[10px] text-slate-400">项目分享</span></div><div className="bg-blue-50 p-2 rounded-full text-blue-500 group-hover:bg-blue-100 transition-colors"><FileText className="w-4 h-4" /></div></button>

          </div>

        </section>

        {/* Tabbed Section */}

        <section className="min-h-[300px]">

             <div className="sticky top-0 bg-[#F5F5F5] z-20 pb-2 pt-2">

                 <div className="flex items-center gap-4 border-b border-slate-200/60 pb-1">

                     <button onClick={() => setHomeTab('recent')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${homeTab === 'recent' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>最近项目</button>

                     <button onClick={() => setHomeTab('templates')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${homeTab === 'templates' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>我的模板</button>

                     <button onClick={() => setHomeTab('drafts')} className={`text-sm font-bold pb-2 border-b-2 transition-all ${homeTab === 'drafts' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent'}`}>草稿箱</button>

                 </div>

             </div>

             <div className="mt-4 space-y-3">

                 {homeTab === 'recent' && (

                     <>

                        {HISTORY_TASKS.filter(task => task.status === 'completed').slice(0, 4).map(task => (

                           <div key={task.id} onClick={() => { setTargetAnalysisType(task.type as any); setAiMode('cloud'); setIsTaskCompleted(true); setResultSport(task.cover); pushView(task.type === 'highlight' ? 'ai_result_highlight' : 'ai_result_analysis'); }} className="bg-white rounded-[20px] p-3 shadow-sm flex gap-3 active:bg-gray-50 relative overflow-hidden border border-slate-100">

                             {task.type === 'analysis' && <div className="absolute top-0 right-0 bg-slate-800 text-amber-300 text-[9px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm"><Crown className="w-2.5 h-2.5 fill-current" /> PRO</div>}

                             <div className="w-24 h-16 bg-slate-100 rounded-lg overflow-hidden relative shrink-0"><AssetThumbnail type="video" category={task.cover} /><div className="absolute inset-0 flex items-center justify-center"><PlayCircle className="w-8 h-8 text-white/80" /></div></div>

                             <div className="flex-1 py-1 min-w-0"><h4 className="font-bold text-sm text-slate-800 truncate">{task.title}</h4><div className="flex items-center gap-2 mt-1.5"><p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {task.date}</p><span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${task.type === 'highlight' ? 'text-orange-600 bg-orange-50' : 'text-purple-600 bg-purple-50'}`}>{task.type === 'highlight' ? '基础集锦' : '高阶分析'}</span></div></div>

                           </div>

                        ))}

                     </>

                 )}

                 {homeTab === 'templates' && (

                     <div className="grid grid-cols-2 gap-3">

                         {TEMPLATE_DATA.map(t => (

                             <div key={t.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">

                                 <div className="aspect-[3/4] bg-slate-200 relative">

                                    <AssetThumbnail type="image" category="basketball" />

                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">{t.type === 'vertical' ? '9:16' : '16:9'}</div>

                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded">{t.tag}</div>

                                 </div>

                                 <div className="p-3">

                                     <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>

                                     <p className="text-[10px] text-slate-400 mt-1">{t.usage} 人使用</p>

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

                             <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-slate-700 truncate mb-1">{draft.title}</h4><div className="flex items-center gap-2 text-xs text-slate-400"><span>{draft.date}</span><span className="w-1 h-1 rounded-full bg-slate-300" /><span>进度: {draft.progress}</span></div></div>

                             <div className="flex flex-col items-end gap-1"><span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">编辑中</span><Edit3 className="w-4 h-4 text-slate-300" /></div>

                           </div>

                        ))}

                     </>

                 )}

             </div>

        </section>

      </div>

      <div className="h-[83px] bg-white border-t border-slate-100 flex justify-around items-end pb-6 pt-2 absolute bottom-0 w-full z-10 px-1">

         <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><Home className="w-6 h-6" /><span className="text-[10px] font-bold">首页</span></div>

         <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><ImageIcon className="w-6 h-6" /><span className="text-[10px] font-bold">相册</span></div>

         <div className="flex flex-col items-center justify-end -mt-6">

            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-900/20 border-[3px] border-white mb-1 active:scale-95 transition-transform"><Camera className="w-6 h-6" /></div>

            <span className="text-[10px] font-bold text-slate-900">拍摄</span>

         </div>

         <div className="flex flex-col items-center gap-1 text-orange-500 w-14 mb-1"><CreditCard className="w-6 h-6" /><span className="text-[10px] font-bold">工具箱</span></div>

         <div className="flex flex-col items-center gap-1 text-slate-400 w-14 mb-1"><User className="w-6 h-6" /><span className="text-[10px] font-bold">我的</span></div>

      </div>

    </div>

  );

  };

  const App = () => {

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
              const taskId = addCloudTask(selectedVideo.id, selectedVideo.label, targetAnalysisType || 'highlight');
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
              const toastMsg = targetAnalysisType === 'highlight' ? 'AI 精彩集锦生成完成' : 'AI 高阶分析完成';
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
                     const toastMsg = targetAnalysisType === 'highlight' ? 'AI 精彩集锦生成完成' : 'AI 高阶分析完成';
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