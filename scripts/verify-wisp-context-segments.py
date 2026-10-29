"""Verify exact native frame extraction at all authored master cuts. Video only; no approval."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,tempfile,re
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'source/wisp-performance-reference/button-cue-batch'
FF=os.environ.get('FFMPEG') or shutil.which('ffmpeg') or str(ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
report=json.loads((FOLDER/'wisp-eyes-context-review-v1.json').read_text());master=FOLDER/report['file']
assert hashlib.sha256(master.read_bytes()).hexdigest()==report['sha256']
assert report['closedGopAtAllCuts'] is True
windows=report['cueWindows'];assert windows[0]['firstFrame']==0
for a,b in zip(windows,windows[1:]):assert a['firstFrame']+a['frameCount']==b['firstFrame']
assert windows[-1]['firstFrame']+windows[-1]['frameCount']==report['frames']
results=[];cap=cv2.VideoCapture(str(master));frames=0
with tempfile.TemporaryDirectory(prefix='wisp-master-segments-',dir=ROOT/'work') as temporary:
    for window in windows:
        first,count=window['firstFrame'],window['frameCount'];out=Path(temporary)/(window['id']+'.mp4')
        subprocess.run([FF,'-v','error','-n','-ss',f'{first/report["fps"]:.10f}','-i',str(master),'-map','0:v:0','-frames:v',str(count),'-c:v','copy','-an','-movflags','+faststart',str(out)],check=True)
        segment=cv2.VideoCapture(str(out));assert segment.get(cv2.CAP_PROP_FPS)==report['fps']
        for index in range(count):
            a,f=cap.read();b,g=segment.read();assert a and b,(window['id'],index)
            assert np.array_equal(f,g),'Decoded picture changed: '+window['id']+' frame '+str(index)
            frames+=1
        assert not segment.read()[0],'Extra frame after '+window['id'];segment.release()
        # Exact first display timestamp and pacing, not just a container duration.
        log=subprocess.run([FF,'-hide_banner','-i',str(out),'-an','-vf','showinfo','-f','null','-'],capture_output=True,text=True,check=True).stderr
        times=[float(t) for t in re.findall(r'pts_time:\s*([-\d.]+)',log)]
        assert len(times)==count and max(abs(t-i/report['fps']) for i,t in enumerate(times))<.0001
        results.append({**window,'decodedFrames':count,'allPixelsIdenticalToMaster':True,'firstDisplayTimestamp':times[0],'maximumTimestampErrorSeconds':max(abs(t-i/report['fps']) for i,t in enumerate(times)),'extractedVideoSha256':hashlib.sha256(out.read_bytes()).hexdigest()})
assert not cap.read()[0];cap.release();assert frames==report['frames']
result={'master':report['file'],'masterSha256':report['sha256'],'passed':True,'decodedFrames':frames,'segments':results,'scope':'Independent compressed-video extracts preserve every decoded master pixel, start at display time zero and retain24fps at all6authored windows. Temporary outputs removed. No audio slicing, human seam/voice/motion approval, runtime publication or physical projection validation.'}
(FOLDER/'wisp-eyes-context-segment-validation-v1.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
