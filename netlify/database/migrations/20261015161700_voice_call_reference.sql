-- Retain a recovery reference if object storage fails after upstream creation.
ALTER TABLE haunt_voice_stage_lease ADD COLUMN provider_call_id text;
