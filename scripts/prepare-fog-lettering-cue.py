"""Stage the complete native fog performance and add a dry, nonmusical soundtrack."""
from pathlib import Path
import hashlib, json, subprocess, wave
import cv2
import numpy as np

root = Path(__file__).resolve().parents[1]
folder = root/'source/wisp-performance-reference/button-cue-batch'
source = folder/'fog-lettering-pilot-v2.mp4'
out = folder/'fog-lettering-runtime-candidate-v1.mp4'
sound = folder/'fog-lettering-dry-air-v1.wav'
ff = root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(source) == 'af9d2e082ec764d9f81162fc89acb2114d4a19fdd15102b8dfba1f47d7e88b8b'
for path in [out, sound, out.with_suffix('.json')]:
    assert not path.exists(), 'Preserve existing candidate: '+str(path)
capture = cv2.VideoCapture(str(source))
assert capture.get(cv2.CAP_PROP_FPS) == 24
assert int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) == 241
work = root/'work/fog-lettering-candidate-v1'
work.mkdir(parents=True, exist_ok=True)
picture = work/'picture.mp4'
encoder = subprocess.Popen([str(ff),'-v','error','-n','-f','rawvideo','-pix_fmt','rgb24',
    '-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','16',
    '-pix_fmt','yuv420p',str(picture)], stdin=subprocess.PIPE)
black = np.zeros((720,1280,3), np.uint8)
edge_peak = 0
try:
    for _ in range(12):
        encoder.stdin.write(black.tobytes())
    count = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        assert frame.shape == (720,1280,3)
        edge = max(int(frame[:3].max()),int(frame[-3:].max()),
                   int(frame[:,:3].max()),int(frame[:,-3:].max()))
        edge_peak = max(edge_peak, edge)
        assert edge <= 16, 'Bright source plume reaches outer source boundary'
        # A global black-point grade removes low-level generated background haze.
        # No spatial matte or crop hides a severed plume; the entire picture is fit.
        graded = np.rint(np.maximum(frame.astype(float)-16,0)*255/239).astype(np.uint8)
        staged = black.copy()
        staged[144:576,256:1024] = cv2.resize(graded,(768,432),interpolation=cv2.INTER_AREA)
        encoder.stdin.write(cv2.cvtColor(staged,cv2.COLOR_BGR2RGB).tobytes())
        count += 1
    assert count == 241
    for _ in range(12):
        encoder.stdin.write(black.tobytes())
finally:
    capture.release()
    encoder.stdin.close()
assert encoder.wait() == 0

frames = 265
rate = 48000
audio = np.zeros((frames*2000,2), np.float64)
rng = np.random.default_rng(68192)
events = [('vapor gathers',1.15,4.8,.09,350,3000),
          ('letters breathe',4.3,6.9,.035,500,2400),
          ('letter strokes disperse',7.,10.,.16,200,3500)]
for label, start, end, peak, low, high in events:
    n = round((end-start)*rate)
    frequencies = np.fft.rfftfreq(n,1/rate)
    noise = rng.normal(size=(n,3))
    shaping = (frequencies/(frequencies+low))**2/(1+(frequencies/high)**4)
    air = np.fft.irfft(np.fft.rfft(noise,axis=0)*shaping[:,None],n=n,axis=0)
    stereo = air[:,[0,0]]*.85+air[:,1:]*.15
    stereo *= np.sin(np.linspace(0,np.pi,n))[:,None]**2
    stereo *= peak/max(1e-12,float(abs(stereo).max()))
    first = round(start*rate)
    audio[first:first+n] += stereo
with wave.open(str(sound),'wb') as stream:
    stream.setnchannels(2)
    stream.setsampwidth(2)
    stream.setframerate(rate)
    stream.writeframes((audio*32767).astype('<i2').tobytes())
subprocess.run([str(ff),'-v','error','-n','-i',str(picture),'-i',str(sound),
    '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k',
    '-movflags','+faststart',str(out)],check=True)
report = {'file':out.name,'sha256':sha(out),'source':source.name,'sourceSha256':sha(source),
    'status':'source-only review candidate; human visual/sound review pending',
    'sourceFrames':241,'frameCount':frames,'fps':24,'addedBlackFramesEachEnd':12,
    'processing':'Complete source frame order at native24fps; global RGB black point16 with linear expansion; whole un-cropped picture fixed60percent fit centered on1280x720 black. No animated scaling, retiming, reversal, interpolation, spatial smoke mask or body crossfade. Video encoded once, then copied into embedded-audio movie.',
    'sourceOuterThreePixelMaximumRGB':edge_peak,
    'audio':{'file':sound.name,'sha256':sha(sound),'sampleRate':rate,'samples':len(audio),
        'peak':float(abs(audio).max()),'seed':68192,
        'events':[{'label':a,'start':b,'end':c,'peak':d,'highpassHz':e,'lowpassHz':f} for a,b,c,d,e,f in events],
        'recipe':'Deterministic shaped broadband dry air with stereo envelopes; no speech, notes, music or choir.'},
    'humanApproval':False,'runtimePublication':False,'additionalGenerationCredits':0,
    'scope':'Static stage calibration and black-point grade require human review for smoke detail, size and projection brightness. Sound is synthesized, not an acoustic approval. Native film remains unchanged. No arbitrary cue-join or physical projection acceptance.'}
out.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'file':out.name,'frameCount':frames,'sourceEdgePeak':edge_peak,'audioPeak':report['audio']['peak']}))
