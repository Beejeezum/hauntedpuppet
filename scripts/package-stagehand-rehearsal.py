"""Package existing Wisp frames for the private Stagehand console. No generation.

Fixed-size encoding only; no interpolating, fading, reversing or time warping.
This records provenance, not human approval of loop/action boundaries.
"""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = ROOT / 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
OUT = ROOT / 'source/attraction-v2/console/media'
BATCH = ROOT / 'source/wisp-performance-reference/button-cue-batch'
SOURCES = {
    'morph': (BATCH / 'wisp-morph-roundtrip-review-v7.mp4', '275acb319821ed88d9eda3220f6c9a61e59d484450537293588d601784de08dc'),
    'wave': (BATCH / 'resident-wave-study/resident-wave-pilot-v2.mp4', '8a49fef3218f040b1b8fb60271690b1c190ff5cb6ce0cb15afe41b45704db168'),
}
CUTS = [
    ('friendly', 'Watching the path', 'morph', 0, 122, 'friendly', 'friendly'),
    ('wave', 'A little hello', 'wave', 0, 121, 'friendly', 'friendly'),
    ('to-scary', 'Finding his spooky side', 'morph', 122, 121, 'friendly', 'scary'),
    ('scary', 'Keeping watch', 'morph', 243, 121, 'scary', 'scary'),
    ('to-cute', 'Back to his friendly self', 'morph', 364, 121, 'scary', 'friendly'),
    ('return', 'Settling back in', 'morph', 485, 122, 'friendly', 'friendly'),
]


def main():
    for path, expected in SOURCES.values():
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError('Source pin mismatch: ' + path.name)
    OUT.mkdir(parents=True, exist_ok=True)
    clips = []
    for name, label, source, start, count, entry, exit_form in CUTS:
        path, digest = SOURCES[source]
        args = [str(FFMPEG), '-v', 'error', '-y', '-i', str(path)]
        if source == 'wave':
            args += ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']
        # Identical fixed 85% framing for every source preserves their relative size.
        # The existing scary idle is the limiting smoke envelope (~15.6% bottom).
        picture = f'[0:v]trim=start_frame={start}:end_frame={start + count},setpts=PTS-STARTPTS,scale=1088:612:flags=lanczos,pad=1280:720:96:54:black,setsar=1[v]'
        audio = f'[{1 if source == "wave" else 0}:a]aresample=48000,atrim=start_sample={start * 2000}:end_sample={(start + count) * 2000},asetpts=PTS-STARTPTS[a]'
        target = OUT / (name + '.mp4')
        args += ['-filter_complex', picture + ';' + audio, '-map', '[v]', '-map', '[a]',
                 '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level:v', '3.1',
                 '-pix_fmt', 'yuv420p', '-r', '24', '-g', '24', '-keyint_min', '24', '-sc_threshold', '0',
                 '-video_track_timescale', '24000', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
                 '-movflags', '+frag_keyframe+delay_moov+default_base_moof', '-use_editlist', '1',
                 '-avoid_negative_ts', 'disabled', str(target)]
        subprocess.run(args, check=True)
        clips.append({'id': name, 'label': label, 'url': './media/' + target.name,
                      'frames': count, 'fps': 24, 'entry': entry, 'exit': exit_form,
                      'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'bytes': target.stat().st_size,
                      'source': str(path.relative_to(ROOT)), 'sourceSha256': digest, 'startFrame': start,
                      'status': 'rehearsal', 'sound': 'silent' if source == 'wave' else 'existing dry swishes'})
    subprocess.run([str(FFMPEG), '-v', 'error', '-y', '-i', str(OUT / 'friendly.mp4'),
                    '-frames:v', '1', str(OUT / 'poster.png')], check=True)
    report = {'schema': 1, 'status': 'private-rehearsal',
              'acceptance': 'Existing painted films. New wave and idle loop closures still need visual acceptance. No production admission.',
              'picture': 'Original frame order and timing. Identical fixed 85% framing, 1280x720 output, 96px horizontal / 54px vertical padding. No fades, interpolated frames, reversals or speed changes.',
              'sound': 'Original V7 dry effects. Wave intentionally silent. No new speech, choir or music.', 'clips': clips}
    (OUT / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Packaged {len(clips)} rehearsal clips; {sum(c["bytes"] for c in clips):,} bytes. Human join review remains open.')


if __name__ == '__main__':
    main()
