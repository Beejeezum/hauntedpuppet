"""Source-only neutral-film lip observations, not artist landmarks or a talking rig.
Reuses the earlier failed lip-sync audition as moving closed-mouth source art.
No image/video pixels are edited. Diagnostic contacts draw observation guides only.
"""
from pathlib import Path
import argparse,hashlib,json
import cv2,numpy as np

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'source/wisp-performance-reference/runway-pilots/whole-character-talking-study/neutral-mouth-audio-pilot-v2.mp4'
EXPECTED='86c71acf6b44eee413afc6b756e32511d9a145f7d967431bd175ee72ca79ffae'
# Manually selected on the actual first native picture, not on a different portrait.
EYES=[[525.06,312.93],[558.91,327.68]]
LIPS=[[510,325],[515,328],[520,334],[525,338],[530,341],[535,343],[540,344],[545,345],[550,345],[555,345],[560,344],[565,345],[570,347]]
SEEDS=np.array(EYES+LIPS,np.float32).reshape(-1,1,2)
LK=dict(winSize=(15,15),maxLevel=3,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,40,.001),minEigThreshold=1e-5)

def observe(reference,current,seeds=SEEDS):
    forward,status,error=cv2.calcOpticalFlowPyrLK(reference,current,seeds,None,**LK)
    if forward is None or status is None:return {'valid':False,'reason':'forward flow unavailable'}
    backward,reverse_status,_=cv2.calcOpticalFlowPyrLK(current,reference,forward,None,**LK)
    if backward is None or reverse_status is None:return {'valid':False,'reason':'reverse flow unavailable'}
    points=forward[:,0];fb=np.linalg.norm(backward[:,0]-seeds[:,0],axis=1)
    stable=(status[:,0]>0)&(reverse_status[:,0]>0)&np.isfinite(points).all(axis=1)&np.isfinite(fb)&(fb<=.75)&(error[:,0]<=25)
    lips=points[2:];span=float(np.linalg.norm(lips[-1]-lips[0]));ordered=bool(np.all(np.diff(lips[:,0])>0))
    valid=bool(stable[2:].all() and ordered and 40<=span<=90)
    return {'valid':valid,'reason':None if valid else 'untrusted lip flow, ordering or span',
        'eyes':points[:2].round(5).tolist() if stable[:2].all() else None,
        'lipSeam':lips.round(5).tolist() if valid else None,
        'maximumLipForwardBackwardError':float(fb[2:].max()),'maximumLipPhotometricError':float(error[2:,0].max()),
        'lipSpan':span,'ordered':ordered,'trackedLipPoints':int(stable[2:].sum()),'rejectedLipIndices':np.flatnonzero(~stable[2:]).tolist()}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--include-cheek-tail',action='store_true',help='Reproduce rejected13-point v1 annotation');args=parser.parse_args();seeds=SEEDS if args.include_cheek_tail else SEEDS[:-1];version=1 if args.include_cheek_tail else 2
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==EXPECTED,'Source identity changed'
    cap=cv2.VideoCapture(str(SOURCE));fps=cap.get(cv2.CAP_PROP_FPS);assert fps==24
    frames=[]
    while True:
        ok,frame=cap.read()
        if not ok:break
        assert frame.shape==(704,1088,3);frames.append(frame)
    cap.release();assert len(frames)==193
    reference=cv2.cvtColor(frames[0],cv2.COLOR_BGR2GRAY)
    rows=[{'frame':i,**observe(reference,cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY),seeds)} for i,frame in enumerate(frames)]
    # Negative control: never fabricate a lip seam from an absent/occluded face.
    absent=observe(reference,np.zeros_like(reference),seeds);assert not absent['valid'] and absent.get('lipSeam') is None
    out=ROOT/'source/wisp-art-reference/scary-speaking-study/neutral-motion-base-study';out.mkdir(exist_ok=True)
    result={'status':'source-only neutral-motion observations; no mouth rendering or production approval',
        'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':EXPECTED,'dimensions':[1088,704],'fps':24,'frames':193,
        'seeds':{'eyes':EYES,'lipSeam':seeds[2:,0].tolist(),'scope':'Manual first-picture candidates, not reviewed anatomical landmarks'},
        'method':'Independent direct first-picture-to-each-picture pyramidal Lucas-Kanade flow and reverse check. No accumulated drift or interpolated missing points. No copied upstream code.',
        'primarySource':'https://docs.opencv.org/4.x/dc/d6b/group__video__track.html','opencvVersion':cv2.__version__,
        'gates':{'maximumForwardBackwardPixels':.75,'maximumPhotometricError':25,'lipSpanPixels':[40,90]},
        'validFrames':sum(r['valid'] for r in rows),'invalidFrames':[r['frame'] for r in rows if not r['valid']],
        'absentFaceRejected':not absent['valid'],'observations':rows,
        'scope':'Consistency checks do not prove lip/jaw accuracy. Old native speech remains rejected. This only assesses reuse as a closed-mouth body-motion base. No eye rig, speaking render, loop, human voice/art or physical projection acceptance.',
        'generationCreditsSpent':0,'runtimePublication':False,'humanApproval':False}
    (out/f'neutral-lip-observations-v{version}.json').write_text(json.dumps(result,indent=2)+'\n')
    contacts=[]
    for i in np.linspace(0,192,12).round().astype(int):
        tile=frames[i].copy();row=rows[i]
        if row['valid']:
            pts=np.round(row['lipSeam']).astype(np.int32);cv2.polylines(tile,[pts],False,(0,255,0),1)
        tile=cv2.resize(tile[285:395,475:620],(435,330),interpolation=cv2.INTER_NEAREST)
        cv2.putText(tile,f'{i}: '+('candidate' if row['valid'] else 'REJECT'),(8,22),cv2.FONT_HERSHEY_SIMPLEX,.55,(0,255,255),1)
        contacts.append(tile)
    work=ROOT/'work/scary-neutral-reuse';work.mkdir(exist_ok=True)
    cv2.imwrite(str(work/f'lip-observations-v{version}.png'),np.vstack([np.hstack(contacts[i:i+4]) for i in range(0,12,4)]))
    print(json.dumps({k:result[k] for k in ['validFrames','invalidFrames','absentFaceRejected','opencvVersion','generationCreditsSpent']}))

if __name__=='__main__':main()
