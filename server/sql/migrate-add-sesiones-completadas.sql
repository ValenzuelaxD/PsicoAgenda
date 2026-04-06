-- Migración: Agregar y poblar columna sesionescompletadas en la tabla pacientes

-- 1. Verificar y agregar la columna si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pacientes'
      AND column_name = 'sesionescompletadas'
  ) THEN
    ALTER TABLE pacientes
    ADD COLUMN sesionescompletadas INTEGER DEFAULT 0;
    RAISE NOTICE 'Columna sesionescompletadas agregada';
  ELSE
    RAISE NOTICE 'La columna sesionescompletadas ya existe';
  END IF;
END $$;

-- 2. Poblar/Actualizar la columna con el conteo correcto de citas completadas
UPDATE pacientes p
SET sesionescompletadas = (
  SELECT COUNT(*)
  FROM citas c
  WHERE c.pacienteid = p.pacienteid
    AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
)
WHERE p.pacienteid IN (
  SELECT DISTINCT pacienteid FROM citas
);

-- 3. Verificar los resultados
SELECT 
  p.pacienteid, 
  u.nombre, 
  u.apellidopaterno, 
  p.sesionescompletadas,
  (SELECT COUNT(*) FROM citas c WHERE c.pacienteid = p.pacienteid AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada') as verificacion_conteo
FROM pacientes p
JOIN usuarios u ON p.usuarioid = u.usuarioid
ORDER BY p.sesionescompletadas DESC;
