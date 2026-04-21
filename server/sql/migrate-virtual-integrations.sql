-- Migracion: Integraciones de citas virtuales (Zoom + Correo)
-- Idempotente: se puede ejecutar varias veces sin romper datos existentes.

CREATE TABLE IF NOT EXISTS citas_virtuales (
  citaid INTEGER PRIMARY KEY,
  zoom_meeting_id VARCHAR(64),
  zoom_join_url TEXT,
  zoom_start_url TEXT,
  zoom_password VARCHAR(120),
  zoom_status VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (zoom_status IN ('pendiente', 'creada', 'actualizada', 'cancelada', 'error')),
  integration_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citaid) REFERENCES citas(citaid) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_virtuales_zoom_meeting_id
  ON citas_virtuales (zoom_meeting_id)
  WHERE zoom_meeting_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_citas_virtuales_zoom_status
  ON citas_virtuales (zoom_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS correos_cita (
  correoid SERIAL PRIMARY KEY,
  citaid INTEGER NOT NULL,
  destinatario VARCHAR(150) NOT NULL,
  tipo VARCHAR(20) NOT NULL
    CHECK (tipo IN ('confirmacion', 'reagenda', 'cancelacion', 'sistema')),
  asunto VARCHAR(255) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'enviado', 'error')),
  provider_message_id VARCHAR(255),
  intentos INTEGER NOT NULL DEFAULT 0,
  ultimo_error TEXT,
  enviado_en TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (citaid) REFERENCES citas(citaid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_correos_cita_citaid
  ON correos_cita (citaid, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_correos_cita_estado
  ON correos_cita (estado, updated_at DESC);
