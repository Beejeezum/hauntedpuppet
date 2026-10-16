const {spawnSync}=require('node:child_process');
const path=require('node:path');
const suites=['wisp_3d_resources.cjs','wisp_3d_continuity.cjs','wisp_3d_deformation.cjs','wisp_3d_browser.cjs','scary_surface_envelope.cjs','fluid_performance.cjs','live_rig.cjs','face_tracker.cjs','character_workshop.cjs','spirit_atmosphere.cjs','apparition_performance.cjs','wisp_face_acting.cjs','tail_cels.cjs','morph_sprites.cjs','puppeteer_voice.cjs','performance_deck.cjs','performance_deck_controls.cjs','performance_remote.cjs','performance_live.cjs','voice_preview.cjs','wisp_operator_choreography.cjs','scary_wisp.cjs','wisp_choreography_browser.cjs','projector_ownership.cjs','puppet_monitor.cjs','form_integration.cjs','doorstep_performance.cjs','costume_board.cjs','connection_health.cjs','key_dialog_ui.cjs','forget_key.cjs','casting.cjs','attract.cjs','realtime_microphone_errors.cjs','realtime_events.cjs','realtime_failures.cjs','wisp.cjs','wisp_resilience.cjs','microphone.cjs','realtime_browser.cjs','phone_browser.cjs','phone_cue_errors.cjs','accessibility.cjs','realtime_timeouts.cjs','realtime_reactions.cjs','cloud_browser.cjs','projection_browser.cjs','cloud_remote_browser.mjs'];
for(const suite of suites){
 const file=path.join(__dirname,'..','tests',suite);
 if(!require('node:fs').existsSync(file))throw Error('Required regression suite missing: '+suite);
 const result=spawnSync(process.execPath,[file],{stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status||1);
}
