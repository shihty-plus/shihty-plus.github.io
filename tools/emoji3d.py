"""Copie dans assets/emoji3d/ les emojis 3D (Fluent Emoji, MIT) utilisés par le site et écrit data/emoji3d.json.
Usage : python3 tools/emoji3d.py CHEMIN/vers/@lobehub/fluent-emoji-3d/assets/
(paquet npm @lobehub/fluent-emoji-3d : npm pack @lobehub/fluent-emoji-3d@1.1.0)"""
import json, os, shutil, glob, sys
SRC = sys.argv[1].rstrip('/') + '/'
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(RACINE, 'assets/emoji3d/')
os.makedirs(DST, exist_ok=True)
files = set(os.path.basename(f)[:-5] for f in glob.glob(SRC + '*.webp'))
texte = ''
for f in glob.glob(os.path.join(RACINE, 'data/*.json')) + [os.path.join(RACINE, 'js', x) for x in ('app.js', 'jeux.js', 'fx.js')]:
    if not f.endswith('emoji3d.json'): texte += open(f, encoding='utf8').read()
def est_pic(c):
    o = ord(c)
    return (0x1F000 <= o <= 0x1FAFF) or (0x2600 <= o <= 0x27BF) or (0x2B00 <= o <= 0x2BFF) or (0x2300 <= o <= 0x23FF) or o in (0x203C, 0x2049, 0x25B6, 0x25C0)
emojis, i, n = set(), 0, len(texte)
while i < n:
    c = texte[i]
    if est_pic(c) or (c in '0123456789#*' and i + 1 < n and texte[i + 1] in '️⃣'):
        j = i + 1
        while j < n and (texte[j] in '️⃣‍' or 0x1F3FB <= ord(texte[j]) <= 0x1F3FF or (texte[j - 1] == '‍' and est_pic(texte[j]))):
            j += 1
        g = texte[i:j]
        if not (c in '0123456789#*' and '⃣' not in g): emojis.add(g)
        i = j
    else:
        i += 1
carte = {}
for g in sorted(emojis):
    cp = '-'.join('%x' % ord(c) for c in g)
    for cand in (cp, cp.replace('-fe0f', ''), cp + '-fe0f'):
        if cand in files:
            shutil.copy(SRC + cand + '.webp', DST + cand + '.webp'); carte[g] = cand; break
json.dump(carte, open(os.path.join(RACINE, 'data/emoji3d.json'), 'w', encoding='utf8'), ensure_ascii=False)
print(len(carte), 'emojis 3D copiés')
