const picture=document.querySelector('#picture'),status=document.querySelector('#status'),metrics=document.querySelector('#metrics'),connect=document.querySelector('#connect');
let room=null,epoch=0,frameCallback=null,timeout=null,frames=0,lastFrame=0,started=0,videoTrack=null;
function clear(){if(frameCallback!==null)picture.cancelVideoFrameCallback?.(frameCallback);frameCallback=null;picture.pause();videoTrack?.detach(picture);videoTrack=null;picture.srcObject=null;picture.removeAttribute('src');picture.load();}
function stop(message='Stopped · black · silent'){++epoch;clearTimeout(timeout);clear();const previous=room;room=null;previous?.disconnect();status.textContent=message;connect.disabled=false;}
function blackout(message){stop(message);fetch('/stop',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',keepalive:true}).catch(()=>{});}
function receive(track,ticket){if(ticket!==epoch||track.kind!==LivekitClient.Track.Kind.Video)return;clear();videoTrack=track;track.attach(picture);picture.muted=true;picture.play().catch(()=>stop('Playback unavailable · stopped'));
 const frame=()=>{if(ticket!==epoch)return;frames++;lastFrame=performance.now();metrics.textContent=frames+' frames received · '+Math.round(lastFrame-started)+' ms since connect';frameCallback=picture.requestVideoFrameCallback(frame);};
 if(picture.requestVideoFrameCallback)frameCallback=picture.requestVideoFrameCallback(frame);status.textContent='Receiving character · silent';}
async function begin(){stop();const ticket=++epoch;frames=0;lastFrame=0;started=performance.now();connect.disabled=true;status.textContent='Connecting · no input devices';
 try{const response=await fetch('/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store'});if(!response.ok)throw Error('Connection unavailable');const config=await response.json();if(ticket!==epoch)return;const owned=new LivekitClient.Room({adaptiveStream:true});room=owned;
  owned.on(LivekitClient.RoomEvent.TrackSubscribed,track=>receive(track,ticket));
  owned.on(LivekitClient.RoomEvent.TrackUnsubscribed,track=>{if(ticket===epoch&&track===videoTrack){clear();status.textContent='Character stream ended · black';}});
  owned.on(LivekitClient.RoomEvent.Disconnected,()=>{if(ticket===epoch)stop('Disconnected · black · silent');});
  // No local track, publishing, device enumeration or audio attachment.
  await owned.connect(config.url,config.token,{autoSubscribe:true});if(ticket!==epoch){owned.disconnect();return;}
  const ready=await fetch('/ready',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!ready.ok)throw Error('Pilot unavailable');if(ticket!==epoch)return;
  if(!videoTrack)status.textContent='Connected · waiting for character · silent';timeout=setTimeout(()=>blackout('Pilot window ended · black'),35000);
 }catch{if(ticket===epoch)stop('Connection unavailable · stopped');}}
const watchdog=setInterval(()=>{if(videoTrack&&lastFrame&&performance.now()-lastFrame>1500){blackout('Frames stalled · black · pilot stopped');}},250);
connect.onclick=begin;document.querySelector('#stop').onclick=()=>blackout();document.addEventListener('keydown',event=>{if(event.key==='Escape')blackout();});window.addEventListener('pagehide',()=>{blackout();clearInterval(watchdog);});window.WispNativeViewer={inspect:()=>({connected:!!room,frames,silent:picture.muted,hasVideo:!!picture.srcObject,epoch}),stop};
