-- Control metadata only. No provider credentials, SDP, visitor audio or transcripts.
CREATE TABLE haunt_voice_stage_lease (
 stage text PRIMARY KEY,
 session_id uuid NOT NULL,
 nonce uuid NOT NULL,
 created_at timestamptz NOT NULL
);
