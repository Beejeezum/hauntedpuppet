#!/usr/bin/env python3
"""Two bounded original VoiceDesign takes. Offline, file-only; never plays audio.

Use the isolated MLX environment documented in the local casting record. This is
an experiment, not an app voice adapter or an endorsement of either performance.
"""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import signal
import time
import wave


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--run-two-local-takes', action='store_true')
    args = parser.parse_args()
    if not args.run_two_local_takes:
        parser.error('Explicit --run-two-local-takes is required. No automatic retry.')
    if not (args.model / 'model.safetensors').is_file():
        parser.error('A complete local pinned model is required; no download here.')
    args.output.mkdir(parents=True, exist_ok=True)
    # Exclusive reservation prevents accidental bulk/repeated auditions.
    with (args.output / 'attempt.json').open('x') as marker:
        json.dump({'startedUTC': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                   'maximumTakes': 2, 'paidCalls': 0}, marker)
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'
    import mlx.core as mx
    import numpy as np
    from mlx_audio.tts.utils import load_model

    def timeout(_signal, _frame):
        raise TimeoutError('Bounded local audition exceeded 120 seconds')
    signal.signal(signal.SIGALRM, timeout)
    mx.set_memory_limit(8 * 2**30)
    mx.set_cache_limit(256 * 2**20)
    report = {
        'model': 'mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-4bit',
        'revision': '5c390979e4b93af5f2932f90742ca99c7dd04687',
        'approval': 'Unapproved original synthetic casting; not installed live',
        'paidCalls': 0, 'hardwarePlayback': False,
        'versions': {p: importlib.metadata.version(p) for p in
                     ['mlx-audio', 'mlx', 'transformers', 'numpy']},
        'takes': [],
    }
    settings = dict(language='English', temperature=.8, top_k=50, top_p=1,
                    repetition_penalty=1.05, max_tokens=180,
                    stream=True, streaming_interval=.32, verbose=False)
    report['settings'] = settings
    takes = [
        ('friendly-d', "Oh! Hi! I was trying to be terrifying. Was it working?",
         'An original tiny male ghost with a youthful, light, airy voice, warm '
         'husky texture and bright clear consonants. A nimble mischievous little '
         'character with a smile in his breath, not a baby or announcer. Surprise '
         'on Oh, delighted Hi, then sheepish comic pride and a quick hopeful '
         'question. Intimate conversational English, varied natural timing. '
         'Dry voice, no music, no echo, no imitation of a real actor or known character.', 431),
        ('evil-d', "Come a little closer. I've been waiting. Happy Halloween.",
         'An original male ghost creature speaking English. Deep smoky chest '
         'resonance with rough gravel at the edges, living breath and crisp '
         'consonants. Quiet conspiratorial invitation grows into a controlled '
         'sinister rumble, then releases into a sly amused smile. Deliberate pauses '
         'and changing intent, not a flat narrator or yelling. A theatrical '
         'mischievous spirit enjoying being frightening. Dry intimate voice, no '
         'music, no echo, no imitation of a real actor or known character.', 839),
    ]
    try:
        signal.alarm(120)
        start = time.perf_counter()
        model = load_model(args.model.resolve(), strict=True)
        report['loadSeconds'] = round(time.perf_counter() - start, 4)
        for name, text, instruct, seed in takes:
            signal.alarm(120)
            mx.random.seed(seed)
            row = {'id': name, 'text': text, 'instructions': instruct, 'seed': seed,
                   'chunks': [], 'status': 'running'}
            report['takes'].append(row)
            start = time.perf_counter()
            chunks = []
            previous_samples = 0
            required_buffer = 0
            for result in model.generate_voice_design(text=text, instruct=instruct, **settings):
                data = np.asarray(result.audio, dtype=np.float32).reshape(-1)
                arrived = time.perf_counter() - start
                rate = result.sample_rate
                assert rate == 24000 and np.isfinite(data).all()
                required_buffer = max(required_buffer, arrived - previous_samples / rate)
                row['chunks'].append({'arrivalSeconds': round(arrived, 4),
                                      'samples': int(data.size),
                                      'peak': float(np.max(np.abs(data), initial=0))})
                chunks.append(data)
                previous_samples += data.size
                if previous_samples > 15 * rate:
                    raise ValueError('Unexpectedly long local audition')
            total = time.perf_counter() - start
            audio = np.concatenate(chunks)
            assert audio.size > 24000
            path = args.output / (name + '.wav')
            clipped = int(np.count_nonzero(np.abs(audio) >= 1))
            with wave.open(str(path), 'wb') as writer:
                writer.setnchannels(1); writer.setsampwidth(2); writer.setframerate(rate)
                writer.writeframes((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())
            row.update(status='generated, human review pending', file=path.name,
                       durationSeconds=round(audio.size/rate, 4),
                       totalSeconds=round(total, 4),
                       firstChunkSeconds=row['chunks'][0]['arrivalSeconds'],
                       minimumObservedGaplessStartSeconds=round(required_buffer, 4),
                       peak=float(np.max(np.abs(audio))), clippedSamples=clipped,
                       rmsDBFS=round(float(20*np.log10(np.sqrt(np.mean(audio**2)))), 2),
                       sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                       peakMLXMemoryBytes=mx.get_peak_memory())
            print(json.dumps({k: row[k] for k in ['id','durationSeconds','totalSeconds',
                 'firstChunkSeconds','minimumObservedGaplessStartSeconds','peak']}), flush=True)
            (args.output/'report.json').write_text(json.dumps(report, indent=2))
            mx.clear_cache()
    except Exception as exc:
        report['failure'] = type(exc).__name__ + ': ' + str(exc)
        raise
    finally:
        signal.alarm(0)
        report['finishedUTC'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        (args.output/'report.json').write_text(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
