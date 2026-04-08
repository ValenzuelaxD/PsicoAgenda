-- Limpiar triggers conflictivos que causaban decrementos incorrectos
DROP TRIGGER IF EXISTS tr_sync_sesiones_completadas ON Citas;
DROP FUNCTION IF EXISTS tg_sync_sesiones_completadas() CASCADE;
DROP FUNCTION IF EXISTS fn_recalcular_sesiones_completadas(INTEGER) CASCADE;

-- Recalcular sesiones completadas una sola vez (backfill)
UPDATE Pacientes p
SET SesionesCompletadas = COALESCE(src.total, 0)
FROM (
  SELECT c.pacienteid, COUNT(*)::int AS total
  FROM Citas c
  WHERE COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
  GROUP BY c.pacienteid
) src
WHERE p.pacienteid = src.pacienteid;

UPDATE Pacientes
SET SesionesCompletadas = 0
WHERE SesionesCompletadas IS NULL;

-- Verificar resultados
SELECT 
  p.pacienteid, 
  u.nombre, 
  u.apellidopaterno,
  p.sesionescompletadas,
  (SELECT COUNT(*) FROM citas c 
   WHERE c.pacienteid = p.pacienteid 
   AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada') as verificacion
FROM pacientes p
JOIN usuarios u ON p.usuarioid = u.usuarioid
ORDER BY p.sesionescompletadas DESC;
