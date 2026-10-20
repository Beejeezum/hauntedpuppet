"""Assemble the complete story only from explicitly selected closing films.

Run from repository root after reviewing the source films. No provider access,
capture, interpolation, crop or overwrites. Closing files must be staged 24fps
1280x720 movies; audio comes from the separately selected bat source.
This export remains a candidate until its actual motion, mix and joins pass.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import wave

import cv2
import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--departure', required=True)
parser.add_argument('--bats', required=True)
parser.add_argument('--bat-audio', required=True)
parser.add_argument('--version', required=True, type=int)
args = parser.parse_args()
root = Path('source/wisp-performance-reference/tonight-demo')
ff = os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
prefix = root / ('tonight-story-candidate-v' + str(args.version))
picture = Path(str(prefix) + '-picture.mp4')
sound = prefix.with_suffix('.wav')
movie = prefix.with_suffix('.mp4')
report = prefix.with_suffix('.json')
for file in (picture, sound, movie, report):
    if file.exists():
        raise SystemExit('Preserve existing export: ' + str(file))
sources = [root/'story-act-one-review-v1-picture.mp4', Path(args.departure), Path(args.bats)]
for source in sources + [Path(args.bat_audio), root/'story-act-one-review-v1.wav']:
    if not source.is_file():
        raise SystemExit('Missing selected source: ' + str(source))
encoder = subprocess.Popen([ff, '-hide_banner', '-loglevel', 'error', '-n', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1280x720', '-r', '24', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(picture)], stdin=subprocess.PIPE)
clips = []
frames = 0
try:
    for source in sources:
        capture = cv2.VideoCapture(str(source))
        if not capture.isOpened() or abs(capture.get(cv2.CAP_PROP_FPS)-24) > .001:
            raise RuntimeError('Expected real 24fps source: ' + str(source))
        start, count = frames, 0
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if frame.shape != (720,1280,3):
                raise RuntimeError('Unexpected source dimensions')
            encoder.stdin.write(frame.tobytes())
            frames += 1
            count += 1
        capture.release()
        if count < 24:
            raise RuntimeError('Incomplete source film')
        clips.append({'file':str(source), 'startFrame':start, 'frames':count, 'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    if clips[0]['frames'] != 799:
        raise RuntimeError('First-act chapter timing changed; author a new cue sheet')
    # Planned two-second true-black/silent reset, never a frozen body or cut.
    empty = np.zeros((720,1280,3),dtype=np.uint8).tobytes()
    for _ in range(48):
        encoder.stdin.write(empty)
    frames += 48
    encoder.stdin.close()
    if encoder.wait() != 0:
        raise RuntimeError('Picture encoder failed')
except BaseException:
    encoder.kill()
    encoder.wait()
    raise

def audio(path):
    raw = subprocess.check_output([ff, '-hide_banner', '-loglevel', 'error', '-i', str(path), '-vn', '-ar', '48000', '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()

mix = np.zeros((frames*2000,2),dtype=np.float64)
events = []
def place(samples, at, gain, label, maximum=None):
    length = min(len(samples),len(mix)-at*2000)
    if maximum is not None:
        length = min(length,maximum*2000)
    mix[at*2000:at*2000+length] += samples[:length]*gain
    events.append({'label':label, 'atFrame':at, 'gain':gain, 'samples':length})

# Preserve the already approved scare/apology mix and first-act sound unchanged.
place(audio(root/'story-act-one-review-v1.wav'),0,1,'First act and approved scare/apology',clips[0]['frames'])
effect = audio(Path('source/wisp-performance-reference/ambient-show/sound-study/wisp-soft-apparition-v1.mp3'))
place(effect,clips[1]['startFrame']+24,.12,'Curved departure',48)
place(effect,clips[1]['startFrame']+96,.1,'Local vapor phase-out',48)
place(audio(Path(args.bat_audio)),clips[2]['startFrame'],.6,'Bats disrupt the smoke greeting',clips[2]['frames'])
# The last 48 frames remain rigorously silent even if an effect was long.
mix[-48*2000:] = 0
peak = float(np.abs(mix).max())
if peak >= .98:
    raise RuntimeError('Mix requires gain review; peak approaches clipping')
with wave.open(str(sound),'wb') as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(48000)
    output.writeframes(np.rint(mix*32767).astype('<i2').tobytes())
subprocess.run([ff,'-hide_banner','-loglevel','error','-n','-i',str(picture),'-i',str(sound),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(movie)],check=True)
chapters = [{'title':name,'startSeconds':start/24,'endSeconds':end/24} for name,start,end in [('A little showing off',0,364),('Too tough for his own good',364,461),('The apology',461,654),('A ghostly greeting',654,799),('Until next Halloween',clips[1]['startFrame'],clips[2]['startFrame']),('A flutter in the fog',clips[2]['startFrame'],frames-48),('Empty stage',frames-48,frames)]]
report.write_text(json.dumps({'status':'complete candidate, actual-film review pending','releaseApproved':False,'frames':frames,'fps':24,'durationSeconds':frames/24,'clips':clips,'chapters':chapters,'soundEvents':events,'samplePeak':peak,'pictureSha256':hashlib.sha256(picture.read_bytes()).hexdigest(),'movieSha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'blackTailFrames':48,'scope':'Preserves all selected source frames; no temporal interpolation or crossfade. Candidate is not approval of source motion, framing, audio mix, joins or physical projection.'},indent=2))
print(json.dumps({'movie':str(movie),'frames':frames,'durationSeconds':frames/24,'samplePeak':peak}))
