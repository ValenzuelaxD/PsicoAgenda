-- Actualizar contador de sesiones completadas para Liliana
UPDATE Pacientes p
SET SesionesCompletadas = 12
WHERE p.pacienteid IN (
  SELECT p.pacienteid 
  FROM Pacientes p
  JOIN Usuarios u ON p.usuarioid = u.usuarioid
  WHERE LOWER(u.nombre) LIKE '%liliana%'
);

-- Verificar cambio
SELECT 
  p.pacienteid,
  u.nombre,
  u.apellidopaterno,
  p.sesionescompletadas
FROM Pacientes p
JOIN Usuarios u ON p.usuarioid = u.usuarioid
WHERE LOWER(u.nombre) LIKE '%liliana%';
