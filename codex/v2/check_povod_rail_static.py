import json, math, re, base64, hashlib, urllib.request
from html.parser import HTMLParser
from pathlib import Path
root=Path.cwd()
sizes={}
for w,h in [(1440,900),(375,812)]:
 a=min(150,max(96,w*.09));n=min(72,max(46,w*.044));pitch=(a+n)/2+(12 if w<=700 else 16)
 right=20 if w<=700 else min(64,max(20,w*.039));cx=w-right-a/2
 top=h*(.39 if w<=700 else .22)
 sizes[f'{w}x{h}']={'active':a,'inactive':n,'innerRadius':a/2+w*.045,'outerRadius':a/2+w*.095,
   'centres':[[round(cx,3),round(top+pitch*(i+.5),3)] for i in range(4)],
   'photoBounds':[round(cx-a/2,3),round(cx+a/2,3)],'captionWidth':w-a-60 if w<=700 else min(300,max(200,w*.21)),
   'ringsClippedByHero':True,'border':3,'ringBorder':1.6,'connector':3,'duration':.9}
 assert cx+a/2<=w-right+.001 and cx-a/2>=0
 assert pitch-(a+n)/2>=12
class Links(HTMLParser):
 def __init__(self): super().__init__();self.names=[]
 def handle_starttag(self,tag,attrs):
  href=dict(attrs).get('href','')
  if tag=='a' and href.endswith('.mp4'):self.names.append(href.split('/')[-1])
parser=Links()
parser.feed(urllib.request.urlopen('http://127.0.0.1:8770/povod/assets/v2/video/').read().decode())
expected=['slide-wedding','slide-birthday','slide-anniversary','slide-jubilee','story-meet','story-trip','story-proposal','story-today','clouds']
media={}
artifact=(root/'povod/artifact.html').read_text(encoding='utf-8')
# Manifest is one generated JSON line before the unchanged source data.
manifest=json.loads(artifact.split('window.POVOD_ASSETS=',1)[1].split(';\n',1)[0])
for name in expected:
 p='assets/v2/video/'+name+'.mp4'
 assert name+'.mp4' in parser.names
 with urllib.request.urlopen('http://127.0.0.1:8770/povod/'+p) as r: assert r.status==200
 data=(root/'povod'/p).read_bytes()
 embedded=base64.b64decode(manifest[p].split(',',1)[1])
 assert hashlib.sha256(data).digest()==hashlib.sha256(embedded).digest()
 media[name]={'http':200,'embeddedIdentical':True}
for p in [root/'povod/app.js',root/'povod/styles.css',root/'povod/artifact.html']:
 s=p.read_text(encoding='utf-8-sig')
 assert not any(chr(c) in s for c in [0x2013,0x2014])
face_boxes={
 'birthday':[(720,550,935,805),(900,365,1105,635),(1250,400,1420,635),(1570,335,1760,600),(1690,535,1885,805)],
 'jubilee':[(200,550,340,735),(315,370,490,630),(745,410,865,600),(1005,365,1160,600),(1430,330,1560,575),(1520,410,1660,615),(1710,380,1880,615)]
}
face_checks=[]
for w,h in [(1440,900),(375,812)]:
 for occasion in face_boxes:
  focal=(.3 if occasion=='birthday' else .7) if w<700 else (-.5 if occasion=='birthday' else -2.5)
  image_scale=max(w/1920,h/1080)
  dx=(w-1920*image_scale)*focal;dy=(h-1080*image_scale)*.5
  title=(20,176.6,349.3 if occasion=='birthday' else 292.2,298.2 if occasion=='birthday' else 243.8) if w<700 else (80,199.8,801 if occasion=='birthday' else 631,446.04 if occasion=='birthday' else 335.88)
  for zoom in (1.04,1.09,1.12):
   overlaps=[]
   for i,(l,t,r,b) in enumerate(face_boxes[occasion]):
    box=[(l*image_scale+dx-w/2)*zoom+w/2,(t*image_scale+dy-h/2)*zoom+h/2,
         (r*image_scale+dx-w/2)*zoom+w/2,(b*image_scale+dy-h/2)*zoom+h/2]
    if max(box[0],title[0])<min(box[2],title[2]) and max(box[1],title[1])<min(box[3],title[3]):overlaps.append(i)
   assert not overlaps,(w,occasion,zoom,overlaps)
   face_checks.append({'width':w,'occasion':occasion,'zoom':zoom,'titleIntersections':len(overlaps)})
result={'browser':'Chromium spawn EPERM; no screenshots; overflow and console not measured',
 'geometry':sizes,'videos':media,
 'posterFaceClearance':{'method':'Manual approximate face boxes on supplied 1920x1080 posters, CSS cover and title bounds. Moving video frames not rendered.','checks':face_checks},
 'sourceFiles':['povod/styles.css','povod/app.js'],'artifactRebuilt':True}
(root/'codex/v2/povod_hero_rail_check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=True,indent=2))

