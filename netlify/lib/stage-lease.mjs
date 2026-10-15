/** Atomic single-stage ownership. Conditional release cannot delete a newer owner. */
export function stageLease(db,now=()=>Date.now()){
 return{
  async claim(sid,nonce){const rows=await db.sql`INSERT INTO haunt_voice_stage_lease (stage,session_id,nonce,created_at) VALUES ('painted-wisp',${sid},${nonce},${new Date(now()).toISOString()}) ON CONFLICT (stage) DO NOTHING RETURNING nonce`;return rows.length===1},
  async markCall(sid,nonce,callId){await db.sql`UPDATE haunt_voice_stage_lease SET provider_call_id=${callId} WHERE stage='painted-wisp' AND session_id=${sid} AND nonce=${nonce}`},
  async release(sid,nonce){await db.sql`DELETE FROM haunt_voice_stage_lease WHERE stage='painted-wisp' AND session_id=${sid} AND nonce=${nonce}`},
  async current(){const rows=await db.sql`SELECT session_id,nonce,created_at,provider_call_id FROM haunt_voice_stage_lease WHERE stage='painted-wisp'`;return rows[0]?{sid:rows[0].session_id,nonce:rows[0].nonce,callId:rows[0].provider_call_id,at:new Date(rows[0].created_at).getTime()}:null}
 };
}
