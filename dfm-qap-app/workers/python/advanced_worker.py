import os, time, requests, io, json, numpy as np, trimesh
# Optional OCC omitted for brevity — see extended docs for STEP/IGES
SUPABASE_URL=os.environ['NEXT_PUBLIC_SUPABASE_URL']; SERVICE_KEY=os.environ['SUPABASE_SERVICE_ROLE_KEY']
REST=f'{SUPABASE_URL}/rest/v1'; HEADERS={'apikey':SERVICE_KEY,'Authorization':f'Bearer {SERVICE_KEY}','Content-Type':'application/json'}
RULES=json.loads(open(os.path.join(os.path.dirname(__file__),'rules.json'),'r').read()) if os.path.exists(os.path.join(os.path.dirname(__file__),'rules.json')) else {}
claim=lambda: (lambda r: r.json() if r.status_code==200 and r.text not in ('null','') else None)(requests.post(f'{REST}/rpc/claim_job',headers=HEADERS,json={}))
update=lambda i,payload: requests.patch(f'{REST}/analysis_jobs?id=eq.{i}',headers=HEADERS,json=payload)

def analyze_stl(buf):
    m = trimesh.load(io.BytesIO(buf), file_type='stl'); ext=m.bounding_box.extents.tolist(); area=float(m.area); vol=float(m.volume)
    # naive thickness sample
    char=max(ext) if ext else 1.0; N=min(300,len(m.vertices)); import numpy as np
    idx=np.random.choice(len(m.vertices),size=N,replace=False); v=m.vertices[idx]; n=m.vertex_normals[idx]
    op=v+n*(1e-3*char); om=v-n*(1e-3*char)
    lp, ip, _ = m.ray.intersects_location(op, n, multiple_hits=False)
    lm, im, _ = m.ray.intersects_location(om, -n, multiple_hits=False)
    dp={int(i):float((lp[k]-op[int(i)]).dot(lp[k]-op[int(i)]) )**0.5 for k,i in enumerate(ip)}
    dm={int(i):float((lm[k]-om[int(i)]).dot(lm[k]-om[int(i)]) )**0.5 for k,i in enumerate(im)}
    ts=[dp.get(i)+dm.get(i) for i in range(N) if i in dp and i in dm]; tmin=min(ts) if ts else None
    return { 'bbox_mm': ext, 'surface_area_mm2': area, 'volume_mm3': vol, 'min_thickness_mm': tmin }, []

while True:
    j=claim();
    if not j: time.sleep(2); continue
    try:
        buf=requests.get(j['input_url']).content; metrics, feats = analyze_stl(buf)
        proc='cnc_3axis'; cfg=RULES.get(proc,{})
        env=cfg.get('envelope_mm',[400,300,150]); bbox=metrics.get('bbox_mm',[0,0,0]); issues=[]
        for i,dim in enumerate(['X','Y','Z']):
            if i<len(bbox) and i<len(env) and bbox[i]>env[i]: issues.append({'rule':'machine_envelope','severity':'error','message':f'{dim}={bbox[i]}mm > {env[i]}mm','suggestion':'Reorient or larger machine'})
        mat='Generic'; base=cfg.get('materials',{}).get(mat,{'min_wall_mm':1.0}); wall=base.get('min_wall_mm',1.0)
        if metrics.get('min_thickness_mm') is not None and metrics['min_thickness_mm']<wall: issues.append({'rule':'thin_wall','severity':'error','message':f"min {metrics['min_thickness_mm']:.2f}mm < {wall:.2f}mm",'suggestion':'Thicken walls'})
        update(j['id'],{'status':'completed','metrics_json':metrics,'features_json':feats,'issues_json':issues}); print('done adv', j['id'])
    except Exception as e:
        update(j['id'],{'status':'failed','error':str(e)}); print('failed adv', j['id'], e)
