-- Tabla de relacion psicologas-pacientes
-- Permite asociar multiples psicologas a un paciente y viceversa.

CREATE TABLE IF NOT EXISTS psicologas_pacientes (
  psicologaid INTEGER NOT NULL REFERENCES psicologas(psicologaid) ON DELETE CASCADE,
  pacienteid INTEGER NOT NULL REFERENCES pacientes(pacienteid) ON DELETE CASCADE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (psicologaid, pacienteid)
);

CREATE INDEX IF NOT EXISTS ix_psicologas_pacientes_paciente
  ON psicologas_pacientes (pacienteid);

-- Backfill recomendado con citas existentes
INSERT INTO psicologas_pacientes (psicologaid, pacienteid)
SELECT DISTINCT psicologaid, pacienteid
FROM citas
WHERE psicologaid IS NOT NULL AND pacienteid IS NOT NULL
ON CONFLICT DO NOTHING;
