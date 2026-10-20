"""Review existing fictional Wisp footage; creates diagnostics, never retouches artwork.
Requires Python, numpy, OpenCV and Pillow. Usage: input.mp4 output-prefix
Bounds cover decoded RGB envelopes, not semantic anatomy or projection acceptance.
"""
import argparse, hashlib, json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('input', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--reserve', type=float, default=.15)
parser.add_argument('--loop-review', action='store_true', help='Add endpoint motion diagnostics and unblended seam contact sheet')
args = parser.parse_args()
if not 0 <= args.reserve < .5:
    parser.error('reserve must be between zero and one half')
cap = cv2.VideoCapture(str(args.input))
if not cap.isOpened():
    parser.error('Cannot decode input film')
fps = cap.get(cv2.CAP_PROP_FPS)
rows, thumbs, previous, first, last, differences = [], [], None, None, None, []
while True:
    ok, frame = cap.read()
    if not ok:
        break
    h, w = frame.shape[:2]
    light = frame.max(axis=2)
    envelopes = {}
    for threshold in (4, 8, 16):
        y, x = np.where(light > threshold)
        if not len(x):
            envelopes[str(threshold)] = {'empty': True}
            continue
        margins = [float(x.min()/w), float(y.min()/h), float((w-1-x.max())/w), float((h-1-y.max())/h)]
        envelopes[str(threshold)] = {'empty': False, 'marginsLTRB': margins,
            'reservePass': min(margins) >= args.reserve,
            'boundsXYXY': [int(x.min()), int(y.min()), int(x.max()+1), int(y.max()+1)],
            'visibleFraction': float(len(x)/(w*h))}
    # Letterbox diagnostic thumbnails: portrait/squarer avatar outputs must not look stretched.
    fit = min(480/w, 270/h)
    tw, th = max(1, round(w*fit)), max(1, round(h*fit))
    thumb = np.zeros((270, 480, 3), dtype=np.uint8)
    tx, ty = (480-tw)//2, (270-th)//2
    thumb[ty:ty+th, tx:tx+tw] = cv2.resize(frame, (tw, th), interpolation=cv2.INTER_AREA)
    if previous is not None:
        mask = (previous.max(axis=2) > 16) | (thumb.max(axis=2) > 16)
        differences.append(float(np.abs(previous.astype(float)-thumb.astype(float))[mask].mean()) if mask.any() else 0.)
    if first is None:
        first = thumb.copy()
    last = thumb
    previous = thumb
    thumbs.append(thumb)
    rows.append({'frame': len(rows), 'seconds': len(rows)/fps if fps else None, 'maximumDecodedRGB': int(light.max()), 'envelopes': envelopes})
cap.release()
if not rows:
    parser.error('Input has no decoded frames')
summary = {}
for threshold in ('4', '8', '16'):
    visible = [r['envelopes'][threshold] for r in rows if not r['envelopes'][threshold]['empty']]
    summary[threshold] = {'emptyFrames': sum(r['envelopes'][threshold]['empty'] for r in rows),
        'reserveFailures': sum(not e['reservePass'] for e in visible),
        'minimumMarginsLTRB': np.min([e['marginsLTRB'] for e in visible], axis=0).tolist() if visible else None}
mask = (first.max(axis=2) > 16) | (last.max(axis=2) > 16)
empty_tail = {}
for threshold in (0, 4, 8, 16):
    count = 0
    for row in reversed(rows):
        if row['maximumDecodedRGB'] > threshold:
            break
        count += 1
    empty_tail[str(threshold)] = {'frames': count, 'seconds': count/fps if fps else None}
report = {'schemaVersion': 3, 'marginOrder': ['left', 'top', 'right', 'bottom'], 'file': args.input.name, 'sha256': hashlib.sha256(args.input.read_bytes()).hexdigest(),
    'frameCount': len(rows), 'fps': fps, 'size': [w, h], 'reserve': args.reserve,
    'thresholdSummaries': summary, 'emptyTailByMaximumDecodedRGB': empty_tail, 'adjacentVisibleRGBMedian': float(np.median(differences)) if differences else None,
    'endpointVisibleRGBDifference': float(np.abs(first.astype(float)-last.astype(float))[mask].mean()) if mask.any() else 0.,
    'scope': 'Decoded RGB bounds and thumbnails only. Empty frames are diagnostics: inspect intentional vanishing separately. Does not prove anatomy, velocity continuity, camera lock, depth, voice, human approval or physical projection.',
    'frames': rows}
if args.loop_review and len(thumbs) >= 4:
    # Pixel differences expose a jump or near-hold; they do not infer skeletal velocity.
    first_step = thumbs[1].astype(float)-thumbs[0].astype(float)
    last_step = thumbs[-1].astype(float)-thumbs[-2].astype(float)
    moving = np.logical_or.reduce([t.max(axis=2)>16 for t in (thumbs[0],thumbs[1],thumbs[-2],thumbs[-1])])
    adjacent = report['adjacentVisibleRGBMedian']
    middle = differences[len(differences)//4:3*len(differences)//4]
    report['loopDiagnostics'] = {
        'seamToAdjacentRatio': report['endpointVisibleRGBDifference']/adjacent if adjacent else None,
        'last12MedianRGBStep': float(np.median(differences[-12:])),
        'middleMedianRGBStep': float(np.median(middle)) if middle else None,
        'endpointStepDifferenceRGB': float(np.abs(first_step-last_step)[moving].mean()) if moving.any() else 0.,
        'scope': 'Unmodified letterboxed samples and pixel differences, not optical-flow/joint velocity, automatic loop approval or human smoothness acceptance.'}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.with_suffix('.json').write_text(json.dumps(report, indent=2)+'\n')
sheet = Image.new('RGB', (1440, 3*302), '#16161b')
draw = ImageDraw.Draw(sheet)
for cell, index in enumerate(np.linspace(0, len(rows)-1, 9).astype(int)):
    x, y = (cell%3)*480, (cell//3)*302
    sheet.paste(Image.fromarray(cv2.cvtColor(thumbs[index], cv2.COLOR_BGR2RGB)), (x, y))
    draw.text((x+8, y+276), f'Frame {index} | {index/fps:.2f}s' if fps else f'Frame {index}', fill='white')
sheet.save(args.output.with_suffix('.png'))
if args.loop_review:
    seam = Image.new('RGB', (1920, 604), '#16161b')
    text = ImageDraw.Draw(seam)
    indices = list(range(max(0,len(thumbs)-4),len(thumbs)))+list(range(min(4,len(thumbs))))
    for cell,index in enumerate(indices):
        x,y=(cell%4)*480,(cell//4)*302
        seam.paste(Image.fromarray(cv2.cvtColor(thumbs[index],cv2.COLOR_BGR2RGB)),(x,y))
        cycle='Ending' if cell<min(4,len(thumbs)) else 'Next beginning'
        text.text((x+8,y+276),f'{cycle} | frame {index}',fill='white')
    seam.save(args.output.with_name(args.output.name+'-seam').with_suffix('.png'))

print(json.dumps({k:v for k,v in report.items() if k != 'frames'}, indent=2))
