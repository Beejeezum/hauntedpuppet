"""Inspect every native decoded picture; clearance is diagnostic, not art approval."""
from pathlib import Path
import argparse, hashlib, json
import cv2
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('movie', type=Path)
parser.add_argument('report', type=Path)
parser.add_argument('--reserve', type=float, default=.20)
args = parser.parse_args()
if not 0 < args.reserve < .5:
    parser.error('Reserve must be between zero and one half')
capture = cv2.VideoCapture(str(args.movie))
if not capture.isOpened():
    raise RuntimeError('Cannot open cue movie')
fps = float(capture.get(cv2.CAP_PROP_FPS))
if not np.isfinite(fps) or fps <= 0:
    raise RuntimeError('Invalid source frame rate')
thresholds = [4, 8, 16]
summaries = {t: {'emptyFrames': 0, 'reserveFailures': 0,
                 'minimumMarginsLTRB': [1., 1., 1., 1.]} for t in thresholds}
rows = []
size = None
while True:
    ok, frame = capture.read()
    if not ok:
        break
    height, width = frame.shape[:2]
    if size is not None and size != [width, height]:
        raise RuntimeError('Picture dimensions changed')
    size = [width, height]
    maximum = frame.max(axis=2)
    row = {'frame': len(rows), 'seconds': len(rows)/fps,
           'maximumDecodedRGB': int(maximum.max()), 'envelopes': {}}
    for threshold in thresholds:
        y, x = np.where(maximum > threshold)
        summary = summaries[threshold]
        if not len(x):
            summary['emptyFrames'] += 1
            row['envelopes'][threshold] = {'empty': True}
            continue
        margins = [float(x.min()/width), float(y.min()/height),
                   float((width-1-x.max())/width), float((height-1-y.max())/height)]
        failed = min(margins) < args.reserve
        summary['reserveFailures'] += int(failed)
        summary['minimumMarginsLTRB'] = [min(a,b) for a,b in zip(summary['minimumMarginsLTRB'], margins)]
        row['envelopes'][threshold] = {'empty': False, 'marginsLTRB': margins,
                                      'reserveFailure': failed}
    rows.append(row)
capture.release()
if not rows:
    raise RuntimeError('No decoded pictures')
handles = {}
for threshold in [0, *thresholds]:
    head = tail = 0
    for row in rows:
        if row['maximumDecodedRGB'] > threshold:
            break
        head += 1
    for row in reversed(rows):
        if row['maximumDecodedRGB'] > threshold:
            break
        tail += 1
    handles[threshold] = {'headFrames': head, 'tailFrames': tail,
                          'headSeconds': head/fps, 'tailSeconds': tail/fps}
report = {'schemaVersion': 1, 'file': args.movie.name,
          'sha256': hashlib.sha256(args.movie.read_bytes()).hexdigest(),
          'size': size, 'fps': fps, 'frameCount': len(rows), 'reserve': args.reserve,
          'marginOrder': ['left','top','right','bottom'],
          'thresholdSummaries': summaries, 'emptyHandles': handles, 'frames': rows,
          'scope': 'All native OpenCV decoded pictures. Complete effect envelope and empty handles only; no typography, smoke material, sound, motion, transition or physical projection approval.'}
args.report.parent.mkdir(parents=True, exist_ok=True)
args.report.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({key: report[key] for key in ['file','frameCount','fps','size','thresholdSummaries','emptyHandles']}))
