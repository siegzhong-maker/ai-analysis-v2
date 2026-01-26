#!/usr/bin/env python3
path = "App.tsx"
with open(path, "r", encoding="utf-8") as f:
    s = f.read()

old = """                                                <div className="flex-1">
                                                    {editingTimeClipId === clip.id ? (
                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={editingTime}
                                                                onChange={(e) => setEditingTime(e.target.value)}
                                                                placeholder="MM:SS"
                                                                className="text-[10px] px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white font-mono w-16 focus:outline-none focus:border-blue-500"
                                                                autoFocus
                                                            />
                                                            <button 
                                                                onClick={() => handleSaveTime(clip.id)}
                                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[9px] font-bold text-white transition-colors"
                                                            >
                                                                确定
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCancelTimeEdit}
                                                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[9px] font-bold text-slate-300 transition-colors"
                                                            >
                                                                取消
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-200">{clip.label}</div>
                                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                                                <span>{clip.time}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStartEditTime(clip.id, clip.time);
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="修正时间"
                                                                >
                                                                    <Edit3 className="w-3 h-3 text-slate-400 hover:text-blue-400" />
                                                                </button>
                                                                <span>· {clip.team === 'A' ? statsData.teamA.name : statsData.teamB.name}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>"""

new = """                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-200">{clip.label}</div>
                                                </div>"""

if old in s:
    s = s.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(s)
    print("OK")
else:
    print("OLD NOT FOUND")
    # show a snippet
    idx = s.find("editingTimeClipId === clip.id")
    if idx >= 0:
        print(repr(s[idx:idx+200]))
