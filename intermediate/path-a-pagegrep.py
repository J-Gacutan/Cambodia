# Map lines of the CI Cambodia report text to PRINTED page numbers, then grep.
# A printed page number is a bare arabic or roman number on its own line at the page foot.
# Footnote markers (a bare number followed by an indented line of footnote text) are skipped.
import re,sys
t=open(sys.argv[1],encoding="utf-8").read().splitlines()
def is_page(i):
    if not re.fullmatch(r"\d{1,3}|[ivxlcIVXLC]{1,6}",t[i].strip()): return False
    nxt=t[i+1] if i+1<len(t) else ""
    return not re.match(r"^\s{2,}\S",nxt)
pg=[None]*len(t); cur=None
for i in range(len(t)-1,-1,-1):
    if is_page(i): cur=t[i].strip()
    pg[i]=cur
pat=re.compile(sys.argv[2],re.I)
for i,l in enumerate(t):
    if pat.search(l): print(f"p.{pg[i]} | L{i+1}: {l.strip()[:200]}")
