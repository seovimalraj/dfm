import os, time, requests, io
import trimesh
SUPABASE_URL = os.environ['NEXT_PUBLIC_SUPABASE_URL']
SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
REST = f'{SUPABASE_URL}/rest/v1'
HEADERS = { 'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}', 'Content-Type':'application/json' }

def claim_job():
    r = requests.post(f'{REST}/rpc/claim_job', headers=HEADERS, json={})
    if r.status_code == 200 and r.text not in ('null',''): return r.json()
    return None

def set_job(i, payload):
    requests.patch(f'{REST}/analysis_jobs?id=eq.{i}', headers=HEADERS, json=payload)

while True:
    job = claim_job()
    if not job:
        time.sleep(2); continue
    try:
        buf = requests.get(job['input_url']).content
        mesh = trimesh.load(io.BytesIO(buf), file_type='stl')
        bbox = mesh.bounding_box.extents.tolist()
        area = float(mesh.area)
        vol = float(mesh.volume)
        metrics = { 'bbox_mm': bbox, 'surface_area_mm2': area, 'volume_mm3': vol }
        set_job(job['id'], { 'status':'completed', 'metrics_json': metrics, 'features_json': [], 'issues_json': [] })
        print('done', job['id'])
    except Exception as e:
        set_job(job['id'], { 'status':'failed', 'error': str(e) })
        print('failed', job['id'], e)
