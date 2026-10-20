"""Render the real first act for join/mix review; not a finished show or loop.

Run from the repository root. Requires numpy, OpenCV and ffmpeg (HAUNT_FFMPEG
or PATH). Preserves every source frame and refuses to overwrite its exports.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import wave

import cv2
import numpy as np

ROOT = Path('source/wisp-performance-reference/tonight-demo')
FFMPEG = os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
PREFIX = ROOT / 'story-act-one-review-v1'
PICTURE = PREFIX.with_name(PREFIX.name + '-picture').with_suffix('.mp4')
SOUND = PREFIX.with_suffix('.wav')
MOVIE = PREFIX.with_suffix('.mp4')
REPORT = PREFIX.with_suffix('.json')
for file in (PICTURE, SOUND, MOVIE, REPORT):
    if file.exists():
        raise SystemExit('Preserve existing review export: ' + str(file))

sources = [('story-prefix-picture-v1.mp4', 364), ('scare-apology-picture-review-v1.mp4', 290), ('writing-story-staged-v1.mp4', 145)]
encoder = subprocess.Popen([FFMPEG, '-hide_banner', '-loglevel', 'error', '-n', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1280x720', '-r', '24', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(PICTURE)], stdin=subprocess.PIPE)
hashes = []
try:
    for name, expected in sources:
        path = ROOT / name
        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened() or cap.get(cv2.CAP_PROP_FPS) != 24:
            raise RuntimeError('Expected real 24fps footage: ' + name)
        count = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame.shape != (720, 1280, 3):
                raise RuntimeError('Unexpected picture dimensions: ' + name)
            encoder.stdin.write(frame.tobytes())
            count += 1
        cap.release()
        if count != expected:
            raise RuntimeError('Changed source frame count: ' + name)
        hashes.append({'file': name, 'frames': count, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    encoder.stdin.close()
    if encoder.wait() != 0:
        raise RuntimeError('Picture encoding failed')
except BaseException:
    encoder.kill()
    encoder.wait()
    raise

# At 24fps and 48kHz, every picture frame spans exactly 2000 audio samples.
sample_rate = 48000
frames = sum(count for _, count in sources)
mix = np.zeros((frames * 2000, 2), dtype=np.float64)
events = []

def audio(path, rate=1):
    args = [FFMPEG, '-hide_banner', '-loglevel', 'error', '-i', str(path), '-vn']
    if rate != 1:
        args += ['-af', 'aresample=48000,asetrate=' + str(round(48000 * rate)) + ',aresample=48000']
    raw = subprocess.check_output(args + ['-ar', '48000', '-ac', '2', '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).copy()

def place(samples, at_frame, gain, title, maximum_frames=None):
    if maximum_frames is not None:
        samples = samples[:maximum_frames * 2000]
    start = at_frame * 2000
    count = min(len(samples), len(mix) - start)
    mix[start:start + count] += samples[:count] * gain
    events.append({'title': title, 'atFrame': at_frame, 'atSeconds': at_frame / 24, 'gain': gain, 'samples': count})

place(audio(ROOT / 'scare-apology-sound-review-v1.mp4'), 364, 1, 'User-approved scare, recovery and apology mix', 290)
effect_file = Path('source/wisp-performance-reference/ambient-show/sound-study/wisp-soft-apparition-v1.mp3')
effect = audio(effect_file)
place(effect, 2, .18, 'Wisp gathers')
place(audio(effect_file, .72), 122, .20, 'Pretending to be tough')
place(effect, 654 + 48, .14, 'First vapor-writing stroke')
place(effect, 654 + 84, .10, 'Second vapor-writing stroke')
peak = float(np.max(np.abs(mix)))
if peak >= .98:
    raise RuntimeError('Mix needs review: peak too close to clipping')
with wave.open(str(SOUND), 'wb') as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(sample_rate)
    output.writeframes(np.rint(mix * 32767).astype('<i2').tobytes())
subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-n', '-i', str(PICTURE), '-i', str(SOUND), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(MOVIE)], check=True)
REPORT.write_text(json.dumps({'status': 'first-act review only; not a finished story or loop', 'releaseApproved': False, 'frames': frames, 'fps': 24, 'durationSeconds': frames / 24, 'sourcePictures': hashes, 'chapters': [{'id': key, 'startFrame': start, 'endFrame': end} for key, start, end in [('friendly', 0, 122), ('morph', 122, 243), ('menacing', 243, 364), ('brief-scare', 364, 461), ('apology', 461, 654), ('writing', 654, 799)]], 'soundEvents': events, 'samplePeak': peak, 'movieSha256': hashlib.sha256(MOVIE.read_bytes()).hexdigest(), 'scope': 'Actual source pictures and sound, all source frames retained; approved core mix at original gain without overlapping new effects. The last shot intentionally awaits its departure/bats continuation; it has no final black boundary and must not be deployed as the full show. Full-context human motion/mix review and physical projection remain unproven.'}, indent=2))
print(json.dumps({'file': str(MOVIE), 'frames': frames, 'durationSeconds': frames / 24, 'samplePeak': peak}))
