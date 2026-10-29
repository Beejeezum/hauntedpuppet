import config from '../../director-script-config.json' with {type:'json'};
import {ApiError} from './operator-auth.mjs';
export function validateDirectorLine(data){
 if(!data||Object.keys(data).sort().join(',')!=='character,mode,text'||!['friendly','scary'].includes(data.character)||!['exact','prompt'].includes(data.mode)||typeof data.text!=='string'||!data.text.trim()||[...data.text].length>config.maxInputCharacters||/[\u0000-\u0008\u000b-\u001f]/.test(data.text))throw new ApiError(400,'Choose a character and enter up to 400 characters.');
 return data;
}
export async function directorLine(data,{key,fetchImpl=fetch,signal,model=config.model}={}){
 validateDirectorLine(data);
 if(data.mode==='exact')return{text:data.text,mode:data.mode,character:data.character};
 if(!key)throw new ApiError(503,'Configure the server-side OpenAI key to improvise a line.');
 const timeout=AbortSignal.timeout(18000),requestSignal=signal?AbortSignal.any([signal,timeout]):timeout;
 let response;try{response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,instructions:config.instructions+' '+config.characters[data.character],input:data.text,max_output_tokens:100}),signal:requestSignal});}catch{throw new ApiError(502,'Wisp could not prepare that line. Try again.');}
 if(!response.ok)throw new ApiError(response.status===429?429:502,'Wisp could not improvise that line. Check the voice service or try exact words.');
 let result;try{result=await response.json();}catch{throw new ApiError(502,'Wisp received an incomplete line. Try exact words.');}
 const text=(Array.isArray(result?.output)?result.output:[]).filter(item=>item?.type==='message'&&item.role==='assistant').flatMap(item=>Array.isArray(item.content)?item.content:[]).filter(part=>part?.type==='output_text'&&typeof part.text==='string').map(part=>part.text).join(' ').trim().replace(/\s+/g,' ');
 if(requestSignal.aborted)throw new ApiError(409,'Line preparation was cancelled.');
 if(result.status!=='completed'||!text||[...text].length>config.maxOutputCharacters||text.split(/\s+/).length>config.maxOutputWords||/[\u0000-\u001f]/.test(text))throw new ApiError(502,'Wisp did not produce a complete short line. Try a simpler direction or exact words.');
 return{text,mode:data.mode,character:data.character};
}
