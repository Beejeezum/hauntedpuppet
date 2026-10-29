/** The speech adapters return complete PCM16 mono/stereo WAV payloads.
 * Parse those samples directly: a second media-file decoder is unnecessary.
 * AudioBufferSourceNode handles conversion to the context's output rate.
 */
export function decodePcmVoice(context,bytes,{maxSeconds=45,signal}={}){
 if(signal?.aborted)throw new DOMException('Voice preparation cancelled','AbortError');
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<44||bytes.byteLength>4800000||!Number.isFinite(maxSeconds)||maxSeconds<=0||maxSeconds>180)throw Error('Voice audio size is invalid');
 const view=new DataView(bytes),tag=at=>String.fromCharCode(...new Uint8Array(bytes,at,4)),streaming=size=>size>=0x7fff0000;
 if(tag(0)!=='RIFF'||tag(8)!=='WAVE')throw Error('Voice audio must be PCM WAV');
 const declared=view.getUint32(4,true),limit=streaming(declared)?bytes.byteLength:declared+8;
 if(limit<44||limit>bytes.byteLength)throw Error('Voice audio is incomplete');
 let format=null,data=null;
 for(let at=12;at+8<=limit;){
  const kind=tag(at),size=view.getUint32(at+4,true),start=at+8;
  const end=kind==='data'&&streaming(size)?limit:start+size;
  if(end>limit||end<start)throw Error('Voice audio chunk is incomplete');
  if(kind==='fmt '){
   if(size<16)throw Error('Voice audio format is incomplete');
   format={code:view.getUint16(start,true),channels:view.getUint16(start+2,true),rate:view.getUint32(start+4,true),byteRate:view.getUint32(start+8,true),align:view.getUint16(start+12,true),bits:view.getUint16(start+14,true)};
  }else if(kind==='data'&&!data)data={start,length:end-start};
  if(format&&data)break;
  at=end+(size&1);
 }
 if(!format||!data||format.code!==1||format.bits!==16||![1,2].includes(format.channels)||format.rate<8000||format.rate>96000||format.align!==format.channels*2||format.byteRate!==format.rate*format.align)throw Error('Voice audio must be PCM16 mono or stereo WAV');
 const frames=data.length/format.align;
 if(!Number.isInteger(frames)||!frames||frames/format.rate>maxSeconds)throw Error('Use a shorter voice line (45 seconds maximum)');
 const buffer=context.createBuffer(format.channels,frames,format.rate);
 for(let channel=0;channel<format.channels;channel++){
  const samples=buffer.getChannelData(channel);
  for(let frame=0;frame<frames;frame++)samples[frame]=view.getInt16(data.start+frame*format.align+channel*2,true)/32768;
 }
 if(signal?.aborted)throw new DOMException('Voice preparation cancelled','AbortError');
 return buffer;
}
