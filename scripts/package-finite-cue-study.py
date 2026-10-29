#!/usr/bin/env python3
"""Package pinned painted study cuts without re-encoding their video frames."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
RECIPE = ROOT / 'source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/packaging-review.json'
PCM_SHA = '86754e2687af3ff6ed5ca076f60b05b9fa86f6d5a0ea95badf4c825b0c4c858c'


def run(ffmpeg, *args):
    subprocess.run([ffmpeg, '-v', 'error', '-n', *map(str, args)], check=True)


def decoded(ffmpeg, *args):
    process = subprocess.Popen([ffmpeg, '-v', 'error', *map(str, args), '-an', '-vsync', '0', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1'], stdout=subprocess.PIPE)
    digest, size = hashlib.sha256(), 0
    while True:
        data = process.stdout.read(1024 * 1024)
        if not data:
            break
        digest.update(data)
        size += len(data)
    if process.wait():
        raise RuntimeError('Native source decode failed')
    return {'sha256': digest.hexdigest(), 'bytes': size, 'frames': size // (1280 * 720 * 3)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg', required=True)
    parser.add_argument('--pcm', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    if ROOT / 'work' not in output.parents or output.exists():
        raise ValueError('Output must be a new folder under repository work/')
    recipe = json.loads(RECIPE.read_text())
    source = ROOT / recipe['source']
    if hashlib.sha256(source.read_bytes()).hexdigest() != recipe['sourceSha256']:
        raise ValueError('Source painting/movie pin mismatch')
    with wave.open(str(args.pcm), 'rb') as pcm:
        if (pcm.getnchannels(), pcm.getsampwidth(), pcm.getframerate()) != (2, 2, 48000):
            raise ValueError('Expected original 48k stereo 16-bit PCM')
        digest = hashlib.sha256()
        while True:
            data = pcm.readframes(48000)
            if not data:
                break
            digest.update(data)
        if digest.hexdigest() != PCM_SHA:
            raise ValueError('Original authoring PCM pin mismatch')
    output.mkdir(parents=True)
    results = []
    with tempfile.TemporaryDirectory(prefix='finite-', dir=output) as temporary:
        temporary = Path(temporary)
        for cue in recipe['cues']:
            name, start, count = cue['id'], cue['startFrame'], cue['frames']
            if not name.replace('-', '').isalnum() or cue['fps'] != 24 or not all(isinstance(x, int) and x >= 0 for x in [start, count]) or not count:
                raise ValueError('Invalid pinned cut')
            video, audio = temporary / 'video.mp4', temporary / 'audio.wav'
            if video.exists():
                video.unlink()
            run(args.ffmpeg, '-ss', start / 24, '-i', source, '-map', '0:v:0', '-frames:v', count, '-c:v', 'copy', '-an', video)
            with wave.open(str(args.pcm), 'rb') as pcm:
                pcm.setpos(start * 2000)
                samples = pcm.readframes(count * 2000)
                if len(samples) != count * 2000 * 4:
                    raise ValueError('Original PCM shorter than cue')
                with wave.open(str(audio), 'wb') as target:
                    target.setparams(pcm.getparams())
                    target.writeframes(samples)
            target = output / (name + '.mp4')
            # Delay moov until stream starts are known so single edit lists can
            # express video reordering and AAC priming without negative CTS.
            run(args.ffmpeg, '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+frag_keyframe+delay_moov+default_base_moof', '-use_editlist', '1', '-avoid_negative_ts', 'disabled', target)
            original = decoded(args.ffmpeg, '-i', source, '-vf', f'select=between(n\\,{start}\\,{start + count - 1})')
            packaged = decoded(args.ffmpeg, '-i', target)
            if original != packaged or packaged['frames'] != count:
                target.unlink()
                raise ValueError('Packaged frames differ from original; output rejected')
            results.append({**cue, 'compressedAssetSha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'decoded': packaged})
    review = {**recipe, 'status': 'private edit-list packaging candidate; browser/human acceptance separate', 'audio': 'AAC from pinned original PCM; single edit lists express AAC priming. Native browser timing still requires validation.', 'flags': '+frag_keyframe+delay_moov+default_base_moof; use_editlist=1; avoid_negative_ts=disabled', 'pcmSamplesSha256': PCM_SHA, 'cues': results}
    (output / 'packaging-review.json').write_text(json.dumps(review, indent=2) + '\n')
    print(f'Packaged {len(results)} pinned cuts; every decoded frame exactly matches original. Not runtime approval.')


if __name__ == '__main__':
    main()
