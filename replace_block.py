# Read exact block from file
with open("App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start = content.find('                                                    {editingTimeClipId === clip.id ? (')
if start < 0:
    print("Start not found")
    exit(1)

# Find end of this block: we need to match through "                                                    )}"
# The block ends with "                                                    )}\n                                                </div>"
end_marker = "                                                    )}\n                                                </div>"
end = content.find(end_marker, start)
if end < 0:
    print("End not found")
    exit(1)
end += len(end_marker)

old_block = content[start:end]
# Replace with just the label. We need to keep the flex-1 div structure.
# The structure is: "                                                    { ternary }\n                                                </div>"
# We're replacing the ternary with just the label div.
new_block = '''                                                    <div className="text-sm font-bold text-slate-200">{clip.label}</div>
                                                </div>'''

# But wait - we're replacing from start (inside flex-1) through the closing </div> of flex-1.
# So we're replacing the ternary AND the "</div>" that closes flex-1. We need to keep that </div>.
# Let me look at structure again.
# Line 4026: <div className="flex-1">
# 4027:     { ternary }
# 4055:     </div>  <- closes flex-1
# So "start" is at the ternary. "end" we said includes "}\n                                                </div>".
# So we're replacing the ternary and the </div>. We need to output the label div AND the closing </div> for flex-1.
new_block = '''                                                    <div className="text-sm font-bold text-slate-200">{clip.label}</div>
                                                </div>'''

old_block_check = content[start:start+200]
print("Old block starts with:", repr(old_block_check[:150]))

# Replace only the ternary part, not the closing </div>. Let me find end of ternary.
# Ternary ends at "                                                    )}"
ternary_end = content.find("                                                    )}", start)
if ternary_end < 0:
    print("Ternary end not found")
    exit(1)
ternary_end += len("                                                    )}")

# So we replace content[start:ternary_end] with just the label line.
# We leave "                                                </div>" as is.
old_block = content[start:ternary_end]
new_block = '                                                    <div className="text-sm font-bold text-slate-200">{clip.label}</div>'

out = content[:start] + new_block + content[ternary_end:]
with open("App.tsx", "w", encoding="utf-8") as f:
    f.write(out)
print("Done")
