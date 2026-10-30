#!/usr/bin/env python3
"""Opt-in, at-most-two new voice auditions through the already-running private server.

No microphone, Keychain access, provider retry, live-cast change or audio playback.
A durable attempt marker prevents accidentally repeating paid requests.
"""
import argparse
import array
import base64
import hashlib
import io
import json
import math
from pathlib import Path
import time
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/wisp-casting-2026-10-30'
MARKER = DEST / 'openai-casting-attempts.json'
PROFILES = [
    dict(id='friendly-c', voice='marin', mood='amused', intensity=.65, speed=1,
         text='Oh! Hi! I was trying to be terrifying. Was it working?',
         instructions="An original tiny, friendly ghost doing a close-up animated-film acting audition. Speak to one visitor, not an audience. Light, youthful, warm and a little husky; a real character thinking as it speaks. 'Oh!' is a surprised intake, 'Hi!' a delighted smile. 'I was trying to be terrifying' is sheepish comic pride, with a small breathy chuckle in the pause. 'Was it working?' is a quick conspiratorial question, hopeful and unsure. One small thought per phrase. Natural varied rhythm, no announcer delivery. Dry intimate voice, no music, no echo, no singing, no additional words. Speak only the supplied text. Do not imitate a known character or performer."),
    dict(id='evil-c', voice='cedar', mood='sinister', intensity=.8, speed=1,
         text="Come a little closer. I've been waiting. Happy Halloween.",
         instructions="An original ancient ghost in a close-up animated-film acting audition. Dark chest resonance, textured living breath, an audible sly smile beneath the menace. Start 'Come a little closer' quietly, as a delicious invitation. Let a short silence become anticipation. 'I've been waiting' grows into a controlled rough creature rumble, not a scream. Then 'Happy Halloween' is a low, amused release, with a restrained little chuckle in the breath. Keep clear consonants and changing emotional intention, not a flat deep narration. Dry intimate performance: no music, echo, singing, extra words or imitation of a known actor or character. Speak only the supplied text."),
]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--authorize-two-short-paid-auditions', action='store_true')
    args = parser.parse_args()
    if not args.authorize_two_short_paid_auditions:
        parser.error('Explicit opt-in required. This is not a default regression test.')
    if MARKER.exists():
        parser.error('Attempt log already exists. Refusing an automatic paid retry.')
    base = 'http://127.0.0.1:8902'
    with urllib.request.urlopen(base + '/api/status', timeout=5) as response:
        status = json.load(response)
    if not status.get('configured') or status.get('mode') != 'direct':
        raise RuntimeError('Existing private direct voice service is not ready.')
    DEST.mkdir(parents=True, exist_ok=True)
    log = dict(provider='OpenAI through existing private laptop service',
               configuredServerModel='gpt-4o-mini-tts (server default; response does not echo model)',
               approval='Unapproved casting only; live profiles unchanged',
               noAutomaticRetry=True, runwayCredits=0, billedCostUSD=None, attempts=[])
    def save():
        MARKER.write_text(json.dumps(log, indent=2) + '\n')
    # Exclusive creation: an interruption must not silently retry a paid request.
    with MARKER.open('x') as file:
        json.dump(log, file, indent=2)
    for profile in PROFILES:
        item = dict(profile, attemptedUTC=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), status='started')
        log['attempts'].append(item)
        save()
        spec = {key: value for key, value in profile.items() if key != 'id'}
        request = urllib.request.Request(base + '/api/performance',
            data=json.dumps(dict(provider='openai', **spec)).encode(),
            headers={'Content-Type': 'application/json', 'Origin': base, 'X-Haunt-Token': status['token']})
        started = time.monotonic()
        try:
            with urllib.request.urlopen(request, timeout=85) as response:
                result = json.load(response)
            raw = base64.b64decode(result['audio'], validate=True)
            if not 10000 < len(raw) < 2000000:
                raise ValueError('Audition audio size outside short-sample limit')
            with wave.open(io.BytesIO(raw), 'rb') as wav:
                if wav.getsampwidth() != 2 or wav.getnchannels() != 1:
                    raise ValueError('Expected mono PCM16 voice')
                rate = wav.getframerate()
                samples = array.array('h', wav.readframes(rate * 31))
                duration = len(samples) / rate
            if not 1 < duration < 20:
                raise ValueError('Audition duration outside short-sample limit')
            file = DEST / (profile['id'] + '.wav')
            file.write_bytes(raw)
            rms = math.sqrt(sum(x*x for x in samples) / len(samples)) / 32768
            item.update(status='generated; human review pending', file=file.name,
                bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(), duration=duration,
                requestToCompleteMs=round(1000*(time.monotonic()-started)), cacheHit=result.get('cacheHit'),
                peak=max(abs(x) for x in samples)/32768, rmsDBFS=round(20*math.log10(rms), 2),
                clippedSamples=sum(abs(x) >= 32760 for x in samples), sampleRate=rate,
                processing='Unmodified provider WAV; no pitch, echo or music added')
            save()
            print(json.dumps({key:item[key] for key in ('id','voice','duration','requestToCompleteMs','cacheHit','clippedSamples','status')}), flush=True)
        except Exception as error:
            item['status'] = 'failed; no retry'
            item['errorType'] = type(error).__name__  # Never print response/header/credential content.
            save()
            raise RuntimeError('Short casting request failed; inspect non-secret attempt log.') from None

if __name__ == '__main__':
    main()
