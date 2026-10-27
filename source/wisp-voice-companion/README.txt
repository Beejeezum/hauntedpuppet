Wisp laptop voice toolkit — experimental integration

This is a local companion for Voice Studio inside the painted Wisp Puppet app, not a sample player. The browser owns capture and speakers. The companion receives bounded PCM chunks over a loopback-only connection and returns neural conversion. It never opens a microphone, records audio, reads an API key or contacts a speech provider. Initial setup downloads public dependencies/models.

1. Unzip this folder and open Launch Wisp Voice.command. Python3.12 is required. The launcher uses the existing Codex Python when available, otherwise an installed Python3.12. First setup requires5GB free and downloads roughly2GB of runtime/model files into ~/Library/Caches/HauntedPuppet/voice-runtime. Preserve free working space. WISP_VOICE_WORK_DIR can select a different runtime folder when launching from a terminal.
2. Wait for the terminal to print Voice toolkit ready. Leave it open during the show.
3. In the Wisp live Puppet page, select Neural character conversion, Check toolkit connection, choose a microphone and voice, then Start microphone. Hear my voice remains explicit. Headphones help with rehearsal; your projector and phone are silent.
4. Adjust Mouth sync to match converted speech. Processing/round-trip metrics exclude capture/playback buffers and do not establish acoustic latency. On failure, raw voice never becomes audible automatically.
5. Stop microphone or Blackout stops browser capture and closes the connection. Close the companion terminal when done to release model memory. A short in-flight model chunk may finish after disconnect; its output is discarded.

Voice casting remains an audition. Cute reference is extracted from the previously approved fictional apology performance. Dark reference is fictional Kokoro am_fenrir speech. No operator/visitor recording is bundled. These presets are not a fully art-directed character-voice library.

Technology: official Plachtaa/seed-vc, pinned source51383efd921027683c89e5348211d93ff12ac2a8, tiny XLSR/HIFT22.05kHz model. Four diffusion steps, CFG0, 200ms input blocks at16kHz, two-second reference, one-second left context, 40ms SOLA overlap,60ms playback jitter reserve. Tested earlier on M4 Pro with synthetic speech; physical loopback and sustained show testing remain acceptance requirements.
https://github.com/Plachtaa/seed-vc

The Python companion adapter is GPL-3.0-only; upstream license is included as LICENSE-Seed-VC. The independent browser transport communicates with it locally. Requirements are pinned for reproducibility. Alternatives researched: w-okada/voice-changer and tizee/rvc-mlx-realtime. Neither was assumed faster or higher quality without a measured comparison. The latter also needs suitable trained RVC voice models.

Optional voice references: In Neural mode, select a short PCM16 WAV for the selected cute/dark slot. The companion validates duration/size and prepares it locally in memory with the microphone stopped. It is not uploaded to a cloud service or saved in the show library. Restarting the companion restores bundled defaults.
