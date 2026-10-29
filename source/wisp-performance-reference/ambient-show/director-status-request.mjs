/** Explicit status-only transport experiment. No retries or provider requests.
 * Fixed same-origin endpoint; never expose the returned token in diagnostics. */
export function readDirectorStatus(signal,{timeoutMs=8000}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<10||timeoutMs>10000)throw Error('Invalid status deadline');
 return new Promise((resolve,reject)=>{
  const request=new XMLHttpRequest();let settled=false;
  const cleanup=()=>{signal?.removeEventListener('abort',cancel);request.onload=request.onerror=request.onabort=request.ontimeout=request.onprogress=null;};
  const finish=(error,value)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve(value);};
  const cancel=()=>{finish(signal?.reason||new DOMException('Status request cancelled','AbortError'));request.abort();};
  if(signal?.aborted){cancel();return;}
  request.open('GET','/api/status');request.timeout=timeoutMs;
  request.onerror=()=>finish(Error('Laptop voice status is unavailable'));
  request.onabort=()=>finish(new DOMException('Status request cancelled','AbortError'));
  request.ontimeout=()=>finish(new DOMException('Laptop voice status timed out','TimeoutError'));
  request.onprogress=event=>{if(event.loaded>65536){finish(Error('Laptop voice status is too large'));request.abort();}};
  request.onload=()=>{
   if(request.status<200||request.status>=300){finish(Error('Sign in to the laptop voice service first'));return;}
   if(request.responseText.length>65536){finish(Error('Laptop voice status is too large'));return;}
   try{const value=JSON.parse(request.responseText);if(!value||typeof value!=='object'||Array.isArray(value))throw Error();finish(null,value);}catch{finish(Error('Laptop voice status is invalid'));}
  };
  signal?.addEventListener('abort',cancel,{once:true});
  try{request.send();}catch{finish(Error('Laptop voice status could not be requested'));}
 });
}
