-- Normaliza todas las citas a una duración fija de 60 minutos.
-- Ejecuta primero en entorno de pruebas.

BEGIN;

UPDATE citas
SET duracionmin = 60,
    fechamodificacion = NOW()
WHERE COALESCE(duracionmin, 60) <> 60;

COMMIT;

-- Verificación rápida
-- SELECT COUNT(*) FROM citas WHERE COALESCE(duracionmin, 60) <> 60;
