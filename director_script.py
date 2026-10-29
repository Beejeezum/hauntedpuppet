"""Short operator-directed lines; no storage, microphone or browser provider key."""
import json, urllib.request
from pathlib import Path
CONFIG=json.loads(Path(__file__).with_name('director-script-config.json').read_text())
def line(data, key, request=None):
    if (not isinstance(data,dict) or set(data)!={'text','mode','character'} or data.get('mode') not in ('exact','prompt')
        or data.get('character') not in ('friendly','scary') or not isinstance(data.get('text'),str)
        or not data['text'].strip() or len(data['text'])>CONFIG['maxInputCharacters']
        or any(ord(c)<32 and c not in '\n\t' for c in data['text'])):
        raise ValueError('Choose a character and enter up to 400 characters.')
    if data['mode']=='exact':return dict(data)
    if not key:raise ValueError('Connect the laptop OpenAI service to improvise a line.')
    payload=dict(model=CONFIG['model'],store=False,instructions=CONFIG['instructions']+' '+CONFIG['characters'][data['character']],input=data['text'],max_output_tokens=100)
    req=urllib.request.Request('https://api.openai.com/v1/responses',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
    if request:result=request(req)
    else:
        with urllib.request.urlopen(req,timeout=18) as response:result=json.load(response)
    parts=[part.get('text','') for item in result.get('output',[]) if isinstance(item,dict) and item.get('type')=='message' and item.get('role')=='assistant' for part in item.get('content',[]) if isinstance(part,dict) and part.get('type')=='output_text' and isinstance(part.get('text'),str)]
    text=' '.join(' '.join(parts).split())
    if result.get('status')!='completed' or not text or len(text)>CONFIG['maxOutputCharacters'] or len(text.split())>CONFIG['maxOutputWords']:
        raise ValueError('Wisp did not produce a complete short line. Try exact words.')
    return dict(text=text,mode=data['mode'],character=data['character'])
