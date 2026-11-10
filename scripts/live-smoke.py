"""Explicitly calls the deployed service. Real image tests consume Vision quota."""
import urllib.request, urllib.error, json, pathlib, re, uuid, datetime, html
base='https://vision-labeler-dot-cs651-n33-lcho-20261014.uw.r.appspot.com'
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'docs/evidence/live'
checks=[]
def request(path,data=None,headers=None):
 req=urllib.request.Request(base+path,data=data,headers=headers or {})
 try:
  with urllib.request.urlopen(req,timeout=90) as r:return r.status,r.read(),dict(r.headers)
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
def multipart(name,data,mime,consent=True):
 b='Boundary'+uuid.uuid4().hex; parts=[]
 if consent:parts.append(f'--{b}\r\nContent-Disposition: form-data; name="consent"\r\n\r\nyes\r\n'.encode())
 if name is not None:parts.append(f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+data+b'\r\n')
 parts.append(f'--{b}--\r\n'.encode())
 return b''.join(parts),{'Content-Type':'multipart/form-data; boundary='+b,'Origin':base}
status,body,h=request('/health'); checks.append({'test':'Health in real Vision mode','status':status,'body':body.decode()});assert status==200 and json.loads(body)['mode']=='vision'
status,body,h=request('/');assert status==200 and b'<form' in body and b'SIMULATED' not in body
(out/'home.html').write_bytes(body); checks.append({'test':'HTTPS home form','status':status})
for path in [root/'docs/evidence/sample-landscape.png',out/'test-apple.png']:
 data,headers=multipart(path.name,path.read_bytes(),'image/png')
 status,body,h=request('/analyze',data,headers);(out/(path.stem+'-result.html')).write_bytes(body)
 cells=[re.sub('<[^>]+>',' ',c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>',body.decode(),flags=re.S)]
 labels=[html.unescape(x) for x in re.findall(r'<th scope=\"row\">(.*?)</th>',body.decode())]
 checks.append({'test':'Real Vision: '+path.name,'status':status,'labels':labels,'table_cells':cells})
 assert status==200 and b'SIMULATED' not in body and b'(simulated)' not in body and len(cells)>0
samples=[('missing-image',None,b'','image/png',True,400),('missing-consent','sample.png',(root/'docs/evidence/sample-landscape.png').read_bytes(),'image/png',False,400),('wrong-mime','note.txt',b'hello','text/plain',True,415),('corrupt-image','bad.png',b'not a png','image/png',True,415),('animated-webp','animated.webp',(root/'test/animated.webp').read_bytes(),'image/webp',True,400),('oversize','large.png',b'0'*(5*1024*1024+1),'image/png',True,413)]
for name,fn,data,mime,consent,expect in samples:
 data,headers=multipart(fn,data,mime,consent);status,body,h=request('/analyze',data,headers)
 checks.append({'test':name,'status':status,'expected':expect});assert status==expect,(name,status)
status,body,h=request('/analyze',b'x',{'Content-Type':'text/plain','Origin':'https://example.com'});checks.append({'test':'cross-origin rejected','status':status});assert status==403
status,body,h=request('/src/server.js');checks.append({'test':'server source is not public','status':status});assert status==404
record={'verified_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':base,'version':'vision-20261110b','checks':checks}
(out/'live-checks.json').write_text(json.dumps(record,indent=2));print(json.dumps(record,indent=2))
