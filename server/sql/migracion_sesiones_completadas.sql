ALTER TABLE Pacientes
ADD COLUMN IF NOT EXISTS SesionesCompletadas INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION fn_recalcular_sesiones_completadas(_paciente_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF _paciente_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE Pacientes p
  SET SesionesCompletadas = COALESCE(src.total, 0)
  FROM (
    SELECT c.pacienteid, COUNT(*)::int AS total
    FROM Citas c
    WHERE c.pacienteid = _paciente_id
      AND COALESCE(LOWER(TRIM(c.estado)), '') LIKE 'complet%'
    GROUP BY c.pacienteid
  ) src
  WHERE p.pacienteid = _paciente_id;

  UPDATE Pacientes p
  SET SesionesCompletadas = 0
  WHERE p.pacienteid = _paciente_id
    AND NOT EXISTS (
      SELECT 1
      FROM Citas c
      WHERE c.pacienteid = _paciente_id
        AND COALESCE(LOWER(TRIM(c.estado)), '') LIKE 'complet%'
    );
END;
$$;

CREATE OR REPLACE FUNCTION tg_sync_sesiones_completadas()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM fn_recalcular_sesiones_completadas(NEW.pacienteid);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.pacienteid IS DISTINCT FROM OLD.pacienteid THEN
      PERFORM fn_recalcular_sesiones_completadas(OLD.pacienteid);
      PERFORM fn_recalcular_sesiones_completadas(NEW.pacienteid);
    ELSE
      PERFORM fn_recalcular_sesiones_completadas(NEW.pacienteid);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM fn_recalcular_sesiones_completadas(OLD.pacienteid);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_sesiones_completadas ON Citas;
CREATE TRIGGER tr_sync_sesiones_completadas
AFTER INSERT OR UPDATE OF pacienteid, estado OR DELETE ON Citas
FOR EACH ROW
EXECUTE FUNCTION tg_sync_sesiones_completadas();

UPDATE Pacientes p
SET SesionesCompletadas = COALESCE(src.total, 0)
FROM (
  SELECT c.pacienteid, COUNT(*)::int AS total
  FROM Citas c
  WHERE COALESCE(LOWER(TRIM(c.estado)), '') LIKE 'complet%'
  GROUP BY c.pacienteid
) src
WHERE p.pacienteid = src.pacienteid;

UPDATE Pacientes
SET SesionesCompletadas = 0
WHERE SesionesCompletadas IS NULL;
