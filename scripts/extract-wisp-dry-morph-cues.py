"""Carry the dry V7 sound edit into the two individual morph cue candidates.
No generation, retiming, picture encode, approval grant or public publication.
"""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,tempfile,wave
import cv2
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'source/wisp-performance-reference/button-cue-batch'
FFMPEG=os.environ.get('FFMPEG') or shutil.which('ffmpeg') or str(ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
review=json.loads((FOLDER/'wisp-morph-roundtrip-review-v7.json').read_text())
sound=FOLDER/review['soundRevision']['file']
assert sha(sound)==review['soundRevision']['sha256'],'Dry soundtrack changed'
with wave.open(str(sound)) as source:
    assert (source.getframerate(),source.getsampwidth(),source.getnchannels())==(48000,2,2)
    pcm=np.frombuffer(source.readframes(source.getnframes()),dtype='<i2').reshape(-1,2)
# Offsets are cumulative original frame counts, never rounded display timestamps.
plans=[('cute-to-evil',122,121),('evil-to-cute',364,121)]
for cue,_,_ in plans:
    assert not (FOLDER/(cue+'-runtime-candidate-v3.mp4')).exists(),'Refusing output overwrite'
    assert not (FOLDER/(cue+'-runtime-candidate-v3.json')).exists(),'Refusing report overwrite'
def essence(p):
    return subprocess.check_output([FFMPEG,'-v','error','-i',str(p),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','pipe:1'],text=True).strip()
for cue,start_frame,count in plans:
    original=FOLDER/(cue+'-runtime-candidate-v2.mp4')
    expected=next(item['sha256'] for item in review['inputs'] if Path(item['file']).name==original.name)
    assert sha(original)==expected,'Original visual source changed'
    first=start_frame*2000;last=first+count*2000;window=pcm[first:last].copy()
    assert len(window)==count*2000
    output=FOLDER/(cue+'-runtime-candidate-v3.mp4')
    with tempfile.TemporaryDirectory(prefix='wisp-dry-cue-',dir=ROOT/'work') as temporary:
        temporary=Path(temporary);wav=temporary/'exact-sound-window.wav';movie=temporary/'candidate.mp4'
        with wave.open(str(wav),'wb') as w:
            w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(window.tobytes())
        subprocess.run([FFMPEG,'-v','error','-n','-i',str(original),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-video_track_timescale','24000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(movie)],check=True)
        assert essence(original)==essence(movie),'Compressed visual essence changed'
        before=cv2.VideoCapture(str(original));after=cv2.VideoCapture(str(movie));decoded=0
        while True:
            ok_a,a=before.read();ok_b,b=after.read();assert ok_a==ok_b
            if not ok_a:break
            assert np.array_equal(a,b),'Decoded picture changed at frame '+str(decoded)
            decoded+=1
        before.release();after.release();assert decoded==count
        audio=np.frombuffer(subprocess.check_output([FFMPEG,'-v','error','-i',str(movie),'-map','0:a:0','-f','f32le','-ac','2','-ar','48000','pipe:1']),dtype='<f4').reshape(-1,2)
        assert len(audio)>=len(window)
        head=float(np.abs(audio[:24000]).max());tail=float(np.abs(audio[len(window)-24000:len(window)]).max())
        assert max(head,tail)<0.0001,'Sound does not leave half-second quiet handles'
        report={'status':'source-only dry sound candidate; human level/file acceptance pending','file':output.name,'sha256':sha(movie),'sourceVideo':original.name,'sourceVideoSha256':sha(original),'sourceReview':'wisp-morph-roundtrip-review-v7.mp4','sourceSound':sound.name,'sourceSoundSha256':sha(sound),'sourceAudioSampleWindow':[first,last],'sampleRate':48000,'fps':24,'frameCount':count,'compressedVideoEssenceUnchanged':True,'allDecodedFramesPixelIdentical':True,'decodedFrames':decoded,'audioPeak':float(np.abs(audio).max()),'decodedAudioHeadHalfSecondPeak':head,'decodedAudioTailHalfSecondPeak':tail,'generationCreditsSpent':0,'humanApproval':False,'runtimePublication':False,'scope':'Original full motion/picture retained without resizing or retiming. Exact dry V7 PCM time window replaces rejected musical audio. Contextual visual approval does not establish standalone cue, loop, new join, level or physical projection acceptance.'}
        entry,exit=('friendly-rest','scary-rest') if cue=='cute-to-evil' else ('scary-rest','friendly-rest')
        report.update(humanReview='pending',entryPort=entry,exitPort=exit,entryReview='pending',exitReview='pending',emptyStartFrames=0,emptyEndFrames=0,audioTailSilenceSeconds=.5,audio={'sampleRate':48000,'peak':report['audioPeak'],'lastHalfSecondPeak':tail,'scope':'Decoded soundtrack measurements; no human listening or exact cue/transition approval.'})
        shutil.move(str(movie),output)
        output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps({key:report[key] for key in ['file','frameCount','allDecodedFramesPixelIdentical','audioPeak','decodedAudioTailHalfSecondPeak']}))
