CREATE TABLE haunt_remote_rooms (
 id uuid PRIMARY KEY,
 enabled boolean NOT NULL DEFAULT false,
 generation integer NOT NULL DEFAULT 1,
 owner_client text,
 owner_until timestamptz,
 pairing_hash text,
 pairing_until timestamptz,
 heartbeat_at timestamptz,
 state_at timestamptz,
 state jsonb NOT NULL DEFAULT '{}'::jsonb,
 cues jsonb NOT NULL DEFAULT '[]'::jsonb,
 preview text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE haunt_remote_phones (
 id uuid PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES haunt_remote_rooms(id) ON DELETE CASCADE,
 generation integer NOT NULL,
 expires_at timestamptz NOT NULL,
 seen_at timestamptz NOT NULL,
 rate_start timestamptz,
 rate_count integer NOT NULL DEFAULT 0
);
CREATE INDEX haunt_remote_phones_room ON haunt_remote_phones(room_id,expires_at);
CREATE TABLE haunt_remote_attempts (
 room_id uuid NOT NULL REFERENCES haunt_remote_rooms(id) ON DELETE CASCADE,
 source_hash text NOT NULL,
 window_start timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 PRIMARY KEY(room_id,source_hash)
);
CREATE TABLE haunt_remote_commands (
 seq bigserial PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES haunt_remote_rooms(id) ON DELETE CASCADE,
 generation integer NOT NULL,
 phone_id uuid NOT NULL REFERENCES haunt_remote_phones(id) ON DELETE CASCADE,
 command_id uuid NOT NULL,
 command text NOT NULL,
 value jsonb,
 status text NOT NULL CHECK(status IN ('queued','claimed','applied','failed','expired','cancelled')),
 created_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 UNIQUE(room_id,generation,phone_id,command_id)
);
CREATE INDEX haunt_remote_commands_queue ON haunt_remote_commands(room_id,generation,status,seq);
